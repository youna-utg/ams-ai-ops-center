import { Injectable, computed, signal } from '@angular/core';
import { ADMIN_ACCOUNTS, ADMIN_ACTIVITIES, PERMISSION_PRESETS } from './admin.mock';
import { clonePermissions, permissionText, samePermissions } from './permission-catalog';
import {
  AdminAccount,
  AdminActivity,
  AdminActivityAction,
  AdminInput,
  AdminStatus,
  PermissionPreset,
  PresetInput,
} from '../models/admin.models';

const ACTOR = 'Demo Administrator';

@Injectable({ providedIn: 'root' })
export class AdminStore {
  private readonly adminState = signal(ADMIN_ACCOUNTS.map((admin) => this.copyAdmin(admin)));
  private readonly presetState = signal(PERMISSION_PRESETS.map((preset) => this.copyPreset(preset)));
  private readonly activityState = signal(ADMIN_ACTIVITIES.map((activity) => ({ ...activity })));

  readonly admins = computed(() => this.adminState());
  readonly presets = computed(() => this.presetState());
  readonly activities = computed(() => this.activityState());

  adminById(id: string): AdminAccount | undefined {
    return this.admins().find((admin) => admin.id === id);
  }

  presetById(id: string): PermissionPreset | undefined {
    return this.presets().find((preset) => preset.id === id);
  }

  presetName(id: string | null): string {
    if (!id) return 'Custom';
    return this.presetById(id)?.name ?? id;
  }

  effectivePermissions(admin: AdminAccount) {
    if (admin.permissionType === 'custom') return clonePermissions(admin.customPermissions ?? []);
    return clonePermissions(this.presetById(admin.presetId ?? '')?.permissions ?? []);
  }

  assignedCount(presetId: string): number {
    return this.admins().filter((admin) => admin.permissionType === 'preset' && admin.presetId === presetId).length;
  }

  activitiesFor(admin: AdminAccount): readonly AdminActivity[] {
    return this.activities()
      .filter((activity) => activity.targetAdminId === admin.id || (admin.permissionType === 'preset' && activity.targetPresetId === admin.presetId && activity.action === 'preset-updated'))
      .sort((left, right) => right.timestamp.localeCompare(left.timestamp));
  }

  createAdmin(input: AdminInput): AdminAccount {
    const current = this.adminState();
    const normalized = this.normalizeAdmin(input, current);
    const now = new Date().toISOString();
    const created: AdminAccount = {
      ...normalized,
      id: this.nextId('admin', current.map((admin) => admin.id)),
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };
    this.adminState.set([...current, created]);
    this.pushActivity('admin-created', created.id, null, null, this.assignmentLabel(created), now);
    return created;
  }

  updateAdmin(id: string, input: AdminInput): AdminAccount {
    const current = this.adminState();
    const existing = this.requireAdmin(id, current);
    const normalized = this.normalizeAdmin(input, current, id);
    const now = new Date().toISOString();
    const updated: AdminAccount = { ...existing, ...normalized, updatedAt: now };
    this.adminState.set(current.map((admin) => (admin.id === id ? updated : admin)));
    if (existing.fullName !== updated.fullName || existing.email !== updated.email) {
      this.pushActivity('admin-updated', id, null, `${existing.fullName} · ${existing.email}`, `${updated.fullName} · ${updated.email}`, now);
    }
    this.recordAssignmentChange(existing, updated, now);
    return updated;
  }

  setStatus(id: string, status: AdminStatus): AdminAccount {
    const current = this.adminState();
    const existing = this.requireAdmin(id, current);
    if (existing.status === status) return existing;
    const now = new Date().toISOString();
    const updated = { ...existing, status, updatedAt: now };
    this.adminState.set(current.map((admin) => (admin.id === id ? updated : admin)));
    this.pushActivity(status === 'active' ? 'admin-activated' : 'admin-deactivated', id, null, this.statusLabel(existing.status), this.statusLabel(status), now);
    return updated;
  }

