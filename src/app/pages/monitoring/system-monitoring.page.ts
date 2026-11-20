import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminStore } from '../admin/data/admin.store';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent, StatusTone } from '../../shared/components/status-badge/status-badge.component';
import { USAGE_CLOCK, formatKst, kstDay, shiftDate } from '../usage/data/usage-dates';
import { MonitoringStore } from './data/monitoring.store';
import {
  HEALTH_STATUS_LABEL,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_STATUS_LABEL,
  Incident,
  IncidentDraft,
  IncidentSeverity,
  IncidentStatus,
  LOG_LEVELS,
  LogLevel,
  SERVICE_TYPE_LABEL,
  TIMELINE_LABEL,
  TimelineEventType,
} from './models/monitoring.models';

type TabId = 'health' | 'system-logs' | 'incidents';
type RangeId = '1' | '7' | '30' | 'custom';
type LogSort = 'timestamp' | 'level' | 'service';
type IncidentSort = 'createdAt' | 'status' | 'severity';
type Overlay =
  | { kind: 'service'; id: string; back: 'incident' | null }
  | { kind: 'log'; id: string; back: 'incident' | 'service' | null; serviceId: string | null; serviceBack: 'incident' | null }
  | { kind: 'form'; mode: 'create' | 'edit' };

interface MonitoringParams {
  tab: TabId;
  logRange: RangeId;
  logFrom: string;
  logTo: string;
  logLevel: LogLevel | 'all';
  logService: string;
  logQuery: string;
  logSort: LogSort;
  logDir: 'asc' | 'desc';
  logPage: number;
  logSize: 10 | 20 | 50;
  incidentRange: RangeId;
  incidentFrom: string;
  incidentTo: string;
  incidentStatus: IncidentStatus | 'all';
  incidentSeverity: IncidentSeverity | 'all';
  incidentService: string;
  incidentQuery: string;
  incidentSort: IncidentSort;
  incidentDir: 'asc' | 'desc';
  incidentPage: number;
  incidentSize: 10 | 20 | 50;
  incidentId: string | null;
}

