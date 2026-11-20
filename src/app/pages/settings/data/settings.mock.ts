import {
  AdminPreferences,
  GeneralSettings,
  NotificationRule,
  NotificationSettings,
  SettingsData,
} from '../models/settings.models';

const SEEDED_AT = '2026-11-20T09:00:00+09:00';

function rule(
  id: NotificationRule['id'],
  enabled: boolean,
  timings: NotificationRule['timings'] = [],
  events: NotificationRule['events'] = [],
): NotificationRule {
  return { id, enabled, timings: [...timings], events: [...events] };
}

export function defaultGeneral(): GeneralSettings {
  return {
    workspaceDisplayName: 'AMS',
    workspaceDescription: 'AMS 운영 화면을 검토하기 위한 샘플 워크스페이스입니다.',
    defaultTimezone: 'Asia/Seoul',
    defaultDateFormat: 'YYYY-MM-DD',
    updatedAt: SEEDED_AT,
  };
}

export function defaultNotifications(): NotificationSettings {
  return {
    rules: [
      rule('product-access-expiry', true, ['7-days', 'on-date']),
      rule('incident-notifications', true, [], ['created', 'status-changed', 'critical']),
      rule('product-status', true),
      rule('provider-model-status', false),
      rule('admin-permission', true),
    ],
    updatedAt: SEEDED_AT,
  };
}

export function defaultPreferences(): AdminPreferences {
  return {
    adminId: 'demo-administrator',
    preferredTimezone: 'system',
    preferredDateFormat: 'system',
    defaultPageSize: 20,
    defaultLandingPage: 'dashboard',
    updatedAt: SEEDED_AT,
  };
}

export function cloneGeneral(value: GeneralSettings): GeneralSettings {
  return { ...value };
}

export function cloneNotifications(value: NotificationSettings): NotificationSettings {
  return { ...value, rules: value.rules.map((item) => ({ ...item, timings: [...item.timings], events: [...item.events] })) };
}

export function clonePreferences(value: AdminPreferences): AdminPreferences {
  return { ...value };
}

export const SETTINGS_SEED: SettingsData = {
  general: defaultGeneral(),
  notifications: defaultNotifications(),
  preferences: defaultPreferences(),
  activities: [],
};
