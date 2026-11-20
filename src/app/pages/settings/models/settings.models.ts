export const TIMEZONES = ['Asia/Seoul', 'UTC', 'America/Los_Angeles', 'Europe/London'] as const;
export type TimezoneId = (typeof TIMEZONES)[number];

export const DATE_FORMATS = ['YYYY-MM-DD', 'MM/DD/YYYY', 'DD/MM/YYYY'] as const;
export type DateFormatId = (typeof DATE_FORMATS)[number];

export const PAGE_SIZES = [10, 20, 50] as const;
export type PageSize = (typeof PAGE_SIZES)[number];

export const LANDING_PAGES = [
  { id: 'dashboard', label: 'Dashboard', path: '/overview' },
  { id: 'organizations', label: 'Organizations', path: '/organizations' },
  { id: 'products', label: 'Products', path: '/products' },
  { id: 'usage-costs', label: 'Usage & Costs', path: '/usage-costs' },
] as const;
export type LandingId = (typeof LANDING_PAGES)[number]['id'];

export const DEMO_PREFERENCE_ID = 'demo-administrator';
export const DEMO_ACTOR = 'Demo Administrator';

export const SAMPLE_STAMP = '2026-11-20T10:00:00+09:00';

export type SettingsTab = 'general' | 'notifications' | 'preferences';
export type RuleId =
  | 'product-access-expiry'
  | 'incident-notifications'
  | 'product-status'
  | 'provider-model-status'
  | 'admin-permission';
export type ReminderTiming = '7-days' | 'on-date';
export type IncidentNotice = 'created' | 'status-changed' | 'critical';
export type SettingsAction = 'general-updated' | 'notifications-updated' | 'preferences-updated';

export interface GeneralSettings {
  workspaceDisplayName: string;
  workspaceDescription: string;
  defaultTimezone: TimezoneId;
  defaultDateFormat: DateFormatId;
  updatedAt: string;
}

export interface NotificationRule {
  id: RuleId;
  enabled: boolean;
  timings: ReminderTiming[];
  events: IncidentNotice[];
}

export interface NotificationSettings {
  rules: NotificationRule[];
  updatedAt: string;
}

export interface AdminPreferences {
  adminId: string;
  preferredTimezone: TimezoneId | 'system';
  preferredDateFormat: DateFormatId | 'system';
  defaultPageSize: PageSize;
  defaultLandingPage: LandingId;
  updatedAt: string;
}

export interface SettingsChange {
  field: string;
  before: string | null;
  after: string | null;
}

export interface SettingsActivity {
  id: string;
  timestamp: string;
  action: SettingsAction;
  actorLabel: string;
  summary: string;
  changes: SettingsChange[];
}

export interface SettingsData {
  general: GeneralSettings;
  notifications: NotificationSettings;
  preferences: AdminPreferences;
  activities: SettingsActivity[];
}

export type SaveResult =
  | { status: 'saved' }
  | { status: 'unchanged' }
  | { status: 'invalid'; message: string };

export const ENVIRONMENT_INFO = [
  { label: 'Environment', value: 'Frontend Prototype' },
  { label: 'Data Source', value: 'Mock Data' },
  { label: 'Backend Connection', value: 'Not Connected' },
  { label: 'Notification Delivery', value: 'Not Configured' },
] as const;

export interface DeliveryChannel {
  id: 'in-app' | 'email' | 'slack';
  label: string;
  statusLabel: string;
  tone: 'info' | 'neutral';
  detail: string;
}

export const DELIVERY_CHANNELS: readonly DeliveryChannel[] = [
  {
    id: 'in-app',
    label: 'In-App',
    statusLabel: '데모 전용',
    tone: 'info',
    detail: '이 화면의 미리보기로만 확인할 수 있습니다.',
  },
  {
    id: 'email',
    label: 'Email',
    statusLabel: '설정되지 않음',
    tone: 'neutral',
    detail: '메일 서버는 연결되어 있지 않습니다.',
  },
  {
    id: 'slack',
    label: 'Slack',
    statusLabel: '설정되지 않음',
    tone: 'neutral',
    detail: 'Slack 연결은 없습니다.',
  },
];

export interface NoticePreview {
  id: string;
  ruleId: RuleId;
  label: string;
  title: string;
  message: string;
}

