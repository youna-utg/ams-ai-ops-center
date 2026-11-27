import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import { OrganizationUser } from '../../organizations/models/organization.models';

type UserSortKey = 'name' | 'organization' | 'team' | 'status' | 'registration' | 'joined' | 'login';
type UserDialogMode = 'create' | 'edit';
type UserAction = 'activate' | 'deactivate' | 'delete';

interface UserListParams {
  q: string;
  organization: string;
  team: string;
  status: 'all' | 'active' | 'inactive';
  registration: 'all' | 'manual' | 'bulk';
  sort: UserSortKey;
  direction: 'asc' | 'desc';
  page: number;
}

@Component({
  selector: 'app-user-list-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './user-list.page.html',
  styleUrl: './user-list.page.scss',
})
export class UserListPage {
  private readonly store = inject(OrganizationsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly params = signal<UserListParams>({
    q: '',
    organization: 'all',
    team: 'all',
    status: 'all',
    registration: 'all',
    sort: 'name',
    direction: 'asc',
    page: 1,
  });
  protected readonly dialogMode = signal<UserDialogMode | null>(null);
  protected readonly editingUserId = signal<string | null>(null);
  protected readonly confirmAction = signal<UserAction | null>(null);
  protected readonly confirmUserId = signal<string | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private toastTimer = 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    organizationId: ['', Validators.required],
    teamId: [''],
    phone: ['', Validators.maxLength(30)],
    jobTitle: ['', Validators.maxLength(80)],
  });

  protected readonly organizations = this.store.organizations;
  protected readonly allUsers = computed(() => this.store.users());
  protected readonly summary = computed(() => ({
    total: this.allUsers().length,
    active: this.allUsers().filter((user) => user.active).length,
    inactive: this.allUsers().filter((user) => !user.active).length,
  }));
  protected readonly formOrganizationId = signal('');
  protected readonly organizationTeams = computed(() =>
    this.store.teams().filter((team) => team.organizationId === this.formOrganizationId()),
  );
  protected readonly filterTeams = computed(() => {
    const organizationId = this.params().organization;
    if (organizationId === 'all') return [];
    return this.store.teams().filter((team) => team.organizationId === organizationId);
  });
  protected readonly filteredRows = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.allUsers().filter((user) => {
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query);
      const matchesOrganization =
        params.organization === 'all' || user.organizationId === params.organization;
      const matchesTeam =
        params.team === 'all' ||
        (params.team === 'unassigned' ? !user.teamId : user.teamId === params.team);
      const matchesStatus =
        params.status === 'all' ||
        (params.status === 'active' ? user.active : !user.active);
      const matchesRegistration =
        params.registration === 'all' || user.registrationType === params.registration;
      return matchesQuery && matchesOrganization && matchesTeam && matchesStatus && matchesRegistration;
    });
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort(
      (a, b) => this.compare(a, b, params.sort) * direction,
    );
  });
  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / 10)),
  );
  protected readonly pagedRows = computed(() => {
    const page = Math.min(this.params().page, this.totalPages());
    return this.filteredRows().slice((page - 1) * 10, page * 10);
  });
  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  protected readonly activeActionUser = computed(() =>
    this.pagedRows().find((user) => user.id === this.actionMenu()) ?? null,
  );
  protected readonly confirmUser = computed(() =>
    this.allUsers().find((user) => user.id === this.confirmUserId()) ?? null,
  );
  protected readonly hasFilters = computed(() => {
    const params = this.params();
    return Boolean(
      params.q ||
        params.organization !== 'all' ||
        params.team !== 'all' ||
        params.status !== 'all' ||
        params.registration !== 'all',
    );
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const sort = query.get('sort');
      const direction = query.get('direction');
      const status = query.get('status');
      const registration = query.get('registration');
      this.params.set({
        q: query.get('q') ?? '',
        organization: query.get('organization') ?? 'all',
        team: query.get('team') ?? 'all',
        status: status === 'active' || status === 'inactive' ? status : 'all',
        registration: registration === 'manual' || registration === 'bulk' ? registration : 'all',
        sort: this.isSortKey(sort) ? sort : 'name',
        direction: direction === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, Number(query.get('page') ?? 1) || 1),
      });
    });
    const syncMenu = () => this.syncActionMenu();
    document.addEventListener('scroll', syncMenu, true);
    window.addEventListener('resize', syncMenu);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('scroll', syncMenu, true);
      window.removeEventListener('resize', syncMenu);
      window.clearTimeout(this.toastTimer);
    });
  }

  @HostListener('document:click', ['$event'])
  protected closeActionMenuOnOutsideClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('.icon-action, .action-menu')) return;
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
  }

  protected organizationName(id: string): string {
    return this.store.organizations().find((item) => item.id === id)?.name ?? '-';
  }

  protected teamName(teamId: string | null): string {
    if (!teamId) return '미지정';
    return this.store.teams().find((team) => team.id === teamId)?.name ?? '미지정';
  }

  protected detailQuery(): Record<string, string> {
    return this.queryFrom(this.params());
  }

  protected openUserDetail(user: OrganizationUser, event: Event): void {
    event.stopPropagation();
    void this.router.navigate(['/users', user.id], { queryParams: this.detailQuery() });
  }

  protected updateQuery(value: string): void {
    this.navigate({ ...this.params(), q: value, page: 1 });
  }

  protected updateFilter(
    key: 'organization' | 'status' | 'registration',
    value: string,
  ): void {
    const next = { ...this.params(), [key]: value, page: 1 };
    if (key === 'organization') next.team = 'all';
    this.navigate(next);
  }

  protected updateTeam(value: string): void {
    this.navigate({ ...this.params(), team: value, page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({
      ...this.params(),
      q: '',
      organization: 'all',
      team: 'all',
      status: 'all',
      registration: 'all',
      page: 1,
    });
  }

  protected sortBy(sort: UserSortKey): void {
    const current = this.params();
    this.navigate({
      ...current,
      sort,
      direction: current.sort === sort && current.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    });
  }

  protected changePage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected openCreate(): void {
    this.formOrganizationId.set('');
    this.form.reset({ name: '', email: '', organizationId: '', teamId: '', phone: '', jobTitle: '' });
    this.editingUserId.set(null);
    this.formError.set('');
    this.dialogMode.set('create');
  }

  protected openEdit(user: OrganizationUser): void {
    this.actionMenu.set(null);
    this.form.reset({
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      teamId: user.teamId ?? '',
      phone: user.phone,
      jobTitle: user.jobTitle,
    });
    this.formOrganizationId.set(user.organizationId);
    this.editingUserId.set(user.id);
    this.formError.set('');
    this.dialogMode.set('edit');
  }

  protected changeOrganization(event: Event): void {
    const organizationId = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.formOrganizationId.set(organizationId);
    this.form.controls.organizationId.setValue(organizationId);
    this.form.controls.teamId.setValue('');
  }

  protected closeDialog(): void {
    this.dialogMode.set(null);
    this.formError.set('');
  }

  protected saveUser(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError.set('이름, 이메일, Organization을 확인해 주세요.');
      return;
    }
    const value = this.form.getRawValue();
    const input = {
      name: value.name,
      email: value.email,
      organizationId: value.organizationId,
      teamId: value.teamId || null,
      phone: value.phone,
      jobTitle: value.jobTitle,
    };
    try {
      if (this.dialogMode() === 'create') this.store.createUser(input);
      else this.store.updateUser(this.editingUserId() ?? '', input);
      this.closeDialog();
      this.showToast(this.dialogMode() === null ? '사용자를 저장했습니다.' : '사용자를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '사용자를 저장하지 못했습니다.');
    }
  }

  protected requestAction(user: OrganizationUser, action: UserAction): void {
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
    this.confirmUserId.set(user.id);
    this.confirmAction.set(action);
  }

  protected closeConfirm(): void {
    this.confirmAction.set(null);
    this.confirmUserId.set(null);
  }

  protected applyAction(): void {
    const user = this.confirmUser();
    const action = this.confirmAction();
    if (!user || !action) return;
    try {
      if (action === 'activate') this.store.activateUser(user.id);
      if (action === 'deactivate') this.store.deactivateUser(user.id);
      if (action === 'delete') this.store.deleteUser(user.id);
      this.showToast(
        action === 'delete'
          ? '사용자를 삭제했습니다.'
          : action === 'activate'
            ? '사용자를 활성화했습니다.'
            : '사용자를 비활성화했습니다.',
      );
      this.closeConfirm();
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : '작업을 완료하지 못했습니다.');
    }
  }

  protected toggleActionMenu(userId: string, event: MouseEvent): void {
    event.stopPropagation();
    const next = this.actionMenu() === userId ? null : userId;
    this.actionMenu.set(next);
    if (!next || !(event.currentTarget instanceof HTMLElement)) {
      this.actionMenuStyle.set(null);
      return;
    }
    this.placeActionMenu(event.currentTarget);
  }

  protected confirmTitle(): string {
    const action = this.confirmAction();
    if (action === 'delete') return '사용자 삭제';
    return action === 'activate' ? '사용자 활성화' : '사용자 비활성화';
  }

  protected confirmMessage(): string {
    const name = this.confirmUser()?.name ?? '사용자';
    const action = this.confirmAction();
    if (action === 'delete') return `${name} 계정을 목록에서 제외합니다. 과거 기록은 유지됩니다.`;
    return action === 'activate'
      ? `${name} 계정을 활성화합니다.`
      : `${name} 계정을 비활성화합니다. Organization 상태는 변경되지 않습니다.`;
  }

  private compare(a: OrganizationUser, b: OrganizationUser, sort: UserSortKey): number {
    const value = (user: OrganizationUser) => {
      switch (sort) {
        case 'organization':
          return this.organizationName(user.organizationId);
        case 'team':
          return this.teamName(user.teamId);
        case 'status':
          return user.active ? '0' : '1';
        case 'registration':
          return user.registrationType;
        case 'joined':
          return user.createdAt;
        case 'login':
          return user.lastLoginAt ?? '';
        default:
          return user.name;
      }
    };
    return value(a).localeCompare(value(b), 'ko');
  }

  private navigate(params: UserListParams): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.queryFrom(params),
    });
  }

  private queryFrom(params: UserListParams): Record<string, string> {
    const query: Record<string, string> = {};
    if (params.q) query['q'] = params.q;
    if (params.organization !== 'all') query['organization'] = params.organization;
    if (params.team !== 'all') query['team'] = params.team;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.registration !== 'all') query['registration'] = params.registration;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    return query;
  }

  private isSortKey(value: string | null): value is UserSortKey {
    return (
      value === 'name' ||
      value === 'organization' ||
      value === 'team' ||
      value === 'status' ||
      value === 'registration' ||
      value === 'joined' ||
      value === 'login'
    );
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 166;
    const menuHeight = 148;
    const gap = 6;
    const openAbove =
      rect.bottom + gap + menuHeight > window.innerHeight && rect.top > menuHeight + gap;
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