  saveCustomPermissions(id: string, permissions: AdminAccount['customPermissions']): AdminAccount {
    const current = this.adminState();
    const existing = this.requireAdmin(id, current);
    const customPermissions = clonePermissions(permissions ?? []);
    const now = new Date().toISOString();
    const updated: AdminAccount = {
      ...existing,
      permissionType: 'custom',
      presetId: null,
      customPermissions,
      updatedAt: now,
    };
    this.adminState.set(current.map((admin) => (admin.id === id ? updated : admin)));
    this.pushActivity('custom-permissions-updated', id, null, this.assignmentLabel(existing), this.assignmentLabel(updated), now);
    return updated;
  }

  assignPreset(id: string, presetId: string): AdminAccount {
    const current = this.adminState();
    const existing = this.requireAdmin(id, current);
    if (!this.presetById(presetId)) throw new Error('Preset을 선택해 주세요.');
    const now = new Date().toISOString();
    const updated: AdminAccount = {
      ...existing,
      permissionType: 'preset',
      presetId,
      customPermissions: null,
      updatedAt: now,
    };
    this.adminState.set(current.map((admin) => (admin.id === id ? updated : admin)));
    this.pushActivity('preset-assigned', id, presetId, this.assignmentLabel(existing), this.presetName(presetId), now);
    return updated;
  }

