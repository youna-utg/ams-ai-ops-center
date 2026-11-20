import { Injectable, computed, signal } from '@angular/core';
import {
  DATE_FORMATS,
  DEMO_ACTOR,
  EVENT_LABEL,
  GeneralSettings,
  LANDING_PAGES,
  NotificationSettings,
  PAGE_SIZES,
  RuleId,
  SaveResult,
  SettingsActivity,
  SettingsChange,
  TIMING_LABEL,
  TIMEZONES,
  TimezoneId,
  AdminPreferences,
  landingLabel,
  normalizeGeneral,
  normalizeNotifications,
  sameGeneral,
  sameNotifications,
  samePreferences,
} from '../models/settings.models';
import {
  SETTINGS_SEED,
  cloneGeneral,
  cloneNotifications,
  clonePreferences,
  defaultGeneral,
  defaultNotifications,
  defaultPreferences,
} from './settings.mock';

const RULE_LABEL: Record<RuleId, string> = {
  'product-access-expiry': 'Product Access Expiry',
  'incident-notifications': 'Incident Notifications',
  'product-status': 'Product Status Changes',
  'provider-model-status': 'Provider & Model Status Changes',
  'admin-permission': 'Admin & Permission Changes',
};

const RULE_ORDER: readonly RuleId[] = [
  'product-access-expiry',
  'incident-notifications',
  'product-status',
  'provider-model-status',
  'admin-permission',
];

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly state = signal(cloneSeed());

  readonly general = computed(() => this.state().general);
  readonly notifications = computed(() => this.state().notifications);
  readonly preferences = computed(() => this.state().preferences);
  readonly activities = computed(() => this.state().activities);

  saveGeneral(draft: GeneralSettings): SaveResult {
    const next = normalizeGeneral(draft);
    if (!next.workspaceDisplayName) return { status: 'invalid', message: '워크스페이스 이름을 입력하세요.' };
    if (!TIMEZONES.includes(next.defaultTimezone)) return { status: 'invalid', message: '시간대를 선택하세요.' };
    if (!DATE_FORMATS.includes(next.defaultDateFormat)) return { status: 'invalid', message: '날짜 형식을 선택하세요.' };
    const current = this.general();
    if (sameGeneral(current, next)) return { status: 'unchanged' };
    const saved = { ...next, updatedAt: kstNow() };
    this.state.update((state) => ({
      ...state,
      general: saved,
      activities: [activity('general-updated', '일반 설정을 수정했습니다.', generalChanges(current, saved), state.activities), ...state.activities],
    }));
    return { status: 'saved' };
  }

  saveNotifications(draft: NotificationSettings): SaveResult {
    const next = normalizeNotifications(draft);
    if (next.rules.length !== RULE_ORDER.length || next.rules.some((rule, index) => rule.id !== RULE_ORDER[index])) {
      return { status: 'invalid', message: '알림 규칙을 확인하세요.' };
    }
    const expiry = next.rules[0];
    const incident = next.rules[1];
    if (expiry.enabled && expiry.timings.length === 0) {
      return { status: 'invalid', message: '만료 알림을 사용하는 경우 시점을 하나 이상 선택하세요.' };
    }
    if (incident.enabled && incident.events.length === 0) {
      return { status: 'invalid', message: '장애 알림을 사용하는 경우 이벤트를 하나 이상 선택하세요.' };
    }
    const current = this.notifications();
    if (sameNotifications(current, next)) return { status: 'unchanged' };
    const saved = { ...next, updatedAt: kstNow() };
    this.state.update((state) => ({
      ...state,
      notifications: saved,
      activities: [activity('notifications-updated', '알림 설정을 수정했습니다.', notificationChanges(current, saved), state.activities), ...state.activities],
    }));
    return { status: 'saved' };
  }

  savePreferences(draft: AdminPreferences): SaveResult {
    if (draft.preferredTimezone !== 'system' && !TIMEZONES.includes(draft.preferredTimezone)) {
      return { status: 'invalid', message: '시간대를 선택하세요.' };
    }
    if (draft.preferredDateFormat !== 'system' && !DATE_FORMATS.includes(draft.preferredDateFormat)) {
      return { status: 'invalid', message: '날짜 형식을 선택하세요.' };
    }
    if (!PAGE_SIZES.includes(draft.defaultPageSize)) return { status: 'invalid', message: '페이지 크기를 선택하세요.' };
    if (!LANDING_PAGES.some((page) => page.id === draft.defaultLandingPage)) {
      return { status: 'invalid', message: '기본 화면을 선택하세요.' };
    }
    const current = this.preferences();
    if (samePreferences(current, draft)) return { status: 'unchanged' };
    const saved = { ...draft, adminId: 'demo-administrator', updatedAt: kstNow() };
    this.state.update((state) => ({
      ...state,
      preferences: saved,
      activities: [activity('preferences-updated', '개인 설정을 수정했습니다.', preferenceChanges(current, saved), state.activities), ...state.activities],
    }));
    return { status: 'saved' };
  }

  generalDefaults(): GeneralSettings {
    return defaultGeneral();
  }

  notificationDefaults(): NotificationSettings {
    return defaultNotifications();
  }

  preferenceDefaults(): AdminPreferences {
    return defaultPreferences();
  }
}

