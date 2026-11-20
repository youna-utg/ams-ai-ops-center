import { Injectable, computed, signal } from '@angular/core';
import { MONITORING_SEED } from './monitoring.mock';
import {
  HealthStatus,
  INCIDENT_STATUS_LABEL,
  Incident,
  IncidentDraft,
  IncidentTimelineEvent,
  MonitoringActivity,
  MonitoringActivityAction,
  MonitoringChange,
  MonitoringData,
  SaveResult,
  ServiceHealthSample,
  TimelineEventType,
} from '../models/monitoring.models';

const ACTOR = 'Demo Operator';

@Injectable({ providedIn: 'root' })
export class MonitoringStore {
  private readonly state = signal<MonitoringData>(copy(MONITORING_SEED));
  private readonly revision = signal(0);

  readonly services = computed(() => {
    this.revision();
    return this.state().services;
  });
  readonly samples = computed(() => {
    this.revision();
    return this.state().samples;
  });
  readonly logs = computed(() => {
    this.revision();
    return this.state().logs;
  });
  readonly incidents = computed(() => {
    this.revision();
    return this.state().incidents;
  });
  readonly timeline = computed(() => {
    this.revision();
    return this.state().timeline;
  });
  readonly activities = computed(() => {
    this.revision();
    return this.state().activities;
  });

  refresh(): void {
    this.revision.update((value) => value + 1);
  }

