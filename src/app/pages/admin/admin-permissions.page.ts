import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NAV_GROUPS } from '../../core/config/navigation.config';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { AdminStore } from './data/admin.store';
import {
  MenuPermission,
  PERMISSION_MENU_COUNT,
  PERMISSION_MENUS,
  accessibleCount,
  applyToggle,
  clonePermissions,
  grant,
  manageCount,
  samePermissions,
} from './data/permission-catalog';
import {
  AdminAccount,
  AdminActivityAction,
  AdminStatus,
  PermissionPreset,
  PermissionType,
} from './models/admin.models';
import { PermissionMatrixComponent } from './permission-matrix.component';

type TabId = 'accounts' | 'permissions' | 'presets';
type Direction = 'asc' | 'desc';
type DialogId = 'admin' | 'detail' | 'confirm-status' | 'preset' | 'preset-detail' | 'confirm-preset' | 'duplicate' | 'discard' | null;

interface ListParams {
  tab: TabId;
  q: string;
  status: 'all' | AdminStatus;
  type: 'all' | PermissionType;
  preset: string;
  sort: string;
  direction: Direction;
  page: number;
  admin: string;
  pq: string;
  pSort: string;
  pDir: Direction;
  pPage: number;
}

@Component({
  selector: 'app-admin-permissions-page',
  imports: [ReactiveFormsModule, IconComponent, StatusBadgeComponent, PermissionMatrixComponent],
  templateUrl: './admin-permissions.page.html',
  styleUrl: './admin-permissions.page.scss',
})
export class AdminPermissionsPage {
  protected readonly store = inject(AdminStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuCount = PERMISSION_MENU_COUNT;
  protected readonly permissionGroups = NAV_GROUPS.map((group) => ({
    label: group.label,
    menus: group.items.map((item) => ({
      key: item.path.replace(/^\//, ''),
      label: item.label,
      description: item.description,
      viewOnly: item.path === '/overview',
    })),
  }));
  protected readonly tabs = [
    { id: 'accounts' as const, label: 'Admin Accounts' },
    { id: 'permissions' as const, label: 'Permissions' },
    { id: 'presets' as const, label: 'Presets' },
  ];
  protected readonly params = signal<ListParams>(this.emptyParams());
  protected readonly dialog = signal<DialogId>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly permissionType = signal<PermissionType>('preset');
  protected readonly dialogPermissions = signal<MenuPermission[]>(clonePermissions([]));
  protected readonly permissionDraft = signal<MenuPermission[]>(clonePermissions([]));
  protected readonly presetDraftId = signal<string | null>(null);
  protected readonly presetPermissions = signal<MenuPermission[]>(clonePermissions([]));
  protected readonly customizing = signal(false);
  protected readonly statusIntent = signal<AdminStatus>('inactive');
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private readonly pendingNav = signal<Partial<ListParams> | null>(null);
  private syncedAdmin = '';
  private openedView = '';
  private toastTimer = 0;

  protected readonly adminForm = this.formBuilder.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    permissionType: ['preset' as PermissionType, Validators.required],
    presetId: [''],
    status: ['inactive' as AdminStatus, Validators.required],
  });
  protected readonly presetForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    description: [''],
  });
  protected readonly duplicateForm = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
  });

  protected readonly selectedAdmin = computed((): AdminAccount | null => {
    const requested = this.store.adminById(this.params().admin);
    return requested ?? this.store.admins()[0] ?? null;
  });
  protected readonly accountSummary = computed(() => {
    const admins = this.store.admins();
    return {
      total: admins.length,
      active: admins.filter((admin) => admin.status === 'active').length,
      inactive: admins.filter((admin) => admin.status === 'inactive').length,
    };
  });
  protected readonly presetSummary = computed(() => ({
    total: this.store.presets().length,
    assigned: this.store.admins().filter((admin) => admin.permissionType === 'preset' && admin.presetId).length,
  }));
  protected readonly accountRows = computed(() => this.filterAdmins());
  protected readonly accountPages = computed(() => Math.max(1, Math.ceil(this.accountRows().length / 10)));
  protected readonly accountPage = computed(() => Math.min(this.params().page, this.accountPages()));
  protected readonly pagedAccounts = computed(() => this.accountRows().slice((this.accountPage() - 1) * 10, this.accountPage() * 10));
  protected readonly presetRows = computed(() => this.filterPresets());
  protected readonly presetPages = computed(() => Math.max(1, Math.ceil(this.presetRows().length / 10)));
  protected readonly presetPage = computed(() => Math.min(this.params().pPage, this.presetPages()));
  protected readonly pagedPresets = computed(() => this.presetRows().slice((this.presetPage() - 1) * 10, this.presetPage() * 10));
  protected readonly viewedAdmin = computed(() => this.store.adminById(this.editingId() ?? '') ?? null);
  protected readonly viewedPreset = computed(() => this.store.presetById(this.editingId() ?? '') ?? null);
  protected readonly permissionDirty = computed(() => {
    const admin = this.selectedAdmin();
    if (!admin) return false;
    if (this.customizing()) return true;
    if (admin.permissionType === 'preset') return this.presetDraftId() !== admin.presetId;
    return !samePermissions(this.permissionDraft(), admin.customPermissions ?? []);
  });
  protected readonly permissionEditable = computed(() => {
    const admin = this.selectedAdmin();
    return !!admin && (admin.permissionType === 'custom' || this.customizing());
  });
  protected readonly visiblePermissions = computed(() => {
    const admin = this.selectedAdmin();
    if (!admin) return clonePermissions([]);
    if (admin.permissionType === 'custom' || this.customizing()) return this.permissionDraft();
    return clonePermissions(this.store.presetById(this.presetDraftId() ?? '')?.permissions ?? []);
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const tab = query.get('tab');
      const status = query.get('status');
      const type = query.get('type');
      const direction = query.get('dir');
      const pDir = query.get('pDir');
      this.params.set({
        tab: tab === 'permissions' || tab === 'presets' ? tab : 'accounts',
        q: query.get('q') ?? '',
        status: status === 'active' || status === 'inactive' ? status : 'all',
        type: type === 'preset' || type === 'custom' ? type : 'all',
        preset: query.get('preset') ?? 'all',
        sort: query.get('sort') ?? 'name',
        direction: direction === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, Number(query.get('page')) || 1),
        admin: query.get('admin') ?? '',
        pq: query.get('pq') ?? '',
        pSort: query.get('pSort') ?? 'name',
        pDir: pDir === 'desc' ? 'desc' : 'asc',
        pPage: Math.max(1, Number(query.get('pPage')) || 1),
      });
      const selected = this.selectedAdmin()?.id ?? '';
      if (selected !== this.syncedAdmin) {
        this.syncedAdmin = selected;
        this.resetPermissionDraft();
      }
      const viewId = query.get('view') === 'detail' ? query.get('admin') ?? '' : '';
      if (viewId && viewId !== this.openedView && this.store.adminById(viewId)) {
        this.openedView = viewId;
        this.openDetail(viewId);
      }
      if (!viewId) this.openedView = '';
    });
    const syncMenu = () => this.syncActionMenu();
    window.addEventListener('scroll', syncMenu, true);
    window.addEventListener('resize', syncMenu);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('scroll', syncMenu, true);
      window.removeEventListener('resize', syncMenu);
      window.clearTimeout(this.toastTimer);
    });
  }

  @HostListener('document:click', ['$event'])
  protected closeActionMenu(event: MouseEvent): void {
    if (!(event.target instanceof Element) || !event.target.closest('.action-menu, .icon-action')) {
      this.actionMenu.set(null);
    }
  }

  protected setTab(tab: TabId): void {
    if (this.params().tab === 'permissions' && tab !== 'permissions' && this.permissionDirty()) {
      this.pendingNav.set({ tab });
      this.dialog.set('discard');
      return;
    }
    this.navigate({ ...this.params(), tab });
  }

  protected updateAccounts(key: 'q' | 'status' | 'type' | 'preset', value: string): void {
    this.navigate({ ...this.params(), [key]: value, page: 1 });
  }

  protected updatePresets(value: string): void {
    this.navigate({ ...this.params(), pq: value, pPage: 1 });
  }

  protected clearAccounts(): void {
    this.navigate({ ...this.params(), q: '', status: 'all', type: 'all', preset: 'all', page: 1 });
  }

  protected clearPresets(): void {
    this.navigate({ ...this.params(), pq: '', pPage: 1 });
  }

  protected sortAccounts(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, sort, direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc', page: 1 });
  }

  protected sortPresets(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, pSort: sort, pDir: current.pSort === sort && current.pDir === 'asc' ? 'desc' : 'asc', pPage: 1 });
  }

  protected changeAccountPage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected changePresetPage(page: number): void {
    this.navigate({ ...this.params(), pPage: page });
  }

  protected pages(total: number): number[] {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  protected accountsFiltered(): boolean {
    const params = this.params();
    return Boolean(params.q) || params.status !== 'all' || params.type !== 'all' || params.preset !== 'all';
  }

  protected initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    return name.trim().slice(0, 2).toUpperCase();
  }

  protected roleLabel(admin: AdminAccount): string {
    return admin.permissionType === 'preset' ? this.store.presetName(admin.presetId) : 'Custom';
  }

  protected permissionOf(key: string): MenuPermission {
    return this.visiblePermissions().find((item) => item.menuKey === key) ?? { menuKey: key, view: false, manage: false };
  }

  protected togglePermission(key: string, field: 'view' | 'manage', event: Event): void {
    if (!this.permissionEditable()) return;
    const checked = event.target instanceof HTMLInputElement && event.target.checked;
    this.permissionDraft.set(applyToggle(this.visiblePermissions(), key, field, checked));
  }

  protected setAllPermissions(enabled: boolean): void {
    if (!this.permissionEditable()) return;
    this.permissionDraft.set(enabled ? grant(PERMISSION_MENUS.map((menu) => menu.key), 'manage') : clonePermissions([]));
  }

  protected selectAdmin(id: string): void {
    if (id === this.selectedAdmin()?.id) return;
    if (this.permissionDirty()) {
      this.pendingNav.set({ admin: id });
      this.dialog.set('discard');
      return;
    }
    this.navigate({ ...this.params(), tab: 'permissions', admin: id });
  }

  protected openAdmin(admin?: AdminAccount): void {
    this.actionMenu.set(null);
    const type = admin?.permissionType ?? 'preset';
    this.adminForm.reset({
      fullName: admin?.fullName ?? '',
      email: admin?.email ?? '',
      permissionType: type,
      presetId: admin?.presetId ?? this.store.presets()[0]?.id ?? '',
      status: admin?.status ?? 'inactive',
    });
    this.permissionType.set(type);
    this.dialogPermissions.set(clonePermissions(admin ? this.store.effectivePermissions(admin) : []));
    if (admin) this.adminForm.controls.status.disable();
    else this.adminForm.controls.status.enable();
    this.editingId.set(admin?.id ?? null);
    this.formError.set('');
    this.dialog.set('admin');
  }

  protected changePermissionType(event: Event): void {
    const type = event.target instanceof HTMLSelectElement && event.target.value === 'custom' ? 'custom' : 'preset';
    this.permissionType.set(type);
    this.adminForm.controls.permissionType.setValue(type);
  }

  protected saveAdmin(): void {
    this.formError.set('');
    const value = this.adminForm.getRawValue();
    try {
      const input = {
        fullName: value.fullName,
        email: value.email,
        status: value.status,
        permissionType: this.permissionType(),
        presetId: this.permissionType() === 'preset' ? value.presetId : null,
        customPermissions: this.permissionType() === 'custom' ? this.dialogPermissions() : null,
      };
      if (this.editingId()) this.store.updateAdmin(this.editingId()!, input);
      else this.store.createAdmin(input);
      this.closeDialog();
      this.showToast('관리자를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '관리자를 저장하지 못했습니다.');
    }
  }

  protected openDetail(id: string): void {
    this.actionMenu.set(null);
    this.editingId.set(id);
    this.dialog.set('detail');
  }

  protected openPresetFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button')) return;
    this.openPresetDetail(id);
  }

  protected openFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.openDetail(id);
  }

  protected managePermissions(id: string): void {
    this.actionMenu.set(null);
    this.dialog.set(null);
    if (this.params().tab === 'permissions' && this.permissionDirty() && id !== this.selectedAdmin()?.id) {
      this.pendingNav.set({ tab: 'permissions', admin: id });
      this.dialog.set('discard');
      return;
    }
    this.navigate({ ...this.params(), tab: 'permissions', admin: id });
  }

  protected requestStatus(id: string, status: AdminStatus): void {
    this.actionMenu.set(null);
    this.editingId.set(id);
    this.statusIntent.set(status);
    this.dialog.set('confirm-status');
  }

  protected confirmStatus(): void {
    const id = this.editingId();
    if (!id) return;
    this.store.setStatus(id, this.statusIntent());
    this.closeDialog();
    this.showToast(this.statusIntent() === 'active' ? '활성으로 표시했습니다.' : '비활성으로 표시했습니다.');
  }

  protected onDialogMatrix(permissions: MenuPermission[]): void {
    this.dialogPermissions.set(permissions);
  }

  protected onPresetMatrix(permissions: MenuPermission[]): void {
    this.presetPermissions.set(permissions);
  }

  protected changeDraftPreset(event: Event): void {
    this.presetDraftId.set(event.target instanceof HTMLSelectElement ? event.target.value : null);
  }

  protected startCustomize(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;
    this.permissionDraft.set(clonePermissions(this.visiblePermissions()));
    this.customizing.set(true);
  }

  protected savePermissions(): void {
    const admin = this.selectedAdmin();
    if (!admin) return;
    try {
      if (this.customizing() || admin.permissionType === 'custom') this.store.saveCustomPermissions(admin.id, this.permissionDraft());
      else if (this.presetDraftId()) this.store.assignPreset(admin.id, this.presetDraftId()!);
      this.customizing.set(false);
      this.resetPermissionDraft();
      this.showToast('권한을 저장했습니다.');
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : '권한을 저장하지 못했습니다.');
    }
  }

  protected cancelPermissions(): void {
    this.resetPermissionDraft();
  }

  protected openPreset(preset?: PermissionPreset): void {
    this.actionMenu.set(null);
    this.presetForm.reset({
      name: preset?.name ?? '',
      code: preset?.code ?? '',
      description: preset?.description ?? '',
    });
    if (preset) this.presetForm.controls.code.disable();
    else this.presetForm.controls.code.enable();
    this.presetPermissions.set(clonePermissions(preset?.permissions ?? []));
    this.editingId.set(preset?.id ?? null);
    this.formError.set('');
    this.dialog.set('preset');
  }

  protected savePreset(): void {
    this.formError.set('');
    const id = this.editingId();
    if (id && this.store.assignedCount(id) > 0) {
      this.dialog.set('confirm-preset');
      return;
    }
    this.commitPreset();
  }

  protected confirmPreset(): void {
    this.commitPreset();
  }

  protected backToPreset(): void {
    this.dialog.set('preset');
  }

  protected openPresetDetail(id: string): void {
    this.actionMenu.set(null);
    this.editingId.set(id);
    this.dialog.set('preset-detail');
  }

  protected openDuplicate(id: string): void {
    const preset = this.store.presetById(id);
    if (!preset) return;
    this.actionMenu.set(null);
    this.duplicateForm.reset({ name: `${preset.name} Copy`, code: `${preset.code}-COPY` });
    this.editingId.set(id);
    this.formError.set('');
    this.dialog.set('duplicate');
  }

  protected saveDuplicate(): void {
    const id = this.editingId();
    if (!id) return;
    const value = this.duplicateForm.getRawValue();
    try {
      this.store.duplicatePreset(id, value.name, value.code);
      this.closeDialog();
      this.showToast('Preset을 복제했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Preset을 복제하지 못했습니다.');
    }
  }

  protected confirmDiscard(): void {
    const pending = this.pendingNav();
    this.customizing.set(false);
    this.resetPermissionDraft();
    this.pendingNav.set(null);
    this.dialog.set(null);
    if (pending) this.navigate({ ...this.params(), ...pending });
  }

  protected closeDialog(): void {
    if (this.dialog() === 'discard') this.pendingNav.set(null);
    this.dialog.set(null);
    this.formError.set('');
    if (this.route.snapshot.queryParamMap.get('view') === 'detail') {
      void this.router.navigate([], { relativeTo: this.route, queryParams: { view: null }, queryParamsHandling: 'merge' });
    }
  }

  protected toggleActionMenu(id: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this.actionMenu() === id ? null : id;
    this.actionMenu.set(next);
    if (!next || !(event.currentTarget instanceof HTMLElement)) {
      this.actionMenuStyle.set(null);
      return;
    }
    this.placeActionMenu(event.currentTarget);
  }

  protected editMenuAdmin(): void {
    const admin = this.store.adminById(this.actionMenu() ?? '');
    if (admin) this.openAdmin(admin);
  }

  protected editMenuPreset(): void {
    const preset = this.store.presetById(this.actionMenu() ?? '');
    if (preset) this.openPreset(preset);
  }

  protected menuAdmin(): AdminAccount | undefined {
    const id = this.actionMenu();
    return id ? this.store.adminById(id) : undefined;
  }

  protected accessible(admin: AdminAccount): number {
    return accessibleCount(this.store.effectivePermissions(admin));
  }

  protected presetAccessible(preset: PermissionPreset): number {
    return accessibleCount(preset.permissions);
  }

  protected summaryText(permissions: readonly MenuPermission[]): string {
    return `조회 ${accessibleCount(permissions)} / ${this.menuCount} · 관리 ${manageCount(permissions)}`;
  }

  protected activityLabel(action: AdminActivityAction): string {
    const labels: Record<AdminActivityAction, string> = {
      'admin-created': '관리자 등록',
      'admin-updated': '관리자 수정',
      'admin-activated': '활성화',
      'admin-deactivated': '비활성화',
      'preset-assigned': 'Preset 지정',
      'custom-permissions-updated': 'Custom 권한 수정',
      'preset-created': 'Preset 등록',
      'preset-updated': 'Preset 수정',
      'preset-duplicated': 'Preset 복제',
    };
    return labels[action];
  }

  protected formatStamp(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(new Date(value));
  }

  protected statusLabel(status: AdminStatus): string {
    return status === 'active' ? '활성' : '비활성';
  }

  private commitPreset(): void {
    const value = this.presetForm.getRawValue();
    const input = { name: value.name, code: value.code, description: value.description, permissions: this.presetPermissions() };
    try {
      if (this.editingId()) this.store.updatePreset(this.editingId()!, input);
      else this.store.createPreset(input);
      this.closeDialog();
      this.showToast('Preset을 저장했습니다.');
    } catch (error) {
      this.dialog.set('preset');
      this.formError.set(error instanceof Error ? error.message : 'Preset을 저장하지 못했습니다.');
    }
  }

  private resetPermissionDraft(): void {
    const admin = this.selectedAdmin();
    this.customizing.set(false);
    if (!admin) return;
    this.presetDraftId.set(admin.presetId);
    this.permissionDraft.set(clonePermissions(admin.permissionType === 'custom' ? admin.customPermissions ?? [] : this.store.effectivePermissions(admin)));
  }

  private filterAdmins(): AdminAccount[] {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.admins().filter((admin) => {
      const matchesQuery = !query || admin.fullName.toLowerCase().includes(query) || admin.email.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || admin.status === params.status;
      const matchesType = params.type === 'all' || admin.permissionType === params.type;
      const matchesPreset = params.preset === 'all' || admin.presetId === params.preset;
      return matchesQuery && matchesStatus && matchesType && matchesPreset;
    });
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compare(this.adminValue(left, params.sort), this.adminValue(right, params.sort)) * direction);
  }

  private filterPresets(): PermissionPreset[] {
    const params = this.params();
    const query = params.pq.trim().toLowerCase();
    const rows = this.store.presets().filter((preset) => !query || preset.name.toLowerCase().includes(query) || preset.code.toLowerCase().includes(query));
    const direction = params.pDir === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compare(this.presetValue(left, params.pSort), this.presetValue(right, params.pSort)) * direction);
  }

  private adminValue(admin: AdminAccount, sort: string): string {
    if (sort === 'email') return admin.email;
    if (sort === 'type') return admin.permissionType;
    if (sort === 'preset') return admin.permissionType === 'preset' ? this.store.presetName(admin.presetId) : 'Custom';
    if (sort === 'status') return admin.status;
    if (sort === 'login') return admin.lastLoginAt ?? '';
    if (sort === 'created') return admin.createdAt;
    return admin.fullName;
  }

  private presetValue(preset: PermissionPreset, sort: string): string | number {
    if (sort === 'code') return preset.code;
    if (sort === 'menus') return accessibleCount(preset.permissions);
    if (sort === 'assigned') return this.store.assignedCount(preset.id);
    if (sort === 'updated') return preset.updatedAt;
    return preset.name;
  }

  private compare(left: string | number, right: string | number): number {
    return typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'ko');
  }

  private emptyParams(): ListParams {
    return {
      tab: 'accounts', q: '', status: 'all', type: 'all', preset: 'all', sort: 'name', direction: 'asc', page: 1,
      admin: '', pq: '', pSort: 'name', pDir: 'asc', pPage: 1,
    };
  }

  private navigate(params: ListParams): void {
    const query: Params = {};
    if (params.tab !== 'accounts') query['tab'] = params.tab;
    if (params.q) query['q'] = params.q;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.type !== 'all') query['type'] = params.type;
    if (params.preset !== 'all') query['preset'] = params.preset;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['dir'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    if (params.admin) query['admin'] = params.admin;
    if (params.pq) query['pq'] = params.pq;
    if (params.pSort !== 'name') query['pSort'] = params.pSort;
    if (params.pDir !== 'asc') query['pDir'] = params.pDir;
    if (params.pPage > 1) query['pPage'] = String(params.pPage);
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 168;
    const menuHeight = 150;
    const gap = 6;
    const openAbove = rect.bottom + gap + menuHeight > window.innerHeight && rect.top > menuHeight + gap;
    const top = openAbove ? rect.top - gap - menuHeight : rect.bottom + gap;
    const left = Math.min(Math.max(8, rect.right - menuWidth), window.innerWidth - menuWidth - 8);
    this.actionMenuStyle.set({ top: `${top}px`, left: `${left}px` });
  }

  private syncActionMenu(): void {
    if (!this.actionMenu()) return;
    const button = document.querySelector<HTMLElement>('.icon-action[aria-expanded="true"]');
    if (!button) {
      this.actionMenu.set(null);
      this.actionMenuStyle.set(null);
      return;
    }
    this.placeActionMenu(button);
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}
