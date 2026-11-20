import { MenuPermission } from '../data/permission-catalog';

export type AdminStatus = 'active' | 'inactive';
export type PermissionType = 'preset' | 'custom';

export type AdminActivityAction =
  | 'admin-created'
  | 'admin-updated'
  | 'admin-activated'
  | 'admin-deactivated'
  | 'preset-assigned'
  | 'custom-permissions-updated'
  | 'preset-created'
  | 'preset-updated'
  | 'preset-duplicated';

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  status: AdminStatus;
  permissionType: PermissionType;
  presetId: string | null;
  customPermissions: MenuPermission[] | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface PermissionPreset {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: MenuPermission[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminActivity {
  id: string;
  actorName: string;
  targetAdminId: string | null;
  targetPresetId: string | null;
  action: AdminActivityAction;
  previousValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface AdminInput {
  fullName: string;
  email: string;
  status: AdminStatus;
  permissionType: PermissionType;
  presetId: string | null;
  customPermissions: MenuPermission[] | null;
}

export interface PresetInput {
  name: string;
  code: string;
  description: string;
  permissions: MenuPermission[];
}
