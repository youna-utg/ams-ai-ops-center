import {
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PageContextService } from '../../../core/services/page-context.service';
import { OrganizationsStore } from '../data/organizations.store';
import { ProductsStore } from '../../products/data/products.store';
import {
  OrganizationActivity,
  OrganizationProductAccess,
  OrganizationTeam,
} from '../models/organization.models';

type DetailTab = 'overview' | 'teams' | 'users' | 'products' | 'history';
type HistoryTab = 'product-usage' | 'activity';
type DialogKind = 'organization' | 'team' | 'access' | 'confirm' | null;
type ConfirmAction =
  | 'activate'
  | 'deactivate'
  | 'delete-organization'
  | 'delete-team'
  | 'end-access'
  | 'remove-access'
  | 'reuse-access';

interface ProductHistoryRow {
  id: string;
  product: string;
  event: string;
  detail: string;
  occurredAt: string;
  source: '이용' | '권한';
}

const TABS: readonly DetailTab[] = ['overview', 'teams', 'users', 'products', 'history'];
const DETAIL_QUERY_PARAMS = new Set([
  'tab',
  'team',
  'userQ',
  'userStatus',
  'historyTab',
  'historyProduct',
  'historyType',
  'historyQ',
]);

@Component({
  selector: 'app-organization-detail-page',
  standalone: true,
  imports: [ReactiveFormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './organization-detail.page.html',
  styleUrl: './organization-detail.page.scss',
})
export class OrganizationDetailPage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pageContext = inject(PageContextService);
  protected readonly store = inject(OrganizationsStore);
  private readonly productsStore = inject(ProductsStore);

  protected readonly tabs: ReadonlyArray<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'teams', label: 'Teams' },
    { id: 'users', label: 'Users' },
    { id: 'products', label: 'Products' },
    { id: 'history', label: 'History' },
  ];
  protected readonly products = computed(() => this.productsStore.products().map((product) => product.name));

  private readonly routeState = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('organizationId') ?? '')),
    { initialValue: this.route.snapshot.paramMap.get('organizationId') ?? '' },
  );
  protected readonly queryState = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const requestedTab = params.get('tab') as DetailTab | null;
        const requestedHistoryTab = params.get('historyTab') as HistoryTab | null;
        return {
          tab: requestedTab && TABS.includes(requestedTab) ? requestedTab : 'overview',
          team: params.get('team') ?? 'all',
          userQ: params.get('userQ') ?? '',
          userStatus: params.get('userStatus') ?? 'all',
          historyTab:
            requestedHistoryTab === 'activity' ? 'activity' : 'product-usage',
          historyProduct: params.get('historyProduct') ?? 'all',
          historyType: params.get('historyType') ?? 'all',
          historyQ: params.get('historyQ') ?? '',
        } as const;
      }),
    ),
    {
      initialValue: {
        tab: 'overview' as DetailTab,
        team: 'all',
        userQ: '',
        userStatus: 'all',
        historyTab: 'product-usage' as HistoryTab,
        historyProduct: 'all',
        historyType: 'all',
        historyQ: '',
      },
    },
  );

  protected readonly detail = computed(() =>
    this.store.getOrganizationDetail(this.routeState()),
  );
  protected readonly organization = computed(() => this.detail()?.organization);
  private readonly syncBreadcrumb = effect(() => {
    this.pageContext.organizationName.set(
      this.organization()?.name ?? 'Organization을 찾을 수 없습니다',
    );
  });
  protected readonly activeTab = computed(() => this.queryState().tab);
  protected readonly historyTab = computed(() => this.queryState().historyTab);
  protected readonly dialog = signal<DialogKind>(null);
  protected readonly editingTeam = signal<OrganizationTeam | null>(null);
  protected readonly editingAccess = signal<OrganizationProductAccess | null>(null);
  protected readonly pendingAction = signal<ConfirmAction | null>(null);
  protected readonly pendingTarget = signal<OrganizationTeam | OrganizationProductAccess | null>(
    null,
  );
  protected readonly toast = signal('');
  protected readonly error = signal('');
  private toastTimer?: number;

  protected readonly kpis = computed(() => {
    const detail = this.detail();
    return {
      teams: detail?.teams.length ?? 0,
      users: detail?.users.length ?? 0,
      activeUsers: detail?.users.filter((user) => user.active).length ?? 0,
      products:
        detail?.productAccesses.filter((access) => access.status === 'active').length ?? 0,
    };
  });

  protected readonly activeAccesses = computed(() =>
    this.detail()?.productAccesses.filter((access) => access.status === 'active') ?? [],
  );
  protected readonly endedAccesses = computed(() =>
    this.detail()?.productAccesses.filter((access) => access.status === 'ended') ?? [],
  );

  protected readonly filteredUsers = computed(() => {
    const detail = this.detail();
    if (!detail) return [];
    const query = this.queryState();
    const keyword = query.userQ.trim().toLowerCase();
    return detail.users.filter((user) => {
      const matchesSearch =
        !keyword ||
        `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(keyword);
      const matchesTeam = query.team === 'all' || user.teamId === query.team;
      const matchesStatus =
        query.userStatus === 'all' ||
        (query.userStatus === 'active' ? user.active : !user.active);
      return matchesSearch && matchesTeam && matchesStatus;
    });
  });

  protected readonly activityTypes = computed(() => [
    ...new Set((this.detail()?.activities ?? []).map((activity) => activity.type)),
  ]);

  protected readonly productHistory = computed<ProductHistoryRow[]>(() => {
    const detail = this.detail();
    if (!detail) return [];
    const usageRows = detail.productUsageHistory.map((usage) => ({
      id: usage.id,
      product: usage.product,
      event: '이용 기록',
      detail: `${usage.period} · 활성 User ${usage.activeUsers}명 · ${usage.usageCount}회`,
      occurredAt: usage.recordedAt,
      source: '이용' as const,
    }));
    const accessRows = detail.activities
      .filter((activity) => activity.type.startsWith('product-access-'))
      .map((activity) => ({
        id: activity.id,
        product:
          [...this.products()]
            .sort((left, right) => right.length - left.length)
            .find((product) => activity.description.includes(product)) ?? 'Product',
        event: activity.title,
        detail: activity.description,
        occurredAt: activity.createdAt,
        source: '권한' as const,
      }));
    return [...usageRows, ...accessRows].sort((a, b) =>
      b.occurredAt.localeCompare(a.occurredAt),
    );
  });

  protected readonly filteredProductHistory = computed(() => {
    const query = this.queryState();
    const keyword = query.historyQ.trim().toLowerCase();
    return this.productHistory().filter(
      (row) =>
        (query.historyProduct === 'all' || row.product === query.historyProduct) &&
        (!keyword ||
          `${row.product} ${row.event} ${row.detail}`.toLowerCase().includes(keyword)),
    );
  });

  protected readonly filteredActivities = computed(() => {
    const query = this.queryState();
    const keyword = query.historyQ.trim().toLowerCase();
    return [...(this.detail()?.activities ?? [])]
      .filter(
        (activity) =>
          (query.historyType === 'all' || activity.type === query.historyType) &&
          (!keyword ||
            `${activity.title} ${activity.description} ${activity.type}`
              .toLowerCase()
              .includes(keyword)),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  protected readonly organizationForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    industry: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(80)] }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    contactName: new FormControl('', { nonNullable: true }),
    contactEmail: new FormControl('', {
      nonNullable: true,
      validators: [Validators.email],
    }),
    contactPhone: new FormControl('', { nonNullable: true }),
    address: new FormControl('', { nonNullable: true }),
    contractStartDate: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    contractEndDate: new FormControl('', { nonNullable: true }),
    memo: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
  });

  protected readonly teamForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    memberIds: new FormControl<string[]>([], { nonNullable: true }),
  });

  protected readonly accessForm = new FormGroup({
    product: new FormControl('ChangeUp', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    seatLimit: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)],
    }),
    startsAt: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endsAt: new FormControl('', { nonNullable: true }),
  });

  ngOnDestroy(): void {
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.pageContext.organizationName.set('');
  }

  protected setTab(tab: DetailTab, extra: Record<string, string | null> = {}): void {
    this.updateParams({ tab: tab === 'overview' ? null : tab, ...extra });
  }

  protected setHistoryTab(tab: HistoryTab): void {
    this.updateParams({ historyTab: tab === 'product-usage' ? null : tab });
  }

  protected goBack(): void {
    const queryParams: Record<string, string> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      if (!DETAIL_QUERY_PARAMS.has(key)) {
        const value = this.route.snapshot.queryParamMap.get(key);
        if (value !== null) queryParams[key] = value;
      }
    });
    void this.router.navigate(['/organizations'], { queryParams });
  }

  protected updateFilter(
    key: 'team' | 'userStatus' | 'historyProduct' | 'historyType',
    event: Event,
  ): void {
    const value = (event.target as HTMLSelectElement).value;
    this.updateParams({ [key]: value === 'all' ? null : value });
  }

  protected updateSearch(key: 'userQ' | 'historyQ', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.updateParams({ [key]: value || null }, true);
  }

  protected viewMembers(team: OrganizationTeam): void {
    this.setTab('users', { team: team.id });
  }

  protected openOrganizationEdit(): void {
    const organization = this.organization();
    if (!organization) return;
    this.organizationForm.reset({
      name: organization.name,
      industry: organization.industry,
      description: organization.description,
      contactName: organization.contactName,
      contactEmail: organization.contactEmail,
      contactPhone: organization.contactPhone,
      address: organization.address,
      contractStartDate: organization.contractStartDate,
      contractEndDate: organization.contractEndDate ?? '',
      memo: organization.memo,
    });
    this.error.set('');
    this.dialog.set('organization');
  }

  protected saveOrganization(): void {
    const organization = this.organization();
    const value = this.organizationForm.getRawValue();
    this.organizationForm.markAllAsTouched();
    if (
      !organization ||
      this.organizationForm.invalid ||
      (value.contractEndDate && value.contractEndDate < value.contractStartDate)
    ) {
      this.error.set('필수 항목과 계약일을 확인해 주세요.');
      return;
    }
    this.runStoreAction(() => {
      this.store.updateOrganization(organization.id, {
        ...value,
        name: value.name.trim(),
        industry: value.industry.trim(),
        description: value.description.trim(),
        contactName: value.contactName.trim(),
        contactEmail: value.contactEmail.trim(),
        contactPhone: value.contactPhone.trim(),
        address: value.address.trim(),
        contractEndDate: value.contractEndDate || null,
        memo: value.memo.trim(),
      });
      this.dialog.set(null);
      this.showToast('Organization이 수정되었습니다.');
    });
  }

  protected openTeam(team: OrganizationTeam | null = null): void {
    this.editingTeam.set(team);
    this.teamForm.reset({
      name: team?.name ?? '',
      description: team?.description ?? '',
      memberIds: [...(team?.memberIds ?? [])],
    });
    this.error.set('');
    this.dialog.set('team');
  }

  protected toggleMember(userId: string, checked: boolean): void {
    const ids = this.teamForm.controls.memberIds.value;
    this.teamForm.controls.memberIds.setValue(
      checked ? [...new Set([...ids, userId])] : ids.filter((id) => id !== userId),
    );
  }

  protected saveTeam(): void {
    const organization = this.organization();
    const value = this.teamForm.getRawValue();
    this.teamForm.markAllAsTouched();
    if (!organization || this.teamForm.invalid) return;
    this.runStoreAction(() => {
      if (this.editingTeam()) {
        this.store.updateTeam(this.editingTeam()!.id, {
          name: value.name.trim(),
          description: value.description.trim(),
          memberIds: value.memberIds,
        });
        this.showToast('Team이 수정되었습니다.');
      } else {
        this.store.addTeam(organization.id, {
          name: value.name.trim(),
          description: value.description.trim(),
          memberIds: value.memberIds,
        });
        this.showToast('Team이 추가되었습니다.');
      }
      this.dialog.set(null);
    });
  }

  protected openAccess(access: OrganizationProductAccess | null = null): void {
    this.editingAccess.set(access);
    this.accessForm.reset({
      product: access?.product ?? 'ChangeUp',
      seatLimit: access?.seatLimit ?? 1,
      startsAt: this.dateOnly(access?.startsAt ?? new Date().toISOString()),
      endsAt: access?.endsAt ? this.dateOnly(access.endsAt) : '',
    });
    this.error.set('');
    this.dialog.set('access');
  }

  protected saveAccess(): void {
    const organization = this.organization();
    const value = this.accessForm.getRawValue();
    this.accessForm.markAllAsTouched();
    if (
      !organization ||
      this.accessForm.invalid ||
      (value.endsAt && value.endsAt < value.startsAt) ||
      (!this.editingAccess() &&
        value.startsAt > new Date().toISOString().slice(0, 10))
    ) {
      this.error.set('좌석 수와 이용 기간을 확인해 주세요. 시작일은 오늘 이후일 수 없습니다.');
      return;
    }
    const startsAt = this.toIso(value.startsAt);
    const endsAt = value.endsAt ? this.toIso(value.endsAt, true) : null;
    this.runStoreAction(() => {
      if (this.editingAccess()) {
        this.store.updateProductAccess(this.editingAccess()!.id, {
          product: value.product,
          seatLimit: value.seatLimit,
          startsAt,
          endsAt,
        });
        this.showToast('Product 이용이 수정되었습니다.');
      } else {
        this.store.addProductAccess(organization.id, {
          product: value.product,
          seatLimit: value.seatLimit,
          startsAt,
          endsAt,
        });
        this.showToast('Product 이용이 추가되었습니다.');
      }
      this.dialog.set(null);
    });
  }

  protected requestConfirmation(
    action: ConfirmAction,
    target: OrganizationTeam | OrganizationProductAccess | null = null,
  ): void {
    this.pendingAction.set(action);
    this.pendingTarget.set(target);
    this.error.set('');
    this.dialog.set('confirm');
  }

  protected confirmationTitle(): string {
    const labels: Record<ConfirmAction, string> = {
      activate: 'Organization을 활성화할까요?',
      deactivate: 'Organization을 비활성화할까요?',
      'delete-organization': 'Organization을 삭제할까요?',
      'delete-team': 'Team을 삭제할까요?',
      'end-access': 'Product 이용을 종료할까요?',
      'remove-access': 'Product 이용을 제거할까요?',
      'reuse-access': 'Product를 다시 이용할까요?',
    };
    return this.pendingAction() ? labels[this.pendingAction()!] : '변경을 확인할까요?';
  }

  protected confirmationText(): string {
    if (this.pendingAction() === 'delete-team') {
      return '멤버가 있는 Team은 삭제할 수 없습니다. 멤버를 모두 해제한 뒤 삭제하세요.';
    }
    if (
      this.pendingAction() === 'remove-access' &&
      (this.pendingTarget() as OrganizationProductAccess | null)?.status === 'active'
    ) {
      return '이용 중인 Product는 종료된 뒤 목록에서 제거됩니다.';
    }
    if (this.pendingAction() === 'delete-organization') {
      return '목록에서 제외됩니다. 이 화면에서는 삭제된 Organization의 기록을 다시 열 수 없습니다.';
    }
    return '변경은 바로 반영되고 Organization 활동에 기록됩니다.';
  }

  protected confirmAction(): void {
    const organization = this.organization();
    const action = this.pendingAction();
    const target = this.pendingTarget();
    if (!organization || !action) return;
    this.runStoreAction(() => {
      switch (action) {
        case 'activate':
          this.store.activateOrganization(organization.id);
          this.showToast('Organization이 활성화되었습니다.');
          break;
        case 'deactivate':
          this.store.deactivateOrganization(organization.id);
          this.showToast('Organization이 비활성화되었습니다.');
          break;
        case 'delete-organization':
          this.store.deleteOrganization(organization.id);
          this.showToast('Organization이 삭제되었습니다.');
          this.goBack();
          break;
        case 'delete-team':
          this.store.deleteTeam((target as OrganizationTeam).id);
          this.showToast('Team이 삭제되었습니다.');
          break;
        case 'end-access':
          this.store.endProductAccess((target as OrganizationProductAccess).id);
          this.showToast('Product 이용이 종료되었습니다.');
          break;
        case 'remove-access': {
          const access = target as OrganizationProductAccess;
          if (access.status === 'active') this.store.endProductAccess(access.id);
          this.store.removeProductAccess(access.id);
          this.showToast('Product 이용이 제거되었습니다.');
          break;
        }
        case 'reuse-access': {
          const access = target as OrganizationProductAccess;
          this.store.reuseProductAccess(access.id, {
            startsAt: new Date().toISOString(),
            endsAt: null,
          });
          this.showToast('Product 이용이 다시 시작되었습니다.');
          break;
        }
      }
      this.dialog.set(null);
      this.pendingAction.set(null);
      this.pendingTarget.set(null);
    });
  }

  protected activityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'organization-created': '조직 생성',
      'organization-updated': '조직 수정',
      'organization-deleted': '조직 삭제',
      'organization-activated': '활성화',
      'organization-deactivated': '비활성화',
      'team-created': 'Team 추가',
      'team-updated': 'Team 수정',
      'team-deleted': 'Team 삭제',
      'product-access-added': 'Product 추가',
      'product-access-updated': 'Product 수정',
      'product-access-ended': '이용 종료',
      'product-access-removed': 'Product 제거',
      'product-access-reused': '재이용',
      'usage-recorded': '이용 기록',
      'user-created': '사용자 등록',
      'user-updated': '사용자 수정',
      'user-activated': '사용자 활성화',
      'user-deactivated': '사용자 비활성화',
      'user-deleted': '사용자 삭제',
      'user-organization-changed': '고객사 변경',
      'user-team-changed': '팀 변경',
    };
    return labels[type] ?? type;
  }

  protected teamName(teamId: string | null): string {
    if (!teamId) return '미지정';
    return this.detail()?.teams.find((team) => team.id === teamId)?.name ?? '미지정';
  }

  protected actorName(activity: OrganizationActivity): string {
    if (!activity.actorId) return '시스템';
    return this.detail()?.users.find((user) => user.id === activity.actorId)?.name ?? '시스템';
  }

  protected productStatusLabel(product: string): string {
    const status = this.productsStore.statusOf(product);
    if (status === 'active') return '활성';
    if (status === 'maintenance') return '점검';
    return '비활성';
  }

  protected productStatusTone(product: string): 'success' | 'warning' | 'neutral' {
    const status = this.productsStore.statusOf(product);
    if (status === 'active') return 'success';
    if (status === 'maintenance') return 'warning';
    return 'neutral';
  }

  protected formatDate(value: string | null): string {
    if (!value) return '—';
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value));
  }

  protected formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private updateParams(
    values: Record<string, string | number | null>,
    replaceUrl = false,
  ): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: values,
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }

  private runStoreAction(action: () => void): void {
    try {
      this.error.set('');
      action();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : '작업을 완료하지 못했습니다.');
    }
  }

  private showToast(message: string): void {
    this.toast.set(message);
    if (this.toastTimer) window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 3000);
  }

  private dateOnly(value: string): string {
    return value.slice(0, 10);
  }

  private toIso(value: string, endOfDay = false): string {
    return new Date(`${value}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString();
  }
}
