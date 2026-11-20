export type HealthStatus = 'healthy' | 'degraded' | 'down' | 'unknown';
export type ServiceType = 'application' | 'api' | 'database' | 'queue' | 'storage';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type IncidentStatus = 'open' | 'investigating' | 'monitoring' | 'resolved';
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TimelineEventType =
  | 'incident-created'
  | 'status-changed'
  | 'assignee-changed'
  | 'severity-changed'
  | 'note-added'
  | 'incident-resolved'
  | 'incident-updated';

export type MonitoringActivityAction =
  | 'incident-created'
  | 'incident-updated'
  | 'incident-status-changed'
  | 'incident-severity-changed'
  | 'incident-assignee-changed';

export interface MonitoredService {
  id: string;
  name: string;
  type: ServiceType;
  description: string;
  createdAt: string;
}

export interface ServiceHealthSample {
  id: string;
  serviceId: string;
  timestamp: string;
  status: HealthStatus;
  responseTimeMs: number | null;
}

export interface SystemLog {
  id: string;
  serviceId: string;
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
  correlationId: string | null;
  errorCode: string | null;
  errorCategory: string | null;
  sanitizedDetails: string | null;
  context: string | null;
  incidentId: string | null;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  affectedServiceIds: readonly string[];
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface IncidentTimelineEvent {
  id: string;
  incidentId: string;
  timestamp: string;
  eventType: TimelineEventType;
  actorLabel: string;
  description: string;
  previousValue: string | null;
  newValue: string | null;
}

export interface MonitoringChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface MonitoringActivity {
  id: string;
  action: MonitoringActivityAction;
  incidentId: string;
  incidentTitle: string;
  actorLabel: string;
  timestamp: string;
  changes: readonly MonitoringChange[];
}

export interface MonitoringData {
  services: MonitoredService[];
  samples: ServiceHealthSample[];
  logs: SystemLog[];
  incidents: Incident[];
  timeline: IncidentTimelineEvent[];
  activities: MonitoringActivity[];
}

export interface IncidentDraft {
  title: string;
  description: string;
  serviceId: string;
  severity: IncidentSeverity;
  assigneeId: string | null;
  status: IncidentStatus;
  resolutionNote: string | null;
}

export type SaveResult = 'saved' | 'invalid' | 'unchanged' | 'missing';

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  application: 'Application',
  api: 'API Service',
  database: 'Database',
  queue: 'Queue',
  storage: 'Storage',
};

export const HEALTH_STATUS_LABEL: Record<HealthStatus, string> = {
  healthy: '정상',
  degraded: '저하',
  down: '중단',
  unknown: '확인 불가',
};

export const INCIDENT_STATUS_LABEL: Record<IncidentStatus, string> = {
  open: '접수',
  investigating: '조사 중',
  monitoring: '관찰 중',
  resolved: '해결',
};

export const TIMELINE_LABEL: Record<TimelineEventType, string> = {
  'incident-created': 'Incident Created',
  'status-changed': 'Status Changed',
  'assignee-changed': 'Assignee Changed',
  'severity-changed': 'Severity Changed',
  'note-added': 'Note Added',
  'incident-resolved': 'Incident Resolved',
  'incident-updated': 'Incident Updated',
};

export const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warning', 'error', 'critical'];
export const INCIDENT_STATUSES: readonly IncidentStatus[] = ['open', 'investigating', 'monitoring', 'resolved'];
export const INCIDENT_SEVERITIES: readonly IncidentSeverity[] = ['critical', 'high', 'medium', 'low'];