  createPreset(input: PresetInput): PermissionPreset {
    const current = this.presetState();
    const normalized = this.normalizePreset(input, current);
    const now = new Date().toISOString();
    const created: PermissionPreset = {
      ...normalized,
      id: this.nextId('preset', current.map((preset) => preset.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.presetState.set([...current, created]);
    this.pushActivity('preset-created', null, created.id, null, created.name, now);
    return created;
  }

  updatePreset(id: string, input: PresetInput): PermissionPreset {
    const current = this.presetState();
    const existing = this.requirePreset(id, current);
    const normalized = this.normalizePreset({ ...input, code: existing.code }, current, id);
    const now = new Date().toISOString();
    const updated: PermissionPreset = { ...existing, ...normalized, updatedAt: now };
    this.presetState.set(current.map((preset) => (preset.id === id ? updated : preset)));
    this.pushActivity('preset-updated', null, id, existing.name, updated.name, now);
    return updated;
  }

  duplicatePreset(sourceId: string, name: string, code: string): PermissionPreset {
    const current = this.presetState();
    const source = this.requirePreset(sourceId, current);
    const normalized = this.normalizePreset({
      name,
      code,
      description: source.description,
      permissions: clonePermissions(source.permissions),
    }, current);
    const now = new Date().toISOString();
    const created: PermissionPreset = {
      ...normalized,
      id: this.nextId('preset', current.map((preset) => preset.id)),
      createdAt: now,
      updatedAt: now,
    };
    this.presetState.set([...current, created]);
    this.pushActivity('preset-duplicated', null, created.id, source.name, created.name, now);
    return created;
  }

  private recordAssignmentChange(previous: AdminAccount, next: AdminAccount, timestamp: string): void {
    const samePreset = previous.permissionType === 'preset' && next.permissionType === 'preset' && previous.presetId === next.presetId;
    const sameCustom = previous.permissionType === 'custom' && next.permissionType === 'custom' && samePermissions(previous.customPermissions ?? [], next.customPermissions ?? []);
    if (samePreset || sameCustom) return;
    if (next.permissionType === 'preset') {
      this.pushActivity('preset-assigned', next.id, next.presetId, this.assignmentLabel(previous), this.presetName(next.presetId), timestamp);
      return;
    }
    const previousLabel = previous.permissionType === 'preset' ? this.presetName(previous.presetId) : permissionText(previous.customPermissions ?? []);
    this.pushActivity('custom-permissions-updated', next.id, null, previousLabel, permissionText(next.customPermissions ?? []), timestamp);
  }

  private assignmentLabel(admin: AdminAccount): string {
    if (admin.permissionType === 'preset') return this.presetName(admin.presetId);
    return 'Custom';
  }

  private statusLabel(status: AdminStatus): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }

  private normalizeAdmin(input: AdminInput, admins: readonly AdminAccount[], ignoreId?: string): Omit<AdminAccount, 'id' | 'createdAt' | 'updatedAt' | 'lastLoginAt'> {
    const fullName = input.fullName.trim();
    const email = input.email.trim();
    if (!fullName) throw new Error('이름을 입력해 주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('이메일 형식을 확인해 주세요.');
    const duplicate = admins.some((admin) => admin.id !== ignoreId && admin.email.toLowerCase() === email.toLowerCase());
    if (duplicate) throw new Error('이미 등록된 관리자 이메일입니다.');
    if (input.permissionType === 'preset') {
      if (!input.presetId || !this.presetById(input.presetId)) throw new Error('Preset을 선택해 주세요.');
      return {
        fullName,
        email,
        status: input.status === 'active' ? 'active' : 'inactive',
        permissionType: 'preset',
        presetId: input.presetId,
        customPermissions: null,
      };
    }
    return {
      fullName,
      email,
      status: input.status === 'active' ? 'active' : 'inactive',
      permissionType: 'custom',
      presetId: null,
      customPermissions: clonePermissions(input.customPermissions ?? []),
    };
  }

  private normalizePreset(input: PresetInput, presets: readonly PermissionPreset[], ignoreId?: string): Omit<PermissionPreset, 'id' | 'createdAt' | 'updatedAt'> {
    const name = input.name.trim();
    const code = input.code.trim().toUpperCase();
    if (!name) throw new Error('Preset 이름을 입력해 주세요.');
    if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/.test(code)) throw new Error('Preset Code는 영문 대문자, 숫자, 하이픈만 사용할 수 있습니다.');
    const duplicate = presets.some((preset) => preset.id !== ignoreId && preset.code.toUpperCase() === code);
    if (duplicate) throw new Error('이미 사용 중인 Preset Code입니다.');
    return { name, code, description: input.description.trim(), permissions: clonePermissions(input.permissions) };
  }

  private requireAdmin(id: string, admins: readonly AdminAccount[]): AdminAccount {
    const admin = admins.find((item) => item.id === id);
    if (!admin) throw new Error('관리자를 찾을 수 없습니다.');
    return admin;
  }

  private requirePreset(id: string, presets: readonly PermissionPreset[]): PermissionPreset {
    const preset = presets.find((item) => item.id === id);
    if (!preset) throw new Error('Preset을 찾을 수 없습니다.');
    return preset;
  }

  private pushActivity(
    action: AdminActivityAction,
    targetAdminId: string | null,
    targetPresetId: string | null,
    previousValue: string | null,
    newValue: string | null,
    timestamp: string,
  ): void {
    const entry: AdminActivity = {
      id: this.nextId('admin-activity', this.activityState().map((item) => item.id)),
      actorName: ACTOR,
      targetAdminId,
      targetPresetId,
      action,
      previousValue,
      newValue,
      timestamp,
    };
    this.activityState.set([entry, ...this.activityState()]);
  }

  private copyAdmin(admin: AdminAccount): AdminAccount {
    return { ...admin, customPermissions: admin.customPermissions ? clonePermissions(admin.customPermissions) : null };
  }

  private copyPreset(preset: PermissionPreset): PermissionPreset {
    return { ...preset, permissions: clonePermissions(preset.permissions) };
  }

  private nextId(prefix: string, ids: readonly string[]): string {
    const maximum = ids.reduce((result, id) => {
      const digits = id.match(/\d+/g);
      return Math.max(result, digits ? Number(digits.join('')) : 0);
    }, 0);
    return `${prefix}-${String(maximum + 1).padStart(4, '0')}`;
  }
}