export const NOTICE_PREVIEWS: readonly NoticePreview[] = [
  {
    id: 'product-access-expiry',
    ruleId: 'product-access-expiry',
    label: 'Product Access Expiry',
    title: 'Product access expires soon',
    message: 'A product access period is approaching its end date.',
  },
  {
    id: 'incident-created',
    ruleId: 'incident-notifications',
    label: 'Incident Created',
    title: 'Incident created',
    message: 'A sample incident was registered in System Monitoring.',
  },
  {
    id: 'incident-status-changed',
    ruleId: 'incident-notifications',
    label: 'Incident Status Changed',
    title: 'Incident status changed',
    message: 'A sample incident status was updated.',
  },
  {
    id: 'critical-incident',
    ruleId: 'incident-notifications',
    label: 'Critical Incident',
    title: 'Critical incident',
    message: 'A sample incident is marked critical.',
  },
  {
    id: 'product-status',
    ruleId: 'product-status',
    label: 'Product Status Changes',
    title: 'Product status changed',
    message: 'A sample product status changed.',
  },
  {
    id: 'provider-model-status',
    ruleId: 'provider-model-status',
    label: 'Provider & Model Status Changes',
    title: 'Provider status changed',
    message: 'A sample provider or model status changed.',
  },
  {
    id: 'admin-permission',
    ruleId: 'admin-permission',
    label: 'Admin & Permission Changes',
    title: 'Permission changed',
    message: 'A sample admin permission change was recorded.',
  },
];

const TIMING_ORDER: readonly ReminderTiming[] = ['7-days', 'on-date'];
const EVENT_ORDER: readonly IncidentNotice[] = ['created', 'status-changed', 'critical'];

export const TIMING_LABEL: Record<ReminderTiming, string> = {
  '7-days': '7일 전',
  'on-date': '종료일 당일',
};

export const EVENT_LABEL: Record<IncidentNotice, string> = {
  created: '장애 등록',
  'status-changed': '상태 변경',
  critical: 'Critical 장애',
};

export function formatSample(timezone: string, format: DateFormatId): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(SAMPLE_STAMP));
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const year = read('year');
  const month = read('month');
  const day = read('day');
  const date = format === 'MM/DD/YYYY' ? `${month}/${day}/${year}` : format === 'DD/MM/YYYY' ? `${day}/${month}/${year}` : `${year}-${month}-${day}`;
  return `${date} ${read('hour')}:${read('minute')}`;
}

export function landingPath(id: LandingId): string {
  return LANDING_PAGES.find((page) => page.id === id)?.path ?? '/overview';
}

export function landingLabel(id: LandingId): string {
  return LANDING_PAGES.find((page) => page.id === id)?.label ?? 'Dashboard';
}

export function normalizeGeneral(value: GeneralSettings): GeneralSettings {
  return {
    ...value,
    workspaceDisplayName: value.workspaceDisplayName.trim(),
    workspaceDescription: value.workspaceDescription.trim(),
  };
}

export function normalizeRule(rule: NotificationRule): NotificationRule {
  return {
    ...rule,
    timings: TIMING_ORDER.filter((item) => rule.timings.includes(item)),
    events: EVENT_ORDER.filter((item) => rule.events.includes(item)),
  };
}

export function normalizeNotifications(value: NotificationSettings): NotificationSettings {
  return { ...value, rules: value.rules.map((rule) => normalizeRule(rule)) };
}

export function sameGeneral(left: GeneralSettings, right: GeneralSettings): boolean {
  const a = normalizeGeneral(left);
  const b = normalizeGeneral(right);
  return a.workspaceDisplayName === b.workspaceDisplayName
    && a.workspaceDescription === b.workspaceDescription
    && a.defaultTimezone === b.defaultTimezone
    && a.defaultDateFormat === b.defaultDateFormat;
}

export function sameNotifications(left: NotificationSettings, right: NotificationSettings): boolean {
  const a = normalizeNotifications(left).rules;
  const b = normalizeNotifications(right).rules;
  if (a.length !== b.length) return false;
  return a.every((rule, index) => {
    const other = b[index];
    return !!other
      && rule.id === other.id
      && rule.enabled === other.enabled
      && rule.timings.join() === other.timings.join()
      && rule.events.join() === other.events.join();
  });
}

export function samePreferences(left: AdminPreferences, right: AdminPreferences): boolean {
  return left.preferredTimezone === right.preferredTimezone
    && left.preferredDateFormat === right.preferredDateFormat
    && left.defaultPageSize === right.defaultPageSize
    && left.defaultLandingPage === right.defaultLandingPage;
}
