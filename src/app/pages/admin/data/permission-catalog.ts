import { NAV_GROUPS } from '../../../core/config/navigation.config';

export interface PermissionMenu {
  group: string;
  key: string;
  label: string;
  viewOnly: boolean;
}

export interface MenuPermission {
  menuKey: string;
  view: boolean;
  manage: boolean;
}

export const PERMISSION_MENUS: readonly PermissionMenu[] = NAV_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    group: group.label,
    key: item.path.replace(/^\//, ''),
    label: item.label,
    viewOnly: item.path === '/overview',
  })),
);

export const PERMISSION_MENU_COUNT = PERMISSION_MENUS.length;

export function clonePermissions(source: readonly MenuPermission[]): MenuPermission[] {
  const byKey = new Map(source.map((item) => [item.menuKey, item]));
  return PERMISSION_MENUS.map((menu) => {
    const found = byKey.get(menu.key);
    const manage = !menu.viewOnly && !!found?.manage;
    return {
      menuKey: menu.key,
      view: !!found?.view || manage,
      manage,
    };
  });
}

export function applyToggle(
  current: readonly MenuPermission[],
  menuKey: string,
  field: 'view' | 'manage',
  checked: boolean,
): MenuPermission[] {
  const menu = PERMISSION_MENUS.find((item) => item.key === menuKey);
  if (!menu || (menu.viewOnly && field === 'manage')) return clonePermissions(current);
  return clonePermissions(current).map((item) => {
    if (item.menuKey !== menuKey) return item;
    if (field === 'manage') return { ...item, manage: checked, view: checked || item.view };
    if (!checked) return { ...item, view: false, manage: false };
    return { ...item, view: true };
  });
}

export function accessibleCount(permissions: readonly MenuPermission[]): number {
  return permissions.filter((item) => item.view || item.manage).length;
}

export function manageCount(permissions: readonly MenuPermission[]): number {
  return permissions.filter((item) => item.manage).length;
}

export function samePermissions(left: readonly MenuPermission[], right: readonly MenuPermission[]): boolean {
  const next = clonePermissions(right);
  return clonePermissions(left).every((item, index) => item.view === next[index].view && item.manage === next[index].manage);
}

export function permissionText(permissions: readonly MenuPermission[]): string {
  const rows = clonePermissions(permissions).filter((item) => item.view || item.manage);
  if (!rows.length) return '권한 없음';
  return rows
    .map((item) => {
      const menu = PERMISSION_MENUS.find((entry) => entry.key === item.menuKey);
      return `${menu?.label ?? item.menuKey} ${item.manage ? 'View + Manage' : 'View'}`;
    })
    .join(' · ');
}

export function grant(
  keys: readonly string[],
  mode: 'view' | 'manage',
): MenuPermission[] {
  const allowed = new Set(keys);
  return PERMISSION_MENUS.map((menu) => {
    const included = allowed.has(menu.key);
    const manage = mode === 'manage' && included && !menu.viewOnly;
    return { menuKey: menu.key, view: included || manage, manage };
  });
}
