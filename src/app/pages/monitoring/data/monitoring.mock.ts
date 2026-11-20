import {
  Incident,
  IncidentTimelineEvent,
  MonitoringActivity,
  MonitoringData,
  MonitoredService,
  ServiceHealthSample,
  SystemLog,
} from '../models/monitoring.models';

const ACTOR = 'Demo Operator';

const services: MonitoredService[] = [
  {
    id: 'svc-0001',
    name: 'Sample AMS App',
    type: 'application',
    description: '화면 검토용 샘플 애플리케이션입니다. 실제 AMS 서버 구성이 아닙니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
  {
    id: 'svc-0002',
    name: 'Sample AMS API',
    type: 'api',
    description: '화면 검토용 샘플 API 서비스입니다. 실제 API 게이트웨이가 아닙니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
  {
    id: 'svc-0003',
    name: 'Sample Database',
    type: 'database',
    description: '화면 검토용 샘플 데이터베이스입니다. 실제 데이터베이스 모니터링이 아닙니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
  {
    id: 'svc-0004',
    name: 'Sample Queue',
    type: 'queue',
    description: '화면 검토용 샘플 큐입니다. 실제 메시지 큐가 연결되어 있지 않습니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
  {
    id: 'svc-0005',
    name: 'Sample Storage',
    type: 'storage',
    description: '화면 검토용 샘플 스토리지입니다. 상태 샘플은 확인 불가로 남아 있습니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
  {
    id: 'svc-0006',
    name: 'Sample Worker',
    type: 'application',
    description: '화면 검토용 샘플 워커입니다. 상태 샘플이 없어 확인 불가로 표시됩니다.',
    createdAt: '2026-09-01T09:00:00+09:00',
  },
];

const samples: ServiceHealthSample[] = [
  sample('health-0001', 'svc-0001', '2026-11-18T09:00:00+09:00', 'healthy', 48),
  sample('health-0002', 'svc-0001', '2026-11-20T08:10:00+09:00', 'healthy', 42),
  sample('health-0003', 'svc-0002', '2026-11-17T10:00:00+09:00', 'healthy', 120),
  sample('health-0004', 'svc-0002', '2026-11-19T11:20:00+09:00', 'degraded', 640),
  sample('health-0005', 'svc-0002', '2026-11-20T08:12:00+09:00', 'degraded', 840),
  sample('health-0006', 'svc-0003', '2026-11-16T09:00:00+09:00', 'healthy', 18),
  sample('health-0007', 'svc-0003', '2026-11-20T08:05:00+09:00', 'healthy', 12),
  sample('health-0008', 'svc-0004', '2026-11-15T09:00:00+09:00', 'degraded', 300),
  sample('health-0009', 'svc-0004', '2026-11-19T14:00:00+09:00', 'down', null),
  sample('health-0010', 'svc-0005', '2026-11-18T08:00:00+09:00', 'unknown', null),
];

const logs: SystemLog[] = [
  entry('log-0001', 'svc-0004', '2026-11-20T08:16:00+09:00', 'error', 'QUEUE_CONNECT_FAILED', 'Sample Queue 연결이 거부되었습니다.', 'corr-queue-01', 'INC-0001', { errorCode: 'Q-503', errorCategory: 'Connection', sanitizedDetails: 'sample/queue-client.js:18 SampleQueue.connect\nError: connection reset', context: 'attempt=2, region=sample' }),
  entry('log-0002', 'svc-0004', '2026-11-20T08:18:00+09:00', 'critical', 'QUEUE_UNAVAILABLE', 'Sample Queue가 응답하지 않습니다.', 'corr-queue-01', 'INC-0001', { errorCode: 'Q-000', errorCategory: 'Availability', sanitizedDetails: 'sample/queue-health.js:4 check\nError: no response', context: 'check=sample' }),
  entry('log-0003', 'svc-0002', '2026-11-20T08:14:00+09:00', 'warning', 'API_LATENCY', 'Sample AMS API 응답이 지연되고 있습니다.', 'corr-api-07', 'INC-0002', { context: 'thresholdMs=500' }),
  entry('log-0004', 'svc-0001', '2026-11-20T08:11:00+09:00', 'info', 'APP_HEALTH', 'Sample AMS App 상태 확인이 완료되었습니다.', null, null),
  entry('log-0005', 'svc-0002', '2026-11-19T11:22:00+09:00', 'error', 'API_TIMEOUT', '요청 처리 시간이 기준을 초과했습니다.', 'corr-api-07', 'INC-0002', { errorCode: 'API-504', errorCategory: 'Timeout' }),
  entry('log-0006', 'svc-0002', '2026-11-19T11:24:00+09:00', 'warning', 'API_RETRY', '재시도가 발생했습니다.', 'corr-api-07', 'INC-0002'),
  entry('log-0007', 'svc-0003', '2026-11-19T09:00:00+09:00', 'info', 'DB_CHECKPOINT', 'Sample Database 점검 기록이 남았습니다.', null, null),
  entry('log-0008', 'svc-0006', '2026-11-19T09:30:00+09:00', 'debug', 'WORKER_IDLE', 'Sample Worker가 대기 중입니다.', null, null),
  entry('log-0009', 'svc-0001', '2026-11-18T09:05:00+09:00', 'info', 'APP_START', 'Sample AMS App이 다시 기동되었습니다.', null, 'INC-0004'),
  entry('log-0010', 'svc-0005', '2026-11-18T08:02:00+09:00', 'warning', 'STORAGE_CHECK', 'Sample Storage 상태를 확인하지 못했습니다.', null, 'INC-0005'),
  entry('log-0011', 'svc-0005', '2026-11-17T16:05:00+09:00', 'error', 'STORAGE_TIMEOUT', 'Sample Storage 응답이 없습니다.', 'corr-storage-02', 'INC-0005', { errorCode: 'ST-504', errorCategory: 'Timeout' }),
  entry('log-0012', 'svc-0003', '2026-11-17T02:00:00+09:00', 'info', 'DB_BACKUP', '백업 작업 기록이 남았습니다.', null, null),
  entry('log-0013', 'svc-0004', '2026-11-16T13:00:00+09:00', 'warning', 'QUEUE_LAG', '대기열이 증가했습니다.', 'corr-queue-02', null),
  entry('log-0014', 'svc-0002', '2026-11-16T10:00:00+09:00', 'debug', 'API_TRACE', '요청 추적 샘플입니다.', null, null),
  entry('log-0015', 'svc-0001', '2026-11-15T07:10:00+09:00', 'critical', 'APP_RESTART', 'Sample AMS App 프로세스가 재시작되었습니다.', 'corr-app-03', 'INC-0004', { errorCode: 'APP-137', errorCategory: 'Process' }),
  entry('log-0016', 'svc-0006', '2026-11-15T06:00:00+09:00', 'info', 'WORKER_CYCLE', '주기 작업이 끝났습니다.', null, null),
  entry('log-0017', 'svc-0003', '2026-11-14T18:00:00+09:00', 'warning', 'DB_SLOW', '조회 시간이 늘었습니다.', null, null),
  entry('log-0018', 'svc-0002', '2026-11-10T11:00:00+09:00', 'error', 'API_CONFIG', '설정 확인 중 오류가 기록되었습니다.', 'corr-api-old', null, { errorCode: 'API-422', errorCategory: 'Configuration' }),
  entry('log-0019', 'svc-0001', '2026-11-10T09:00:00+09:00', 'info', 'APP_DEPLOY', '샘플 배포 기록이 남았습니다.', null, null),
  entry('log-0020', 'svc-0006', '2026-10-20T09:00:00+09:00', 'debug', 'WORKER_OLD', '이전 구간의 샘플 로그입니다.', null, null),
];

const incidents: Incident[] = [
  incident('INC-0001', 'Sample Queue 연결 중단', '샘플 큐가 응답하지 않는 상태를 기록한 장애입니다.', 'critical', 'open', ['svc-0004'], 'admin-0002', '2026-11-19T14:10:00+09:00', '2026-11-20T08:20:00+09:00', null),
  incident('INC-0002', 'Sample AMS API 응답 지연', '샘플 API의 응답 지연을 기록한 장애입니다.', 'high', 'investigating', ['svc-0002'], 'admin-0005', '2026-11-19T11:30:00+09:00', '2026-11-20T08:15:00+09:00', null),
  incident('INC-0003', 'Sample Database 관찰', '샘플 데이터베이스를 관찰 중으로 표시한 장애입니다. 연결된 로그는 없습니다.', 'medium', 'monitoring', ['svc-0003'], 'admin-0001', '2026-11-16T09:30:00+09:00', '2026-11-18T10:00:00+09:00', null),
  incident('INC-0004', 'Sample AMS App 재시작', '샘플 앱 재시작을 해결로 표시한 장애입니다.', 'low', 'resolved', ['svc-0001'], null, '2026-11-15T07:00:00+09:00', '2026-11-18T09:10:00+09:00', '2026-11-18T09:10:00+09:00'),
  incident('INC-0005', 'Sample Storage 상태 확인 불가', '샘플 스토리지 상태를 확인하지 못해 등록한 장애입니다.', 'medium', 'open', ['svc-0005'], null, '2026-11-17T16:00:00+09:00', '2026-11-18T08:05:00+09:00', null),
];

const timeline: IncidentTimelineEvent[] = [
  event('timeline-0001', 'INC-0001', '2026-11-19T14:10:00+09:00', 'incident-created', '장애가 등록되었습니다.', null, '접수'),
  event('timeline-0002', 'INC-0001', '2026-11-20T08:20:00+09:00', 'note-added', '연결 재시도를 확인했습니다.', null, null),
  event('timeline-0003', 'INC-0002', '2026-11-19T11:30:00+09:00', 'incident-created', '장애가 등록되었습니다.', null, '접수'),
  event('timeline-0004', 'INC-0002', '2026-11-19T11:40:00+09:00', 'status-changed', '상태: 접수 → 조사 중', '접수', '조사 중'),
  event('timeline-0005', 'INC-0003', '2026-11-16T09:30:00+09:00', 'incident-created', '장애가 등록되었습니다.', null, '접수'),
  event('timeline-0006', 'INC-0003', '2026-11-18T10:00:00+09:00', 'status-changed', '상태: 접수 → 관찰 중', '접수', '관찰 중'),
  event('timeline-0007', 'INC-0004', '2026-11-15T07:00:00+09:00', 'incident-created', '장애가 등록되었습니다.', null, '접수'),
  event('timeline-0008', 'INC-0004', '2026-11-18T09:10:00+09:00', 'incident-resolved', '상태를 해결로 변경했습니다.', '접수', '해결'),
  event('timeline-0009', 'INC-0005', '2026-11-17T16:00:00+09:00', 'incident-created', '장애가 등록되었습니다.', null, '접수'),
];

const activities: MonitoringActivity[] = [
  activity('monitoring-activity-0001', 'incident-created', 'INC-0004', 'Sample AMS App 재시작', '2026-11-15T07:00:00+09:00', [{ field: 'Status', before: null, after: '접수' }]),
  activity('monitoring-activity-0002', 'incident-created', 'INC-0003', 'Sample Database 관찰', '2026-11-16T09:30:00+09:00', [{ field: 'Status', before: null, after: '접수' }]),
  activity('monitoring-activity-0003', 'incident-created', 'INC-0005', 'Sample Storage 상태 확인 불가', '2026-11-17T16:00:00+09:00', [{ field: 'Status', before: null, after: '접수' }]),
  activity('monitoring-activity-0004', 'incident-status-changed', 'INC-0003', 'Sample Database 관찰', '2026-11-18T10:00:00+09:00', [{ field: 'Status', before: '접수', after: '관찰 중' }]),
  activity('monitoring-activity-0005', 'incident-status-changed', 'INC-0004', 'Sample AMS App 재시작', '2026-11-18T09:10:00+09:00', [{ field: 'Status', before: '접수', after: '해결' }]),
  activity('monitoring-activity-0006', 'incident-created', 'INC-0002', 'Sample AMS API 응답 지연', '2026-11-19T11:30:00+09:00', [{ field: 'Status', before: null, after: '접수' }]),
  activity('monitoring-activity-0007', 'incident-status-changed', 'INC-0002', 'Sample AMS API 응답 지연', '2026-11-19T11:40:00+09:00', [{ field: 'Status', before: '접수', after: '조사 중' }]),
  activity('monitoring-activity-0008', 'incident-created', 'INC-0001', 'Sample Queue 연결 중단', '2026-11-19T14:10:00+09:00', [{ field: 'Status', before: null, after: '접수' }]),
];

export const MONITORING_SEED: MonitoringData = { services, samples, logs, incidents, timeline, activities };

function sample(
  id: string,
  serviceId: string,
  timestamp: string,
  status: ServiceHealthSample['status'],
  responseTimeMs: number | null,
): ServiceHealthSample {
  return { id, serviceId, timestamp, status, responseTimeMs };
}

function entry(
  id: string,
  serviceId: string,
  timestamp: string,
  level: SystemLog['level'],
  eventName: string,
  message: string,
  correlationId: string | null,
  incidentId: string | null,
  technical: { errorCode?: string; errorCategory?: string; sanitizedDetails?: string; context?: string } = {},
): SystemLog {
  return {
    id,
    serviceId,
    timestamp,
    level,
    event: eventName,
    message,
    correlationId,
    incidentId,
    errorCode: technical.errorCode ?? null,
    errorCategory: technical.errorCategory ?? null,
    sanitizedDetails: technical.sanitizedDetails ?? null,
    context: technical.context ?? null,
  };
}

function incident(
  id: string,
  title: string,
  description: string,
  severity: Incident['severity'],
  status: Incident['status'],
  affectedServiceIds: string[],
  assigneeId: string | null,
  createdAt: string,
  updatedAt: string,
  resolvedAt: string | null,
): Incident {
  return { id, title, description, severity, status, affectedServiceIds, assigneeId, createdAt, updatedAt, resolvedAt };
}

function event(
  id: string,
  incidentId: string,
  timestamp: string,
  eventType: IncidentTimelineEvent['eventType'],
  description: string,
  previousValue: string | null,
  newValue: string | null,
): IncidentTimelineEvent {
  return { id, incidentId, timestamp, eventType, actorLabel: ACTOR, description, previousValue, newValue };
}

function activity(
  id: string,
  action: MonitoringActivity['action'],
  incidentId: string,
  incidentTitle: string,
  timestamp: string,
  changes: MonitoringActivity['changes'],
): MonitoringActivity {
  return { id, action, incidentId, incidentTitle, actorLabel: ACTOR, timestamp, changes };
}