@Component({
  selector: 'app-system-monitoring-page',
  standalone: true,
  imports: [IconComponent, StatusBadgeComponent],
  templateUrl: './system-monitoring.page.html',
  styleUrl: './system-monitoring.page.scss',
})
export class SystemMonitoringPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly admins = inject(AdminStore);
  protected readonly store = inject(MonitoringStore);
  protected readonly clock = USAGE_CLOCK;
  protected readonly ranges = [
    { id: '1' as const, label: 'Today' },
    { id: '7' as const, label: 'Last 7 Days' },
    { id: '30' as const, label: 'Last 30 Days' },
    { id: 'custom' as const, label: 'Custom Range' },
  ];
  protected readonly tabs = [
    { id: 'health' as const, label: 'Health' },
    { id: 'system-logs' as const, label: 'System Logs' },
    { id: 'incidents' as const, label: 'Incidents' },
  ];
  protected readonly levels = LOG_LEVELS;
  protected readonly statuses = INCIDENT_STATUSES;
  protected readonly severities = INCIDENT_SEVERITIES;
  protected readonly statusLabel = HEALTH_STATUS_LABEL;
  protected readonly incidentStatusLabel = INCIDENT_STATUS_LABEL;
  protected readonly timelineLabel = TIMELINE_LABEL;
  protected readonly params = signal<MonitoringParams>(this.readQuery(new URLSearchParams()));
  protected readonly overlay = signal<Overlay | null>(null);
  protected readonly toast = signal('');
  protected readonly formTitle = signal('');
  protected readonly formDescription = signal('');
  protected readonly formService = signal('');
  protected readonly formSeverity = signal<IncidentSeverity | ''>('');
  protected readonly formAssignee = signal('');
  protected readonly formStatus = signal<IncidentStatus>('open');
  protected readonly formNote = signal('');
  protected readonly formError = signal('');
  protected readonly statusPanel = signal(false);
  protected readonly statusDraft = signal<IncidentStatus>('open');
  protected readonly resolutionNote = signal('');
  protected readonly notePanel = signal(false);
  protected readonly noteDraft = signal('');
  protected readonly noteError = signal('');
  private toastTimer = 0;
  private trackedIncident: string | null = null;
  private pendingStatus = false;

  protected readonly assigneeOptions = computed(() => [...this.admins.admins()].sort((left, right) => left.fullName.localeCompare(right.fullName, 'ko')));
  protected readonly serviceCards = computed(() => this.store.services().map((service) => {
    const sample = this.store.latestSample(service.id);
    return {
      id: service.id,
      name: service.name,
      type: SERVICE_TYPE_LABEL[service.type],
      description: service.description,
      status: sample?.status ?? 'unknown',
      checked: sample?.timestamp ?? null,
      response: sample?.responseTimeMs ?? null,
    };
  }));
  protected readonly healthSummary = computed(() => {
    const cards = this.serviceCards();
    return {
      total: cards.length,
      healthy: cards.filter((card) => card.status === 'healthy').length,
      degraded: cards.filter((card) => card.status === 'degraded').length,
      down: cards.filter((card) => card.status === 'down').length,
      unknown: cards.filter((card) => card.status === 'unknown').length,
    };
  });
  protected readonly overall = computed(() => {
    const summary = this.healthSummary();
    if (summary.total === 0) return { title: 'Status Unknown', detail: '확인할 서비스가 없습니다.', tone: 'neutral' as StatusTone, badge: '확인 불가' };
    if (summary.down > 0) return { title: 'Service Disruption', detail: `중단 ${summary.down} · 저하 ${summary.degraded} · 확인 불가 ${summary.unknown}`, tone: 'danger' as StatusTone, badge: '중단' };
    if (summary.degraded > 0) return { title: 'Partial Service Degradation', detail: `저하 ${summary.degraded} · 정상 ${summary.healthy} · 확인 불가 ${summary.unknown}`, tone: 'warning' as StatusTone, badge: '저하' };
    if (summary.unknown > 0) return { title: 'Status Unknown', detail: `정상 ${summary.healthy} · 확인 불가 ${summary.unknown}. 일부 서비스는 상태 샘플이 없습니다.`, tone: 'neutral' as StatusTone, badge: '확인 불가' };
    return { title: 'All Systems Operational', detail: `정상 ${summary.healthy}. 샘플 상태이며 실시간 점검 결과가 아닙니다.`, tone: 'success' as StatusTone, badge: '정상' };
  });
  protected readonly logRows = computed(() => this.filterLogs());
  protected readonly logSummary = computed(() => ({
    total: this.logRows().length,
    error: this.logRows().filter((row) => row.level === 'error').length,
    warning: this.logRows().filter((row) => row.level === 'warning').length,
    critical: this.logRows().filter((row) => row.level === 'critical').length,
  }));
  protected readonly logPageCount = computed(() => Math.max(1, Math.ceil(this.logRows().length / this.params().logSize)));
  protected readonly logPage = computed(() => Math.min(this.params().logPage, this.logPageCount()));
  protected readonly logPaged = computed(() => {
    const start = (this.logPage() - 1) * this.params().logSize;
    return this.logRows().slice(start, start + this.params().logSize);
  });
  protected readonly logFiltered = computed(() => {
    const params = this.params();
    return params.logRange !== '7' || params.logLevel !== 'all' || params.logService !== 'all' || params.logQuery !== '';
  });
  protected readonly logWindowLabel = computed(() => {
    const window = this.rangeWindow(this.params().logRange, this.params().logFrom, this.params().logTo);
    return `${window.start} ~ ${window.end}`;
  });
  protected readonly incidentRows = computed(() => this.filterIncidents());
  protected readonly incidentSummary = computed(() => ({
    total: this.incidentRows().length,
    open: this.incidentRows().filter((row) => row.status !== 'resolved').length,
    critical: this.incidentRows().filter((row) => row.severity === 'critical').length,
    resolved: this.incidentRows().filter((row) => row.status === 'resolved').length,
  }));
  protected readonly incidentPageCount = computed(() => Math.max(1, Math.ceil(this.incidentRows().length / this.params().incidentSize)));
  protected readonly incidentPage = computed(() => Math.min(this.params().incidentPage, this.incidentPageCount()));
  protected readonly incidentPaged = computed(() => {
    const start = (this.incidentPage() - 1) * this.params().incidentSize;
    return this.incidentRows().slice(start, start + this.params().incidentSize);
  });
  protected readonly incidentFiltered = computed(() => {
    const params = this.params();
    return params.incidentRange !== '30' || params.incidentStatus !== 'all' || params.incidentSeverity !== 'all' || params.incidentService !== 'all' || params.incidentQuery !== '';
  });
  protected readonly incidentWindowLabel = computed(() => {
    const window = this.rangeWindow(this.params().incidentRange, this.params().incidentFrom, this.params().incidentTo);
    return `${window.start} ~ ${window.end}`;
  });
  protected readonly openIncident = computed(() => {
    const id = this.params().incidentId;
    return id ? this.store.incidents().find((item) => item.id === id) ?? null : null;
  });
  protected readonly incidentTimeline = computed(() => {
    const incident = this.openIncident();
    if (!incident) return [];
    return this.store.timeline().filter((item) => item.incidentId === incident.id).sort((left, right) => byTime(left.timestamp, right.timestamp) || left.id.localeCompare(right.id));
  });
  protected readonly incidentLogs = computed(() => {
    const incident = this.openIncident();
    if (!incident) return [];
    return this.store.logs().filter((item) => item.incidentId === incident.id).sort((left, right) => byTime(right.timestamp, left.timestamp));
  });
  protected readonly impacted = computed(() => {
    const incident = this.openIncident();
    if (!incident) return [];
    return incident.affectedServiceIds.map((id) => {
      const service = this.store.services().find((item) => item.id === id);
      return {
        id,
        name: service?.name ?? '연결된 서비스를 찾을 수 없습니다',
        type: service ? SERVICE_TYPE_LABEL[service.type] : '—',
        status: this.store.statusOf(id),
        known: !!service,
      };
    });
  });
  protected readonly serviceView = computed(() => {
    const overlay = this.overlay();
    if (overlay?.kind !== 'service') return null;
    const service = this.store.services().find((item) => item.id === overlay.id);
    if (!service) return { missing: true as const, back: overlay.back };
    const samples = this.store.samples().filter((item) => item.serviceId === service.id).sort((left, right) => byTime(right.timestamp, left.timestamp));
    const latest = samples[0] ?? null;
    return {
      missing: false as const,
      back: overlay.back,
      service,
      type: SERVICE_TYPE_LABEL[service.type],
      status: latest?.status ?? 'unknown',
      checked: latest?.timestamp ?? null,
      response: latest?.responseTimeMs ?? null,
      samples,
      logs: this.store.logs().filter((item) => item.serviceId === service.id).sort((left, right) => byTime(right.timestamp, left.timestamp)).slice(0, 5),
      incidents: this.store.incidents().filter((item) => item.affectedServiceIds.includes(service.id)).sort((left, right) => byTime(right.createdAt, left.createdAt)),
    };
  });
  protected readonly formOverlay = computed(() => {
    const overlay = this.overlay();
    return overlay?.kind === 'form' ? overlay : null;
  });
  protected readonly incidentDialog = computed(() => this.overlay() ? null : this.openIncident());
  protected readonly logView = computed(() => {
    const overlay = this.overlay();
    if (overlay?.kind !== 'log') return null;
    const log = this.store.logs().find((item) => item.id === overlay.id) ?? null;
    return {
      back: overlay.back,
      log,
      serviceName: log ? this.store.serviceName(log.serviceId) : '',
      incident: log?.incidentId ? this.store.incidents().find((item) => item.id === log.incidentId) ?? null : null,
    };
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => this.params.set(this.readQuery(query)));
    effect(() => {
      const id = this.params().incidentId;
      if (id === this.trackedIncident) return;
      this.trackedIncident = id;
      untracked(() => {
        const openStatus = this.pendingStatus;
        this.pendingStatus = false;
        this.notePanel.set(false);
        this.noteDraft.set('');
        this.noteError.set('');
        this.statusPanel.set(openStatus);
        if (openStatus && id) {
          const incident = this.store.incidents().find((item) => item.id === id);
          if (incident) this.statusDraft.set(incident.status);
          this.resolutionNote.set('');
        }
        const current = this.overlay();
        if (current?.kind === 'form' && current.mode === 'edit') this.overlay.set(null);
      });
    });
    this.destroyRef.onDestroy(() => window.clearTimeout(this.toastTimer));
  }

  protected setTab(tab: TabId): void {
    this.overlay.set(null);
    this.navigate({ ...this.params(), tab, incidentId: null });
  }

  protected setLogRange(range: RangeId): void {
    const window = range === 'custom'
      ? { logFrom: this.params().logFrom || shiftDate(USAGE_CLOCK, -6), logTo: this.params().logTo || USAGE_CLOCK }
      : { logFrom: shiftDate(USAGE_CLOCK, range === '1' ? 0 : range === '7' ? -6 : -29), logTo: USAGE_CLOCK };
    this.navigate({ ...this.params(), logRange: range, ...window, logPage: 1 });
  }

  protected setIncidentRange(range: RangeId): void {
    const window = range === 'custom'
      ? { incidentFrom: this.params().incidentFrom || shiftDate(USAGE_CLOCK, -29), incidentTo: this.params().incidentTo || USAGE_CLOCK }
      : { incidentFrom: shiftDate(USAGE_CLOCK, range === '1' ? 0 : range === '7' ? -6 : -29), incidentTo: USAGE_CLOCK };
    this.navigate({ ...this.params(), incidentRange: range, ...window, incidentPage: 1 });
  }

  protected updateLog(key: 'logFrom' | 'logTo' | 'logLevel' | 'logService' | 'logQuery', value: string): void {
    this.navigate({ ...this.params(), [key]: value, logPage: 1 });
  }

  protected updateIncident(key: 'incidentFrom' | 'incidentTo' | 'incidentStatus' | 'incidentSeverity' | 'incidentService' | 'incidentQuery', value: string): void {
    this.navigate({ ...this.params(), [key]: value, incidentPage: 1 });
  }

  protected changeLogSize(value: string): void {
    this.navigate({ ...this.params(), logSize: this.pageSize(value), logPage: 1 });
  }

  protected changeIncidentSize(value: string): void {
    this.navigate({ ...this.params(), incidentSize: this.pageSize(value), incidentPage: 1 });
  }

  protected sortLogs(sort: LogSort): void {
    const current = this.params();
    this.navigate({ ...current, logSort: sort, logDir: current.logSort === sort && current.logDir === 'desc' ? 'asc' : 'desc', logPage: 1 });
  }

  protected sortIncidents(sort: IncidentSort): void {
    const current = this.params();
    this.navigate({ ...current, incidentSort: sort, incidentDir: current.incidentSort === sort && current.incidentDir === 'desc' ? 'asc' : 'desc', incidentPage: 1 });
  }

  protected changeLogPage(page: number): void {
    this.navigate({ ...this.params(), logPage: page });
  }

  protected changeIncidentPage(page: number): void {
    this.navigate({ ...this.params(), incidentPage: page });
  }

  protected clearLogFilters(): void {
    this.navigate({
      ...this.params(),
      logRange: '7',
      logFrom: shiftDate(USAGE_CLOCK, -6),
      logTo: USAGE_CLOCK,
      logLevel: 'all',
      logService: 'all',
      logQuery: '',
      logPage: 1,
    });
  }

  protected clearIncidentFilters(): void {
    this.navigate({
      ...this.params(),
      incidentRange: '30',
      incidentFrom: shiftDate(USAGE_CLOCK, -29),
      incidentTo: USAGE_CLOCK,
      incidentStatus: 'all',
      incidentSeverity: 'all',
      incidentService: 'all',
      incidentQuery: '',
      incidentPage: 1,
    });
  }

  protected refresh(): void {
    this.store.refresh();
    this.showToast('샘플 모니터링 데이터를 다시 표시했습니다.');
  }

  protected showService(id: string, back: 'incident' | null = null): void {
    this.overlay.set({ kind: 'service', id, back });
  }

  protected showLog(id: string, source: 'list' | 'service' | 'incident'): void {
    const current = this.overlay();
    const service = current?.kind === 'service' ? current : null;
    this.overlay.set({
      kind: 'log',
      id,
      back: source === 'list' ? null : source,
      serviceId: service?.id ?? null,
      serviceBack: service?.back ?? null,
    });
  }

  protected openLogRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button')) return;
    this.showLog(id, 'list');
  }

  protected showIncident(id: string): void {
    this.overlay.set(null);
    this.navigate({ ...this.params(), tab: 'incidents', incidentId: id });
  }

  protected openIncidentRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button')) return;
    this.showIncident(id);
  }

  protected showStatus(id: string): void {
    if (this.params().incidentId === id && this.params().tab === 'incidents') {
      this.prepareStatus(id);
      return;
    }
    this.pendingStatus = true;
    this.showIncident(id);
  }

  protected closeIncident(): void {
    this.overlay.set(null);
    this.statusPanel.set(false);
    this.notePanel.set(false);
    this.navigate({ ...this.params(), incidentId: null });
  }

  protected dismiss(): void {
    const current = this.overlay();
    if (current?.kind === 'form') {
      this.overlay.set(null);
      return;
    }
    this.overlay.set(null);
    if (this.params().incidentId) this.navigate({ ...this.params(), incidentId: null });
  }

  protected goBack(): void {
    const current = this.overlay();
    if (current?.kind === 'log' && current.back === 'service' && current.serviceId) {
      this.overlay.set({ kind: 'service', id: current.serviceId, back: current.serviceBack });
      return;
    }
    this.overlay.set(null);
  }

  protected viewLogs(serviceId: string): void {
    this.overlay.set(null);
    this.navigate({ ...this.params(), tab: 'system-logs', logService: serviceId, logPage: 1, incidentId: null });
  }

  protected viewIncidents(serviceId: string): void {
    this.overlay.set(null);
    this.navigate({ ...this.params(), tab: 'incidents', incidentService: serviceId, incidentPage: 1, incidentId: null });
  }

  protected openCreate(): void {
    this.resetForm();
    this.overlay.set({ kind: 'form', mode: 'create' });
    if (this.params().incidentId) this.navigate({ ...this.params(), incidentId: null });
  }

  protected openEdit(): void {
    const incident = this.openIncident();
    if (!incident) return;
    this.formTitle.set(incident.title);
    this.formDescription.set(incident.description);
    this.formService.set(incident.affectedServiceIds[0] ?? '');
    this.formSeverity.set(incident.severity);
    this.formAssignee.set(incident.assigneeId ?? '');
    this.formStatus.set(incident.status);
    this.formNote.set('');
    this.formError.set('');
    this.statusPanel.set(false);
    this.notePanel.set(false);
    this.overlay.set({ kind: 'form', mode: 'edit' });
  }

  protected saveForm(): void {
    const current = this.overlay();
    if (current?.kind !== 'form') return;
    const draft = this.validatedDraft();
    if (typeof draft === 'string') {
      this.formError.set(draft);
      return;
    }
    if (current.mode === 'create') {
      const saved = this.store.createIncident(draft, (id) => this.assigneeName(id));
      if (saved.result !== 'saved' || !saved.id) {
        this.formError.set('입력값을 확인하세요.');
        return;
      }
      this.overlay.set(null);
      this.navigate({ ...this.params(), tab: 'incidents', incidentId: saved.id, incidentPage: 1 });
      this.showToast('장애를 등록했습니다.');
      return;
    }
    const result = this.store.updateIncident(this.params().incidentId ?? '', draft, (id) => this.assigneeName(id));
    if (result === 'unchanged') {
      this.overlay.set(null);
      this.showToast('변경된 내용이 없습니다.');
      return;
    }
    if (result !== 'saved') {
      this.formError.set('입력값을 확인하세요.');
      return;
    }
    this.overlay.set(null);
    this.showToast('장애 정보를 수정했습니다.');
  }

  protected saveStatus(): void {
    const incident = this.openIncident();
    if (!incident) return;
    const result = this.store.changeStatus(incident.id, this.statusDraft(), this.statusDraft() === 'resolved' ? this.resolutionNote() : null);
    if (result === 'unchanged') {
      this.statusPanel.set(false);
      this.showToast('상태가 같습니다.');
      return;
    }
    if (result !== 'saved') return;
    this.statusPanel.set(false);
    this.resolutionNote.set('');
    this.showToast('장애 상태를 변경했습니다.');
  }

  protected saveNote(): void {
    const incident = this.openIncident();
    if (!incident) return;
    const result = this.store.addNote(incident.id, this.noteDraft());
    if (result === 'invalid') {
      this.noteError.set('메모를 입력하세요.');
      return;
    }
    if (result !== 'saved') return;
    this.noteDraft.set('');
    this.noteError.set('');
    this.notePanel.set(false);
    this.showToast('타임라인에 메모를 추가했습니다.');
  }

  protected copyValue(value: string, event: Event): void {
    event.stopPropagation();
    void navigator.clipboard.writeText(value).then(
      () => this.showToast('Correlation ID를 복사했습니다.'),
      () => this.showToast('복사하지 못했습니다.'),
    );
  }

  protected assigneeName(id: string | null): string {
    if (!id) return '미지정';
    return this.admins.admins().find((item) => item.id === id)?.fullName ?? '미지정';
  }

  protected responseLabel(value: number | null): string {
    return value === null ? '—' : `${value} ms`;
  }

  protected formatStamp(value: string | null): string {
    return value ? formatKst(value) : '—';
  }

  protected redact(value: string | null): string {
    if (!value) return '';
    return value.replace(/(sk-[A-Za-z0-9_-]+|Bearer\s+\S+|password\s*[:=]\s*\S+|api[_-]?key\s*[:=]\s*\S+|token\s*[:=]\s*\S+)/gi, '••••');
  }

  protected pages(count: number): number[] {
    return Array.from({ length: count }, (_, index) => index + 1);
  }

  protected healthTone(status: string): StatusTone {
    if (status === 'healthy') return 'success';
    if (status === 'degraded') return 'warning';
    if (status === 'down') return 'danger';
    return 'neutral';
  }

  protected levelTone(level: LogLevel): StatusTone {
    if (level === 'warning') return 'warning';
    if (level === 'error' || level === 'critical') return 'danger';
    if (level === 'info') return 'info';
    return 'neutral';
  }

  protected severityTone(severity: IncidentSeverity): StatusTone {
    if (severity === 'critical') return 'danger';
    if (severity === 'high') return 'warning';
    return 'neutral';
  }

  protected incidentTone(status: IncidentStatus): StatusTone {
    if (status === 'resolved') return 'success';
    if (status === 'open') return 'warning';
    return 'info';
  }

  protected timelineText(type: TimelineEventType): string {
    return TIMELINE_LABEL[type];
  }

  private prepareStatus(id: string): void {
    const incident = this.store.incidents().find((item) => item.id === id);
    if (!incident) return;
    this.statusDraft.set(incident.status);
    this.resolutionNote.set('');
    this.notePanel.set(false);
    this.statusPanel.set(true);
  }

  private resetForm(): void {
    this.formTitle.set('');
    this.formDescription.set('');
    this.formService.set('');
    this.formSeverity.set('');
    this.formAssignee.set('');
    this.formStatus.set('open');
    this.formNote.set('');
    this.formError.set('');
  }

  private validatedDraft(): IncidentDraft | string {
    const title = this.formTitle().trim();
    const description = this.formDescription().trim();
    const serviceId = this.formService();
    const severity = this.formSeverity();
    if (!title) return '제목을 입력하세요.';
    if (!description) return '설명을 입력하세요.';
    if (!this.store.services().some((item) => item.id === serviceId)) return '영향 서비스를 선택하세요.';
    if (!severity) return '심각도를 선택하세요.';
    return {
      title,
      description,
      serviceId,
      severity,
      assigneeId: this.formAssignee() || null,
      status: this.formStatus(),
      resolutionNote: this.formNote().trim() || null,
    };
  }

  private filterLogs() {
    const params = this.params();
    const window = this.rangeWindow(params.logRange, params.logFrom, params.logTo);
    const query = params.logQuery.trim().toLowerCase();
    const rows = this.store.logs().filter((log) => {
      const day = kstDay(log.timestamp);
      const haystack = [log.id, log.event, log.message, log.correlationId ?? ''].join(' ').toLowerCase();
      return day >= window.start && day <= window.end
        && (params.logLevel === 'all' || log.level === params.logLevel)
        && (params.logService === 'all' || log.serviceId === params.logService)
        && (!query || haystack.includes(query));
    });
    const direction = params.logDir === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compareLogs(left, right, params.logSort) * direction);
  }

  private filterIncidents(): Incident[] {
    const params = this.params();
    const window = this.rangeWindow(params.incidentRange, params.incidentFrom, params.incidentTo);
    const query = params.incidentQuery.trim().toLowerCase();
    const rows = this.store.incidents().filter((incident) => {
      const day = kstDay(incident.createdAt);
      const services = incident.affectedServiceIds.map((id) => this.store.serviceName(id)).join(' ');
      const haystack = [incident.id, incident.title, incident.description, services].join(' ').toLowerCase();
      return day >= window.start && day <= window.end
        && (params.incidentStatus === 'all' || incident.status === params.incidentStatus)
        && (params.incidentSeverity === 'all' || incident.severity === params.incidentSeverity)
        && (params.incidentService === 'all' || incident.affectedServiceIds.includes(params.incidentService))
        && (!query || haystack.includes(query));
    });
    const direction = params.incidentDir === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compareIncidents(left, right, params.incidentSort) * direction);
  }

  private compareLogs(left: { timestamp: string; level: LogLevel; serviceId: string }, right: { timestamp: string; level: LogLevel; serviceId: string }, sort: LogSort): number {
    if (sort === 'level') return LOG_LEVELS.indexOf(left.level) - LOG_LEVELS.indexOf(right.level);
    if (sort === 'service') return this.store.serviceName(left.serviceId).localeCompare(this.store.serviceName(right.serviceId), 'ko');
    return byTime(left.timestamp, right.timestamp);
  }

  private compareIncidents(left: Incident, right: Incident, sort: IncidentSort): number {
    if (sort === 'status') return INCIDENT_STATUSES.indexOf(left.status) - INCIDENT_STATUSES.indexOf(right.status);
    if (sort === 'severity') return INCIDENT_SEVERITIES.indexOf(left.severity) - INCIDENT_SEVERITIES.indexOf(right.severity);
    return byTime(left.createdAt, right.createdAt);
  }

  private rangeWindow(range: RangeId, from: string, to: string): { start: string; end: string } {
    if (range === 'custom') {
      const start = from || USAGE_CLOCK;
      const end = to || USAGE_CLOCK;
      return start <= end ? { start, end } : { start: end, end: start };
    }
    const length = range === '1' ? 0 : range === '7' ? 6 : 29;
    return { start: shiftDate(USAGE_CLOCK, -length), end: USAGE_CLOCK };
  }

  private readQuery(query: { get(name: string): string | null }): MonitoringParams {
    const tab = query.get('tab');
    const logRange = query.get('lr');
    const incidentRange = query.get('ir');
    const logSort = query.get('lsort');
    const incidentSort = query.get('isort');
    const level = query.get('ll');
    const status = query.get('ist');
    const severity = query.get('isv');
    return {
      tab: tab === 'system-logs' || tab === 'incidents' ? tab : 'health',
      logRange: logRange === '1' || logRange === '30' || logRange === 'custom' ? logRange : '7',
      logFrom: query.get('lf') || shiftDate(USAGE_CLOCK, -6),
      logTo: query.get('lt') || USAGE_CLOCK,
      logLevel: LOG_LEVELS.includes(level as LogLevel) ? level as LogLevel : 'all',
      logService: query.get('ls') || 'all',
      logQuery: query.get('lq') ?? '',
      logSort: logSort === 'level' || logSort === 'service' ? logSort : 'timestamp',
      logDir: query.get('ldir') === 'asc' ? 'asc' : 'desc',
      logPage: Math.max(1, Number(query.get('lpage')) || 1),
      logSize: this.pageSize(query.get('lsize')),
      incidentRange: incidentRange === '1' || incidentRange === '7' || incidentRange === 'custom' ? incidentRange : '30',
      incidentFrom: query.get('ifrom') || shiftDate(USAGE_CLOCK, -29),
      incidentTo: query.get('ito') || USAGE_CLOCK,
      incidentStatus: INCIDENT_STATUSES.includes(status as IncidentStatus) ? status as IncidentStatus : 'all',
      incidentSeverity: INCIDENT_SEVERITIES.includes(severity as IncidentSeverity) ? severity as IncidentSeverity : 'all',
      incidentService: query.get('isvc') || 'all',
      incidentQuery: query.get('iq') ?? '',
      incidentSort: incidentSort === 'status' || incidentSort === 'severity' ? incidentSort : 'createdAt',
      incidentDir: query.get('idir') === 'asc' ? 'asc' : 'desc',
      incidentPage: Math.max(1, Number(query.get('ipage')) || 1),
      incidentSize: this.pageSize(query.get('isize')),
      incidentId: query.get('incident'),
    };
  }

  private navigate(params: MonitoringParams): void {
    const query: Record<string, string | null> = {
      tab: params.tab === 'health' ? null : params.tab,
      lr: params.logRange === '7' ? null : params.logRange,
      lf: params.logRange === 'custom' ? params.logFrom : null,
      lt: params.logRange === 'custom' ? params.logTo : null,
      ll: params.logLevel === 'all' ? null : params.logLevel,
      ls: params.logService === 'all' ? null : params.logService,
      lq: params.logQuery || null,
      lsort: params.logSort === 'timestamp' ? null : params.logSort,
      ldir: params.logDir === 'desc' ? null : 'asc',
      lpage: params.logPage > 1 ? String(params.logPage) : null,
      lsize: params.logSize === 20 ? null : String(params.logSize),
      ir: params.incidentRange === '30' ? null : params.incidentRange,
      ifrom: params.incidentRange === 'custom' ? params.incidentFrom : null,
      ito: params.incidentRange === 'custom' ? params.incidentTo : null,
      ist: params.incidentStatus === 'all' ? null : params.incidentStatus,
      isv: params.incidentSeverity === 'all' ? null : params.incidentSeverity,
      isvc: params.incidentService === 'all' ? null : params.incidentService,
      iq: params.incidentQuery || null,
      isort: params.incidentSort === 'createdAt' ? null : params.incidentSort,
      idir: params.incidentDir === 'desc' ? null : 'asc',
      ipage: params.incidentPage > 1 ? String(params.incidentPage) : null,
      isize: params.incidentSize === 20 ? null : String(params.incidentSize),
      incident: params.incidentId,
    };
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private pageSize(value: string | null): 10 | 20 | 50 {
    return value === '10' || value === '50' ? Number(value) as 10 | 50 : 20;
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}

function byTime(left: string, right: string): number {
  return Date.parse(left) - Date.parse(right);
}
