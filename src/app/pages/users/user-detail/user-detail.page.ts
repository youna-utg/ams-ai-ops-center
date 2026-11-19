import { DatePipe } from '@angular/common';
import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PageContextService } from '../../../core/services/page-context.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { OrganizationsStore } from '../../organizations/data/organizations.store';
import { OrganizationActivityType, OrganizationProduct } from '../../organizations/models/organization.models';
import { ProductsStore } from '../../products/data/products.store';

type DetailTab = 'overview' | 'access' | 'usage' | 'history';
type UserAction = 'activate' | 'deactivate' | 'delete';

@Component({
  selector: 'app-user-detail-page',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, IconComponent, StatusBadgeComponent],
  templateUrl: './user-detail.page.html',
  styleUrl: './user-detail.page.scss',
})
export class UserDetailPage {
  private readonly store = inject(OrganizationsStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly pageContext = inject(PageContextService);
  private readonly productsStore = inject(ProductsStore);

  protected readonly products = computed(() => this.productsStore.products().map((product) => product.name));
  protected readonly tabs: ReadonlyArray<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Overview' },
    { id: 'access', label: 'Product Access' },
    { id: 'usage', label: 'Usage' },
    { id: 'history', label: 'History' },
  ];
  protected readonly userId = signal('');
  protected readonly tab = signal<DetailTab>('overview');
  protected readonly usageProduct = signal('all');
  protected readonly usageFrom = signal('');
  protected readonly usageTo = signal('');
  protected readonly historyAction = signal('all');
  protected readonly historyFrom = signal('');
  protected readonly historyTo = signal('');
  protected readonly editing = signal(false);
  protected readonly moreOpen = signal(false);
  protected readonly confirmAction = signal<UserAction | null>(null);
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  private toastTimer = 0;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    organizationId: ['', Validators.required],
    teamId: [''],
    phone: ['', Validators.maxLength(30)],
    jobTitle: ['', Validators.maxLength(80)],
  });

  protected readonly user = computed(() => this.store.getUserById(this.userId()));
  protected readonly organization = computed(() =>
    this.store.organizations().find((item) => item.id === this.user()?.organizationId),
  );
  protected readonly team = computed(() =>
    this.store.teams().find((item) => item.id === this.user()?.teamId),
  );
  protected readonly formOrganizationId = signal('');
  protected readonly organizationTeams = computed(() =>
    this.store.teams().filter((team) => team.organizationId === this.formOrganizationId()),
  );
  protected readonly organizations = this.store.organizations;
  protected readonly accessRows = computed(() => {
    const user = this.user();
    const organization = this.organization();
    if (!user || !organization) return [];
    const today = new Date().toISOString().slice(0, 10);
    const accesses = this.store.productAccesses().filter((item) => item.organizationId === organization.id);
    return this.products().map((product) => {
      const access = accesses.find((item) => item.product === product);
      const catalog = this.productsStore.statusOf(product);
      const expired = Boolean(access?.endsAt && access.endsAt < today);
      const organizationReady = organization.status === 'active' && access?.status === 'active';
      const available = user.active && organizationReady && catalog === 'active';
      const effective = catalog === 'maintenance' && user.active && organizationReady
        ? '점검 중'
        : available
          ? '이용 가능'
          : '제한';
      return {
        product,
        organizationAccess: !access ? '없음' : access.status === 'active' ? '이용 중' : '종료',
        productStatus: catalog === 'active' ? '활성' : catalog === 'maintenance' ? '점검' : '비활성',
        expiration: !access?.endsAt ? '미설정' : expired ? '만료' : '유효',
        expired: expired && access?.status === 'active',
        effective,
      };
    });
  });
  protected readonly availableProductCount = computed(
    () => this.accessRows().filter((row) => row.organizationAccess === '이용 중').length,
  );
  protected readonly usageRecords = computed(() => {
    const user = this.user();
    if (!user) return [];
    return this.store
      .userUsageFor(user.id)
      .filter((record) => {
        const day = record.occurredAt.slice(0, 10);
        const matchesProduct = this.usageProduct() === 'all' || record.product === this.usageProduct();
        const matchesFrom = !this.usageFrom() || day >= this.usageFrom();
        const matchesTo = !this.usageTo() || day <= this.usageTo();
        return matchesProduct && matchesFrom && matchesTo;
      })
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  });
  protected readonly usageSummary = computed(() =>
    this.usageRecords().reduce(
      (summary, record) => ({
        requests: summary.requests + record.requests,
        inputTokens: summary.inputTokens + record.inputTokens,
        outputTokens: summary.outputTokens + record.outputTokens,
        cost: summary.cost + record.providerCost,
      }),
      { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 },
    ),
  );
  protected readonly usageByProduct = computed(() => {
    const groups = new Map<OrganizationProduct, { requests: number; inputTokens: number; outputTokens: number; cost: number }>();
    this.usageRecords().forEach((record) => {
      const current = groups.get(record.product) ?? { requests: 0, inputTokens: 0, outputTokens: 0, cost: 0 };
      groups.set(record.product, {
        requests: current.requests + record.requests,
        inputTokens: current.inputTokens + record.inputTokens,
        outputTokens: current.outputTokens + record.outputTokens,
        cost: current.cost + record.providerCost,
      });
    });
    return [...groups.entries()].map(([product, values]) => ({ product, ...values }));
  });
  protected readonly hasAnyUsage = computed(() => {
    const user = this.user();
    return Boolean(user && this.store.userUsageFor(user.id).length);
  });
  protected readonly history = computed(() => {
    const user = this.user();
    if (!user) return [];
    return this.store.userHistory(user.id).filter((activity) => {
      const day = activity.createdAt.slice(0, 10);
      const matchesAction = this.historyAction() === 'all' || activity.type === this.historyAction();
      const matchesFrom = !this.historyFrom() || day >= this.historyFrom();
      const matchesTo = !this.historyTo() || day <= this.historyTo();
      return matchesAction && matchesFrom && matchesTo;
    });
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.userId.set(params.get('userId') ?? '');
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const tab = query.get('tab');
      this.tab.set(tab === 'access' || tab === 'usage' || tab === 'history' ? tab : 'overview');
      this.usageProduct.set(query.get('usageProduct') ?? 'all');
      this.usageFrom.set(query.get('usageFrom') ?? '');
      this.usageTo.set(query.get('usageTo') ?? '');
      this.historyAction.set(query.get('historyAction') ?? 'all');
      this.historyFrom.set(query.get('historyFrom') ?? '');
      this.historyTo.set(query.get('historyTo') ?? '');
    });
    effect(() => this.pageContext.userName.set(this.user()?.name ?? ''));
  }

  @HostListener('document:click', ['$event'])
  protected closeMore(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('.more-actions')) return;
    this.moreOpen.set(false);
  }

  protected setTab(tab: DetailTab): void {
    this.updateQuery({ tab: tab === 'overview' ? null : tab });
  }

  protected updateUsage(key: 'usageProduct' | 'usageFrom' | 'usageTo', value: string): void {
    this.updateQuery({ [key]: value || null });
  }

  protected updateHistory(key: 'historyAction' | 'historyFrom' | 'historyTo', value: string): void {
    this.updateQuery({ [key]: value || null });
  }

  protected goBack(): void {
    const queryParams: Record<string, string> = {};
    this.route.snapshot.queryParamMap.keys.forEach((key) => {
      if (['tab', 'usageProduct', 'usageFrom', 'usageTo', 'historyAction', 'historyFrom', 'historyTo'].includes(key)) return;
      const value = this.route.snapshot.queryParamMap.get(key);
      if (value !== null) queryParams[key] = value;
    });
    void this.router.navigate(['/users'], { queryParams });
  }

  protected openEdit(): void {
    const user = this.user();
    if (!user) return;
    this.form.reset({
      name: user.name,
      email: user.email,
      organizationId: user.organizationId,
      teamId: user.teamId ?? '',
      phone: user.phone,
      jobTitle: user.jobTitle,
    });
    this.formOrganizationId.set(user.organizationId);
    this.formError.set('');
    this.moreOpen.set(false);
    this.editing.set(true);
  }

  protected changeOrganization(event: Event): void {
    const organizationId = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.formOrganizationId.set(organizationId);
    this.form.controls.organizationId.setValue(organizationId);
    this.form.controls.teamId.setValue('');
  }

  protected closeEdit(): void {
    this.editing.set(false);
    this.formError.set('');
  }

  protected saveUser(): void {
    const user = this.user();
    this.form.markAllAsTouched();
    if (!user || this.form.invalid) {
      this.formError.set('이름, 이메일, Organization을 확인해 주세요.');
      return;
    }
    const value = this.form.getRawValue();
    try {
      this.store.updateUser(user.id, {
        name: value.name,
        email: value.email,
        organizationId: value.organizationId,
        teamId: value.teamId || null,
        phone: value.phone,
        jobTitle: value.jobTitle,
      });
      this.closeEdit();
      this.showToast('사용자를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '사용자를 저장하지 못했습니다.');
    }
  }

  protected requestAction(action: UserAction): void {
    this.moreOpen.set(false);
    this.confirmAction.set(action);
  }

  protected applyAction(): void {
    const user = this.user();
    const action = this.confirmAction();
    if (!user || !action) return;
    try {
      if (action === 'delete') {
        this.store.deleteUser(user.id);
        this.showToast('사용자를 삭제했습니다.');
        this.goBack();
        return;
      }
      if (action === 'activate') this.store.activateUser(user.id);
      if (action === 'deactivate') this.store.deactivateUser(user.id);
      this.confirmAction.set(null);
      this.showToast(action === 'activate' ? '사용자를 활성화했습니다.' : '사용자를 비활성화했습니다.');
    } catch (error) {
      this.showToast(error instanceof Error ? error.message : '작업을 완료하지 못했습니다.');
    }
  }

  protected actorName(actorId: string | null): string {
    if (!actorId) return '시스템';
    return this.store.users().find((user) => user.id === actorId)?.name ?? '시스템';
  }

  protected actionLabel(type: OrganizationActivityType): string {
    const labels: Partial<Record<OrganizationActivityType, string>> = {
      'user-created': '사용자 등록',
      'user-updated': '사용자 수정',
      'user-activated': '활성화',
      'user-deactivated': '비활성화',
      'user-deleted': '삭제',
      'user-organization-changed': '고객사 변경',
      'user-team-changed': '팀 변경',
    };
    return labels[type] ?? type;
  }

  protected display(value: string | null | undefined): string {
    return value ? value : '—';
  }

  protected money(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  private updateQuery(values: Record<string, string | null>): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: values,
      queryParamsHandling: 'merge',
    });
  }

  private showToast(message: string): void {
    this.toast.set(message);
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.set(''), 2400);
  }
}
