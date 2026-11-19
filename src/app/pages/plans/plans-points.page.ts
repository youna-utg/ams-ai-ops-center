import { DatePipe } from '@angular/common';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PlansStore } from './data/plans.store';
import {
  CalculationBasis,
  Plan,
  PlanInput,
  PlanType,
  PointPolicy,
  PolicyInput,
  RecordStatus,
  UnitType,
} from './models/plans.models';

type TabId = 'plans' | 'policies';
type SortDirection = 'asc' | 'desc';

interface ListParams {
  tab: TabId;
  q: string;
  status: 'all' | RecordStatus;
  kind: string;
  sort: string;
  direction: SortDirection;
  page: number;
}

@Component({
  selector: 'app-plans-points-page',
  imports: [DatePipe, ReactiveFormsModule, IconComponent, StatusBadgeComponent],
  templateUrl: './plans-points.page.html',
  styleUrl: './plans-points.page.scss',
})
export class PlansPointsPage {
  private readonly store = inject(PlansStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = [
    { id: 'plans' as const, label: 'Plans' },
    { id: 'policies' as const, label: 'Point Policies' },
  ];
  protected readonly params = signal<ListParams>({
    tab: 'plans',
    q: '',
    status: 'all',
    kind: 'all',
    sort: 'name',
    direction: 'asc',
    page: 1,
  });
  protected readonly dialog = signal<'plan' | 'policy' | 'confirm' | null>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly planType = signal<PlanType>('point-based');
  protected readonly basis = signal<CalculationBasis>('request');
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  protected readonly sampleUsd = signal(2);
  protected readonly sampleInput = signal(1000);
  protected readonly sampleOutput = signal(500);
  protected readonly sampleRequests = signal(5);
  protected readonly sampleUnits = signal(3);
  private toastTimer = 0;

  protected readonly planForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', Validators.maxLength(300)],
    type: ['point-based' as PlanType, Validators.required],
    status: ['active' as RecordStatus, Validators.required],
    grantedPoints: [''],
    duration: ['30'],
    customDays: [''],
    requestMode: ['limited'],
    rpm: [''],
  });
  protected readonly policyForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    code: ['', [Validators.required, Validators.maxLength(40)]],
    description: ['', Validators.maxLength(300)],
    status: ['active' as RecordStatus, Validators.required],
    basis: ['request' as CalculationBasis, Validators.required],
    usdUnit: [''],
    pointsPerUsd: [''],
    tokenUnit: [''],
    inputPoints: [''],
    outputPoints: [''],
    pointsPerRequest: [''],
    unitType: ['page' as UnitType],
    pointsPerUnit: [''],
  });
  private readonly policyDraft = signal(this.policyForm.getRawValue());

  protected readonly planSummary = computed(() => this.summary(this.store.plans()));
  protected readonly policySummary = computed(() => this.summary(this.store.policies()));
  protected readonly filteredPlans = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.plans().filter((plan) => {
      const matchesQuery = !query || plan.name.toLowerCase().includes(query) || plan.code.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || plan.status === params.status;
      const matchesType = params.kind === 'all' || plan.type === params.kind;
      return matchesQuery && matchesStatus && matchesType;
    });
    return this.sorted(rows, params, (plan, sort) => this.planValue(plan, sort));
  });
  protected readonly filteredPolicies = computed(() => {
    const params = this.params();
    const query = params.q.trim().toLowerCase();
    const rows = this.store.policies().filter((policy) => {
      const matchesQuery = !query || policy.name.toLowerCase().includes(query) || policy.code.toLowerCase().includes(query);
      const matchesStatus = params.status === 'all' || policy.status === params.status;
      const matchesBasis = params.kind === 'all' || policy.basis === params.kind;
      return matchesQuery && matchesStatus && matchesBasis;
    });
    return this.sorted(rows, params, (policy, sort) => this.policyValue(policy, sort));
  });
  protected readonly activeRows = computed(() => (this.params().tab === 'plans' ? this.filteredPlans() : this.filteredPolicies()));
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.activeRows().length / 10)));
  protected readonly currentPage = computed(() => Math.min(this.params().page, this.totalPages()));
  protected readonly pagedPlans = computed(() => this.pageOf(this.filteredPlans()));
  protected readonly pagedPolicies = computed(() => this.pageOf(this.filteredPolicies()));
  protected readonly pageNumbers = computed(() => Array.from({ length: this.totalPages() }, (_, index) => index + 1));
  protected readonly hasFilters = computed(() => Boolean(this.params().q || this.params().status !== 'all' || this.params().kind !== 'all'));
  protected readonly preview = computed(() => this.buildPreview());

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const status = query.get('status');
      this.params.set({
        tab: query.get('tab') === 'point-policies' ? 'policies' : 'plans',
        q: query.get('q') ?? '',
        status: status === 'active' || status === 'inactive' ? status : 'all',
        kind: query.get('kind') ?? 'all',
        sort: query.get('sort') ?? 'name',
        direction: query.get('direction') === 'desc' ? 'desc' : 'asc',
        page: Math.max(1, Number(query.get('page') ?? 1) || 1),
      });
    });
    this.policyForm.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.policyDraft.set(this.policyForm.getRawValue());
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
  protected closeMenu(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('.icon-action, .action-menu')) return;
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
  }

  protected setTab(tab: TabId): void {
    this.actionMenu.set(null);
    this.navigate({ tab, q: '', status: 'all', kind: 'all', sort: 'name', direction: 'asc', page: 1 });
  }

  protected selectAdjacentTab(event: KeyboardEvent): void {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const current = this.params().tab === 'policies' ? 1 : 0;
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : event.key === 'ArrowRight' ? (current + 1) % 2 : (current + 1) % 2;
    if (event.key === 'ArrowLeft') this.setTab(current === 0 ? 'policies' : 'plans');
    else this.setTab(target === 1 ? 'policies' : 'plans');
  }

  protected updateQuery(value: string): void {
    this.navigate({ ...this.params(), q: value, page: 1 });
  }

  protected updateFilter(key: 'status' | 'kind', value: string): void {
    this.navigate({ ...this.params(), [key]: value || 'all', page: 1 });
  }

  protected clearFilters(): void {
    this.navigate({ ...this.params(), q: '', status: 'all', kind: 'all', page: 1 });
  }

  protected sortBy(sort: string): void {
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

  protected openPlan(plan?: Plan): void {
    this.actionMenu.set(null);
    const duration = !plan
      ? '30'
      : plan.durationDays === null
        ? 'unlimited'
        : plan.durationDays === 7 || plan.durationDays === 30
          ? String(plan.durationDays)
          : 'custom';
    this.planForm.reset({
      name: plan?.name ?? '',
      code: plan?.code ?? '',
      description: plan?.description ?? '',
      type: plan?.type ?? 'point-based',
      status: plan?.status ?? 'active',
      grantedPoints: plan?.grantedPoints === null || plan?.grantedPoints === undefined ? '' : String(plan.grantedPoints),
      duration,
      customDays: duration === 'custom' ? String(plan?.durationDays ?? '') : '',
      requestMode: plan?.requestLimitRpm === null || plan?.requestLimitRpm === undefined ? (plan ? 'unlimited' : 'limited') : 'limited',
      rpm: plan?.requestLimitRpm === null || plan?.requestLimitRpm === undefined ? '' : String(plan.requestLimitRpm),
    });
    if (plan) this.planForm.controls.code.disable();
    else this.planForm.controls.code.enable();
    this.planType.set(plan?.type ?? 'point-based');
    if ((plan?.type ?? 'point-based') === 'unlimited') this.planForm.controls.grantedPoints.disable();
    else this.planForm.controls.grantedPoints.enable();
    this.editingId.set(plan?.id ?? null);
    this.formError.set('');
    this.dialog.set('plan');
  }

  protected changePlanType(event: Event): void {
    const type = event.target instanceof HTMLSelectElement ? event.target.value as PlanType : 'point-based';
    this.planType.set(type);
    this.planForm.controls.type.setValue(type);
    if (type === 'unlimited') {
      this.planForm.controls.grantedPoints.setValue('');
      this.planForm.controls.grantedPoints.disable();
    } else {
      this.planForm.controls.grantedPoints.enable();
    }
  }

  protected savePlan(): void {
    this.planForm.markAllAsTouched();
    const value = this.planForm.getRawValue();
    const existing = this.store.plans().find((plan) => plan.id === this.editingId());
    if (this.planForm.invalid) {
      this.formError.set('플랜명, Plan Code, Plan Type을 확인해 주세요.');
      return;
    }
    if (value.type !== 'unlimited' && this.optionalNumber(value.grantedPoints) === null) {
      this.formError.set('Granted Points를 입력해 주세요.');
      return;
    }
    if (value.duration === 'custom' && (this.optionalNumber(value.customDays) ?? 0) < 1) {
      this.formError.set('Duration은 1일 이상이어야 합니다.');
      return;
    }
    if (value.requestMode === 'limited' && (this.optionalNumber(value.rpm) ?? 0) < 1) {
      this.formError.set('Request Limit은 1 RPM 이상이어야 합니다.');
      return;
    }
    if (existing?.status === 'active' && value.status === 'inactive' && this.formError() !== 'confirmed') {
      this.formError.set('confirmed');
      return;
    }
    try {
      const input = this.planInput(value);
      if (existing) this.store.updatePlan(existing.id, input);
      else this.store.createPlan(input);
      this.closeDialog();
      this.showToast('플랜을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '플랜을 저장하지 못했습니다.');
    }
  }

  protected openPolicy(policy?: PointPolicy): void {
    this.actionMenu.set(null);
    const basis = policy?.basis ?? 'request';
    this.policyForm.reset({
      name: policy?.name ?? '',
      code: policy?.code ?? '',
      description: policy?.description ?? '',
      status: policy?.status ?? 'active',
      basis,
      usdUnit: this.text(policy?.usdUnit),
      pointsPerUsd: this.text(policy?.pointsPerUsdUnit),
      tokenUnit: this.text(policy?.tokenUnit),
      inputPoints: this.text(policy?.inputPoints),
      outputPoints: this.text(policy?.outputPoints),
      pointsPerRequest: this.text(policy?.pointsPerRequest),
      unitType: policy?.unitType ?? 'page',
      pointsPerUnit: this.text(policy?.pointsPerUnit),
    });
    if (policy) this.policyForm.controls.code.disable();
    else this.policyForm.controls.code.enable();
    this.basis.set(basis);
    this.policyDraft.set(this.policyForm.getRawValue());
    this.editingId.set(policy?.id ?? null);
    this.formError.set('');
    this.dialog.set('policy');
  }

  protected changeBasis(event: Event): void {
    const basis = event.target instanceof HTMLSelectElement ? event.target.value as CalculationBasis : 'request';
    this.basis.set(basis);
    this.policyForm.patchValue({
      basis,
      usdUnit: '',
      pointsPerUsd: '',
      tokenUnit: '',
      inputPoints: '',
      outputPoints: '',
      pointsPerRequest: '',
      unitType: 'page',
      pointsPerUnit: '',
    });
  }

  protected savePolicy(): void {
    this.policyForm.markAllAsTouched();
    const value = this.policyForm.getRawValue();
    const existing = this.store.policies().find((policy) => policy.id === this.editingId());
    if (this.policyForm.invalid) {
      this.formError.set('정책명, Policy Code, Calculation Basis를 확인해 주세요.');
      return;
    }
    if (existing?.status === 'active' && value.status === 'inactive' && this.formError() !== 'confirmed') {
      this.formError.set('confirmed');
      return;
    }
    try {
      const input = this.policyInput(value);
      if (existing) this.store.updatePolicy(existing.id, input);
      else this.store.createPolicy(input);
      this.closeDialog();
      this.showToast('정책을 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : '정책을 저장하지 못했습니다.');
    }
  }

  protected requestStatus(id: string, active: boolean): void {
    this.actionMenu.set(null);
    if (active) {
      this.applyStatus(id, true);
      return;
    }
    this.editingId.set(id);
    this.formError.set('');
    this.dialog.set('confirm');
  }

  protected confirmStatus(): void {
    const id = this.editingId();
    if (!id) return;
    this.applyStatus(id, false);
    this.closeDialog();
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
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

  protected editMenuRecord(): void {
    const id = this.actionMenu();
    if (!id) return;
    if (this.params().tab === 'plans') {
      const plan = this.store.plans().find((item) => item.id === id);
      if (plan) this.openPlan(plan);
      return;
    }
    const policy = this.store.policies().find((item) => item.id === id);
    if (policy) this.openPolicy(policy);
  }

  protected menuIsActive(): boolean {
    const id = this.actionMenu();
    if (!id) return false;
    if (this.params().tab === 'plans') return this.store.plans().find((item) => item.id === id)?.status === 'active';
    return this.store.policies().find((item) => item.id === id)?.status === 'active';
  }

  protected openFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('button')) return;
    if (this.params().tab === 'plans') {
      const plan = this.store.plans().find((item) => item.id === id);
      if (plan) this.openPlan(plan);
      return;
    }
    const policy = this.store.policies().find((item) => item.id === id);
    if (policy) this.openPolicy(policy);
  }

  protected setSample(key: 'usd' | 'input' | 'output' | 'requests' | 'units', value: string): void {
    const parsed = Number(value);
    const next = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    if (key === 'usd') this.sampleUsd.set(next);
    if (key === 'input') this.sampleInput.set(next);
    if (key === 'output') this.sampleOutput.set(next);
    if (key === 'requests') this.sampleRequests.set(next);
    if (key === 'units') this.sampleUnits.set(next);
  }

  protected statusLabel(status: RecordStatus): string {
    return status === 'active' ? '활성' : '비활성';
  }

  protected typeLabel(type: PlanType): string {
    if (type === 'point-based') return 'Point-based';
    return type.slice(0, 1).toUpperCase() + type.slice(1);
  }

  protected pointsLabel(plan: Plan): string {
    if (plan.type === 'unlimited' || plan.grantedPoints === null) return 'Unlimited';
    return `${this.formatNumber(plan.grantedPoints)} Points`;
  }

  protected durationLabel(plan: Plan): string {
    return plan.durationDays === null ? 'Unlimited' : `${this.formatNumber(plan.durationDays)} Days`;
  }

  protected limitLabel(plan: Plan): string {
    return plan.requestLimitRpm === null ? 'Unlimited' : `${this.formatNumber(plan.requestLimitRpm)} RPM`;
  }

  protected basisLabel(policy: PointPolicy): string {
    if (policy.basis === 'usd') return 'USD-based';
    if (policy.basis === 'token') return 'Token-based';
    if (policy.basis === 'request') return 'Request-based';
    return `Unit-based · ${this.unitLabel(policy.unitType ?? 'page')}`;
  }

  protected ruleSummary(policy: PointPolicy): string {
    if (policy.basis === 'usd' && policy.pointsPerUsdUnit !== null && policy.usdUnit !== null) {
      return `${this.formatNumber(policy.pointsPerUsdUnit)} Points per ${this.formatNumber(policy.usdUnit)} USD`;
    }
    if (policy.basis === 'token' && policy.inputPoints !== null && policy.outputPoints !== null && policy.tokenUnit !== null) {
      return `${this.formatNumber(policy.inputPoints)} / ${this.formatNumber(policy.outputPoints)} Points per ${this.formatNumber(policy.tokenUnit)} Tokens`;
    }
    if (policy.basis === 'request' && policy.pointsPerRequest !== null) {
      return `${this.formatNumber(policy.pointsPerRequest)} Points per Request`;
    }
    if (policy.basis === 'unit' && policy.pointsPerUnit !== null && policy.unitType) {
      return `${this.formatNumber(policy.pointsPerUnit)} Points per ${this.unitLabel(policy.unitType)}`;
    }
    return '—';
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
  }

  private applyStatus(id: string, active: boolean): void {
    if (this.params().tab === 'plans') this.store.setPlanActive(id, active);
    else this.store.setPolicyActive(id, active);
    this.showToast(active ? '활성화했습니다.' : '비활성화했습니다.');
  }

  private planInput(value: ReturnType<typeof this.planForm.getRawValue>): PlanInput {
    const durationDays = value.duration === 'unlimited' ? null : value.duration === 'custom' ? this.optionalNumber(value.customDays) : Number(value.duration);
    return {
      name: value.name,
      code: value.code,
      description: value.description,
      type: value.type,
      status: value.status,
      grantedPoints: value.type === 'unlimited' ? null : this.optionalNumber(value.grantedPoints),
      durationDays,
      requestLimitRpm: value.requestMode === 'unlimited' ? null : this.optionalNumber(value.rpm),
    };
  }

  private policyInput(value: ReturnType<typeof this.policyForm.getRawValue>): PolicyInput {
    return {
      name: value.name,
      code: value.code,
      description: value.description,
      status: value.status,
      basis: this.basis(),
      usdUnit: this.optionalNumber(value.usdUnit),
      pointsPerUsdUnit: this.optionalNumber(value.pointsPerUsd),
      tokenUnit: this.optionalNumber(value.tokenUnit),
      inputPoints: this.optionalNumber(value.inputPoints),
      outputPoints: this.optionalNumber(value.outputPoints),
      pointsPerRequest: this.optionalNumber(value.pointsPerRequest),
      unitType: value.unitType,
      pointsPerUnit: this.optionalNumber(value.pointsPerUnit),
    };
  }

  private buildPreview(): { label: string; result: string } | null {
    const draft = this.policyDraft();
    const basis = this.basis();
    const amount = (value: string) => this.optionalNumber(value);
    if (basis === 'request') {
      const rate = amount(draft.pointsPerRequest);
      if (rate === null) return null;
      return { label: `${this.formatNumber(this.sampleRequests())} Requests`, result: `${this.formatNumber(rate * this.sampleRequests())} Points` };
    }
    if (basis === 'usd') {
      const unit = amount(draft.usdUnit);
      const rate = amount(draft.pointsPerUsd);
      if (unit === null || unit <= 0 || rate === null) return null;
      return { label: `${this.formatNumber(this.sampleUsd())} USD`, result: `${this.formatNumber((this.sampleUsd() / unit) * rate)} Points` };
    }
    if (basis === 'token') {
      const unit = amount(draft.tokenUnit);
      const input = amount(draft.inputPoints);
      const output = amount(draft.outputPoints);
      if (unit === null || unit <= 0 || input === null || output === null) return null;
      const total = (this.sampleInput() / unit) * input + (this.sampleOutput() / unit) * output;
      return {
        label: `${this.formatNumber(this.sampleInput())} Input / ${this.formatNumber(this.sampleOutput())} Output Tokens`,
        result: `${this.formatNumber(total)} Points`,
      };
    }
    const rate = amount(draft.pointsPerUnit);
    if (rate === null) return null;
    return { label: `${this.formatNumber(this.sampleUnits())} ${this.unitLabel(draft.unitType)}`, result: `${this.formatNumber(rate * this.sampleUnits())} Points` };
  }

  private optionalNumber(value: string | number | null): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value === null || value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private text(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  private unitLabel(unit: UnitType): string {
    if (unit === 'page') return 'Page';
    if (unit === 'image') return 'Image';
    if (unit === 'minute') return 'Minute';
    return 'Slide';
  }

  private summary(records: readonly { status: RecordStatus }[]): { total: number; active: number; inactive: number } {
    return {
      total: records.length,
      active: records.filter((item) => item.status === 'active').length,
      inactive: records.filter((item) => item.status === 'inactive').length,
    };
  }

  private sorted<T>(rows: readonly T[], params: ListParams, valueOf: (row: T, sort: string) => string | number): T[] {
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = valueOf(left, params.sort);
      const b = valueOf(right, params.sort);
      const result = typeof a === 'number' && typeof b === 'number' ? a - b : String(a).localeCompare(String(b), 'ko');
      return result * direction;
    });
  }

  private planValue(plan: Plan, sort: string): string | number {
    if (sort === 'code') return plan.code;
    if (sort === 'type') return plan.type;
    if (sort === 'points') return plan.grantedPoints ?? Number.POSITIVE_INFINITY;
    if (sort === 'duration') return plan.durationDays ?? Number.POSITIVE_INFINITY;
    if (sort === 'limit') return plan.requestLimitRpm ?? Number.POSITIVE_INFINITY;
    if (sort === 'status') return plan.status;
    return plan.name;
  }

  private policyValue(policy: PointPolicy, sort: string): string | number {
    if (sort === 'code') return policy.code;
    if (sort === 'basis') return this.basisLabel(policy);
    if (sort === 'summary') return this.ruleSummary(policy);
    if (sort === 'status') return policy.status;
    if (sort === 'updated') return policy.updatedAt;
    return policy.name;
  }

  private pageOf<T>(rows: readonly T[]): T[] {
    const page = Math.min(this.currentPage(), Math.max(1, Math.ceil(rows.length / 10)));
    return rows.slice((page - 1) * 10, page * 10);
  }

  private navigate(params: ListParams): void {
    const query: Record<string, string> = {};
    if (params.tab === 'policies') query['tab'] = 'point-policies';
    if (params.q) query['q'] = params.q;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.kind !== 'all') query['kind'] = params.kind;
    if (params.sort !== 'name') query['sort'] = params.sort;
    if (params.direction !== 'asc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = 74;
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