  latestSample(serviceId: string): ServiceHealthSample | null {
    return this.samples()
      .filter((item) => item.serviceId === serviceId)
      .sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp))[0] ?? null;
  }

  statusOf(serviceId: string): HealthStatus {
    return this.latestSample(serviceId)?.status ?? 'unknown';
  }

  serviceName(serviceId: string): string {
    return this.services().find((item) => item.id === serviceId)?.name ?? serviceId;
  }

  createIncident(draft: IncidentDraft, assigneeName: (id: string | null) => string): { result: SaveResult; id: string | null } {
    if (!this.valid(draft)) return { result: 'invalid', id: null };
    const now = kstNow();
    let createdId: string | null = null;
    this.update((data) => {
      const id = nextId('INC', data.incidents.map((item) => item.id));
      createdId = id;
      const created: Incident = {
        id,
        title: draft.title.trim(),
        description: draft.description.trim(),
        severity: draft.severity,
        status: draft.status,
        affectedServiceIds: [draft.serviceId],
        assigneeId: draft.assigneeId,
        createdAt: now,
        updatedAt: now,
        resolvedAt: draft.status === 'resolved' ? now : null,
      };
      data.incidents = [created, ...data.incidents];
      this.pushTimeline(data, created.id, now, 'incident-created', '장애가 등록되었습니다.', null, INCIDENT_STATUS_LABEL[draft.status]);
      if (draft.status === 'resolved') {
        const note = draft.resolutionNote?.trim();
        this.pushTimeline(data, created.id, now, 'incident-resolved', note ? `상태를 해결로 변경했습니다. ${note}` : '상태를 해결로 변경했습니다.', null, INCIDENT_STATUS_LABEL.resolved);
      }
      this.pushActivity(data, 'incident-created', created, now, [
        { field: 'Status', before: null, after: INCIDENT_STATUS_LABEL[draft.status] },
        { field: 'Severity', before: null, after: draft.severity },
        { field: 'Affected Service', before: null, after: this.serviceName(draft.serviceId) },
        { field: 'Assignee', before: null, after: assigneeName(draft.assigneeId) },
      ]);
    });
    return { result: 'saved', id: createdId };
  }

  updateIncident(id: string, draft: IncidentDraft, assigneeName: (id: string | null) => string): SaveResult {
    const current = this.state().incidents.find((item) => item.id === id);
    if (!current) return 'missing';
    if (!draft.title.trim() || !draft.description.trim() || !this.services().some((item) => item.id === draft.serviceId)) return 'invalid';
    const nextService = draft.serviceId;
    const previousService = current.affectedServiceIds[0] ?? '';
    const titleChanged = current.title !== draft.title.trim();
    const descriptionChanged = current.description !== draft.description.trim();
    const serviceChanged = previousService !== nextService;
    const severityChanged = current.severity !== draft.severity;
    const assigneeChanged = current.assigneeId !== draft.assigneeId;
    if (!titleChanged && !descriptionChanged && !serviceChanged && !severityChanged && !assigneeChanged) return 'unchanged';
    const now = kstNow();
    this.update((data) => {
      const incident = data.incidents.find((item) => item.id === id);
      if (!incident) return;
      incident.title = draft.title.trim();
      incident.description = draft.description.trim();
      incident.affectedServiceIds = [nextService];
      incident.severity = draft.severity;
      incident.assigneeId = draft.assigneeId;
      incident.updatedAt = now;
      const detailChanges: MonitoringChange[] = [];
      if (titleChanged) detailChanges.push({ field: 'Title', before: current.title, after: incident.title });
      if (descriptionChanged) detailChanges.push({ field: 'Description', before: current.description, after: incident.description });
      if (serviceChanged) detailChanges.push({ field: 'Affected Service', before: this.serviceName(previousService), after: this.serviceName(nextService) });
      if (detailChanges.length) {
        this.pushTimeline(data, id, now, 'incident-updated', '제목, 설명 또는 영향 서비스를 수정했습니다.', null, null);
        this.pushActivity(data, 'incident-updated', incident, now, detailChanges);
      }
      if (severityChanged) {
        this.pushTimeline(data, id, now, 'severity-changed', `심각도: ${current.severity} → ${draft.severity}`, current.severity, draft.severity);
        this.pushActivity(data, 'incident-severity-changed', incident, now, [{ field: 'Severity', before: current.severity, after: draft.severity }]);
      }
      if (assigneeChanged) {
        const before = assigneeName(current.assigneeId);
        const after = assigneeName(draft.assigneeId);
        this.pushTimeline(data, id, now, 'assignee-changed', `담당자: ${before} → ${after}`, before, after);
        this.pushActivity(data, 'incident-assignee-changed', incident, now, [{ field: 'Assignee', before, after }]);
      }
    });
    return 'saved';
  }

  changeStatus(id: string, status: Incident['status'], resolutionNote: string | null): SaveResult {
    const current = this.state().incidents.find((item) => item.id === id);
    if (!current) return 'missing';
    if (current.status === status) return 'unchanged';
    const now = kstNow();
    const before = INCIDENT_STATUS_LABEL[current.status];
    const after = INCIDENT_STATUS_LABEL[status];
    const note = resolutionNote?.trim() ?? '';
    this.update((data) => {
      const incident = data.incidents.find((item) => item.id === id);
      if (!incident) return;
      incident.status = status;
      incident.updatedAt = now;
      incident.resolvedAt = status === 'resolved' ? now : null;
      const description = status === 'resolved'
        ? note ? `상태를 해결로 변경했습니다. ${note}` : '상태를 해결로 변경했습니다.'
        : `상태: ${before} → ${after}`;
      this.pushTimeline(data, id, now, status === 'resolved' ? 'incident-resolved' : 'status-changed', description, before, after);
      this.pushActivity(data, 'incident-status-changed', incident, now, [{ field: 'Status', before, after }]);
    });
    return 'saved';
  }

  addNote(id: string, note: string): SaveResult {
    const text = note.trim();
    const current = this.state().incidents.find((item) => item.id === id);
    if (!current) return 'missing';
    if (!text) return 'invalid';
    const now = kstNow();
    this.update((data) => {
      const incident = data.incidents.find((item) => item.id === id);
      if (!incident) return;
      incident.updatedAt = now;
      this.pushTimeline(data, id, now, 'note-added', text, null, null);
    });
    return 'saved';
  }

  private valid(draft: IncidentDraft): boolean {
    return !!draft.title.trim()
      && !!draft.description.trim()
      && !!draft.severity
      && !!draft.status
      && this.services().some((item) => item.id === draft.serviceId);
  }

  private pushTimeline(
    data: MonitoringData,
    incidentId: string,
    timestamp: string,
    eventType: TimelineEventType,
    description: string,
    previousValue: string | null,
    newValue: string | null,
  ): void {
    const row: IncidentTimelineEvent = {
      id: nextId('timeline', data.timeline.map((item) => item.id)),
      incidentId,
      timestamp,
      eventType,
      actorLabel: ACTOR,
      description,
      previousValue,
      newValue,
    };
    data.timeline = [...data.timeline, row];
  }

  private pushActivity(
    data: MonitoringData,
    action: MonitoringActivityAction,
    incident: Incident,
    timestamp: string,
    changes: MonitoringChange[],
  ): void {
    const row: MonitoringActivity = {
      id: nextId('monitoring-activity', data.activities.map((item) => item.id)),
      action,
      incidentId: incident.id,
      incidentTitle: incident.title,
      actorLabel: ACTOR,
      timestamp,
      changes,
    };
    data.activities = [...data.activities, row];
  }

  private update(recipe: (data: MonitoringData) => void): void {
    const next = copy(this.state());
    recipe(next);
    this.state.set(next);
  }
}

function copy(data: MonitoringData): MonitoringData {
  return {
    services: data.services.map((item) => ({ ...item })),
    samples: data.samples.map((item) => ({ ...item })),
    logs: data.logs.map((item) => ({ ...item })),
    incidents: data.incidents.map((item) => ({ ...item, affectedServiceIds: [...item.affectedServiceIds] })),
    timeline: data.timeline.map((item) => ({ ...item })),
    activities: data.activities.map((item) => ({ ...item, changes: item.changes.map((change) => ({ ...change })) })),
  };
}

function kstNow(): string {
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
  return `${parts.replace(' ', 'T')}+09:00`;
}

function nextId(prefix: string, ids: readonly string[]): string {
  const maximum = ids.reduce((result, id) => {
    const digits = id.match(/\d+/g);
    return Math.max(result, digits ? Number(digits.join('')) : 0);
  }, 0);
  return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
}