function cloneSeed() {
  return {
    general: cloneGeneral(SETTINGS_SEED.general),
    notifications: cloneNotifications(SETTINGS_SEED.notifications),
    preferences: clonePreferences(SETTINGS_SEED.preferences),
    activities: [] as SettingsActivity[],
  };
}

function activity(action: SettingsActivity['action'], summary: string, changes: SettingsChange[], existing: readonly SettingsActivity[]): SettingsActivity {
  return {
    id: nextId(existing),
    timestamp: kstNow(),
    action,
    actorLabel: DEMO_ACTOR,
    summary,
    changes,
  };
}

function generalChanges(before: GeneralSettings, after: GeneralSettings): SettingsChange[] {
  const changes: SettingsChange[] = [];
  push(changes, 'Workspace Display Name', before.workspaceDisplayName, after.workspaceDisplayName);
  push(changes, 'Workspace Description', before.workspaceDescription, after.workspaceDescription);
  push(changes, 'Default Timezone', before.defaultTimezone, after.defaultTimezone);
  push(changes, 'Default Date Format', before.defaultDateFormat, after.defaultDateFormat);
  return changes;
}

function notificationChanges(before: NotificationSettings, after: NotificationSettings): SettingsChange[] {
  const changes: SettingsChange[] = [];
  after.rules.forEach((rule) => {
    const previous = before.rules.find((item) => item.id === rule.id);
    if (!previous) return;
    push(changes, RULE_LABEL[rule.id], onOff(previous.enabled), onOff(rule.enabled));
    if (rule.id === 'product-access-expiry') {
      push(changes, 'Reminder Timing', previous.timings.map((item) => TIMING_LABEL[item]).join(', '), rule.timings.map((item) => TIMING_LABEL[item]).join(', '));
    }
    if (rule.id === 'incident-notifications') {
      push(changes, 'Incident Events', previous.events.map((item) => EVENT_LABEL[item]).join(', '), rule.events.map((item) => EVENT_LABEL[item]).join(', '));
    }
  });
  return changes;
}

function preferenceChanges(before: AdminPreferences, after: AdminPreferences): SettingsChange[] {
  const changes: SettingsChange[] = [];
  push(changes, 'Preferred Timezone', zoneLabel(before.preferredTimezone), zoneLabel(after.preferredTimezone));
  push(changes, 'Preferred Date Format', formatLabel(before.preferredDateFormat), formatLabel(after.preferredDateFormat));
  push(changes, 'Default Rows per Page', String(before.defaultPageSize), String(after.defaultPageSize));
  push(changes, 'Default Landing Page', landingLabel(before.defaultLandingPage), landingLabel(after.defaultLandingPage));
  return changes;
}

function push(changes: SettingsChange[], field: string, before: string, after: string): void {
  if (before !== after) changes.push({ field, before, after });
}

function onOff(enabled: boolean): string {
  return enabled ? '사용' : '사용 안 함';
}

function zoneLabel(value: TimezoneId | 'system'): string {
  return value === 'system' ? '시스템 기본값' : value;
}

function formatLabel(value: AdminPreferences['preferredDateFormat']): string {
  return value === 'system' ? '시스템 기본값' : value;
}

function nextId(existing: readonly SettingsActivity[]): string {
  const max = existing.reduce((highest, item) => Math.max(highest, Number(item.id.replace(/\D/g, '')) || 0), 0);
  return `settings-activity-${String(max + 1).padStart(4, '0')}`;
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
