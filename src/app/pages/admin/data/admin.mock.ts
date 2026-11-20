import { PERMISSION_MENUS, grant } from './permission-catalog';
import { AdminAccount, AdminActivity, PermissionPreset } from '../models/admin.models';

const allKeys = PERMISSION_MENUS.map((menu) => menu.key);

function mix(viewKeys: readonly string[], manageKeys: readonly string[]) {
  const view = new Set([...viewKeys, ...manageKeys]);
  const manage = new Set(manageKeys);
  return PERMISSION_MENUS.map((menu) => ({
    menuKey: menu.key,
    view: view.has(menu.key),
    manage: !menu.viewOnly && manage.has(menu.key),
  }));
}

const created = '2026-09-01T09:00:00+09:00';

function preset(
  id: string,
  name: string,
  code: string,
  description: string,
  permissions: PermissionPreset['permissions'],
): PermissionPreset {
  return { id, name, code, description, permissions, createdAt: created, updatedAt: created };
}

export const PERMISSION_PRESETS: readonly PermissionPreset[] = [
  preset(
    'preset-0001',
    'Full Access',
    'FULL-ACCESS',
    '샘플용 전체 조회 및 관리 권한입니다.',
    grant(allKeys, 'manage'),
  ),
  preset(
    'preset-0002',
    'Operations Manager',
    'OPS-MANAGER',
    '샘플용 고객·제품·AI 운영 권한입니다.',
    mix(
      ['overview', 'admin-permissions', 'activity-history', 'system-monitoring'],
      ['organizations', 'users', 'products', 'plans-points', 'providers-models', 'usage-costs'],
    ),
  ),
  preset(
    'preset-0003',
    'Read Only',
    'READ-ONLY',
    '샘플용 전체 조회 권한입니다.',
    grant(allKeys, 'view'),
  ),
];

function admin(
  id: string,
  fullName: string,
  email: string,
  status: AdminAccount['status'],
  permissionType: AdminAccount['permissionType'],
  presetId: string | null,
  custom: AdminAccount['customPermissions'],
  createdAt: string,
  lastLoginAt: string | null,
): AdminAccount {
  return {
    id,
    fullName,
    email,
    status,
    permissionType,
    presetId,
    customPermissions: custom,
    createdAt,
    updatedAt: createdAt,
    lastLoginAt,
  };
}

export const ADMIN_ACCOUNTS: readonly AdminAccount[] = [
  admin('admin-0001', 'Mina Park', 'mina.park@ams.example', 'active', 'preset', 'preset-0001', null, '2026-09-02T09:10:00+09:00', '2026-11-20T08:40:00+09:00'),
  admin('admin-0002', 'Jun Seo', 'jun.seo@ams.example', 'active', 'preset', 'preset-0002', null, '2026-09-15T11:00:00+09:00', '2026-11-18T16:20:00+09:00'),
  admin('admin-0003', 'Hana Choi', 'hana.choi@ams.example', 'active', 'preset', 'preset-0003', null, '2026-10-01T10:00:00+09:00', null),
  admin(
    'admin-0004',
    'Owen Blake',
    'owen.blake@ams.example',
    'inactive',
    'custom',
    null,
    mix(['organizations', 'products'], ['users']),
    '2026-09-20T13:30:00+09:00',
    '2026-10-02T09:15:00+09:00',
  ),
  admin('admin-0005', 'Sora Kim', 'sora.kim@ams.example', 'active', 'preset', 'preset-0002', null, '2026-10-20T09:00:00+09:00', '2026-11-12T14:05:00+09:00'),
  admin('admin-0006', 'Noah Lee', 'noah.lee@ams.example', 'active', 'preset', 'preset-0003', null, '2026-11-03T15:45:00+09:00', null),
];

export const ADMIN_ACTIVITIES: readonly AdminActivity[] = [
  {
    id: 'admin-activity-0001',
    actorName: 'Demo Administrator',
    targetAdminId: 'admin-0004',
    targetPresetId: null,
    action: 'admin-deactivated',
    previousValue: 'Active',
    newValue: 'Inactive',
    timestamp: '2026-10-03T10:00:00+09:00',
  },
  {
    id: 'admin-activity-0002',
    actorName: 'Demo Administrator',
    targetAdminId: 'admin-0005',
    targetPresetId: 'preset-0002',
    action: 'preset-assigned',
    previousValue: 'Read Only',
    newValue: 'Operations Manager',
    timestamp: '2026-11-01T09:30:00+09:00',
  },
];
