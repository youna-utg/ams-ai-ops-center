import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Params, Router, RouterLink } from '@angular/router';
import { ChartData, ChartOptions } from 'chart.js';
import { areaFade, barGradientPlugin } from '../../shared/charts/chart-fill';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { ProductsStore } from '../products/data/products.store';
import { USAGE_CLOCK, formatKst, inclusiveDays, kstDay, kstHour, shiftDate, weekStart } from './data/usage-dates';
import { UsageStore } from './data/usage.store';
import {
  ApiUsageRecord,
  BillingUnit,
  RateCard,
  RequestStatus,
  usesDualPrice,
} from './models/usage.models';

type TabId = 'api-usage' | 'cost-analytics' | 'rate-cards';
type RangeId = '1' | '7' | '30' | 'custom';
type Direction = 'asc' | 'desc';
type PageSize = 10 | 20 | 50;
type DialogId = 'request' | 'rate' | 'view-rate' | 'confirm' | null;

interface ListParams {
  tab: TabId;
  range: RangeId;
  from: string;
  to: string;
  product: string;
  provider: string;
  model: string;
  status: 'all' | RequestStatus;
  sort: string;
  direction: Direction;
  page: number;
  size: PageSize;
  cSort: string;
  cDir: Direction;
  cPage: number;
  rq: string;
  rProvider: string;
  rModel: string;
  rUnit: string;
  rStatus: 'all' | 'active' | 'inactive';
  rFrom: string;
  rTo: string;
  rSort: string;
  rDir: Direction;
  rPage: number;
}

interface Bucket {
  success: number;
  error: number;
  input: number;
  output: number;
  cost: number;
}

@Component({
  selector: 'app-usage-costs-page',
  imports: [ReactiveFormsModule, RouterLink, ChartComponent, IconComponent, StatusBadgeComponent],
  templateUrl: './usage-costs.page.html',
  styleUrl: './usage-costs.page.scss',
})
export class UsageCostsPage {
  protected readonly productsStore = inject(ProductsStore);
  protected readonly usage = inject(UsageStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tabs = [
    { id: 'api-usage' as const, label: 'API Usage' },
    { id: 'cost-analytics' as const, label: 'Cost Analytics' },
    { id: 'rate-cards' as const, label: 'Rate Cards' },
  ];
  protected readonly ranges = [
    { id: '1' as const, label: 'Today' },
    { id: '7' as const, label: 'Last 7 Days' },
    { id: '30' as const, label: 'Last 30 Days' },
    { id: 'custom' as const, label: 'Custom Range' },
  ];
  protected readonly billingUnits: { id: BillingUnit; label: string }[] = [
    { id: '1m-tokens', label: '1M Tokens' },
    { id: '1k-characters', label: '1K Characters' },
    { id: 'request', label: 'Request' },
    { id: 'image', label: 'Image' },
    { id: 'audio-minute', label: 'Audio Minute' },
    { id: 'page', label: 'Page' },
  ];
  protected readonly barPlugins = [barGradientPlugin];
  protected readonly params = signal<ListParams>(this.emptyParams());
  protected readonly dialog = signal<DialogId>(null);
  protected readonly editingId = signal<string | null>(null);
  protected readonly selectedProviderId = signal('');
  protected readonly selectedUnit = signal<BillingUnit>('1m-tokens');
  protected readonly formError = signal('');
  protected readonly toast = signal('');
  protected readonly actionMenu = signal<string | null>(null);
  protected readonly actionMenuStyle = signal<{ top: string; left: string } | null>(null);
  private toastTimer = 0;

  protected readonly rateForm = this.formBuilder.nonNullable.group({
    providerId: ['', Validators.required],
    modelId: ['', Validators.required],
    billingUnit: ['1m-tokens' as BillingUnit, Validators.required],
    inputPrice: [''],
    outputPrice: [''],
    unitPrice: [''],
    effectiveDate: [USAGE_CLOCK, Validators.required],
    status: ['active' as 'active' | 'inactive', Validators.required],
  });

  protected readonly window = computed(() => this.resolveWindow(this.params()));
  protected readonly usageRecords = computed(() => this.filterRecords(this.params(), true));
  protected readonly costRecords = computed(() => this.filterRecords(this.params(), false));
  protected readonly usageSummary = computed(() => this.summarize(this.usageRecords()));
  protected readonly costSummary = computed(() => {
    const current = this.costRecords();
    const params = this.params();
    const bounds = this.window();
    const length = Math.max(inclusiveDays(bounds.start, bounds.end), 1);
    const previousEnd = shiftDate(bounds.start, -1);
    const previousStart = shiftDate(previousEnd, -(length - 1));
    const previous = this.usage.records().filter((record) => {
      const day = kstDay(record.timestamp);
      return day >= previousStart && day <= previousEnd && this.matchesDimensions(record, params);
    });
    const total = current.reduce((sum, record) => sum + record.costUsd, 0);
    const previousTotal = previous.reduce((sum, record) => sum + record.costUsd, 0);
    return {
      total,
      change: previous.length === 0 || previousTotal === 0 ? null : ((total - previousTotal) / previousTotal) * 100,
      topProduct: this.topName(current, (record) => record.productId, (id) => this.productsStore.getById(id)?.name ?? id),
      topProvider: this.topName(current, (record) => record.providerId, (id) => this.productsStore.providerName(id)),
    };
  });
  protected readonly usageBuckets = computed(() => this.buildBuckets(this.usageRecords(), this.window(), this.params().range));
  protected readonly costBuckets = computed(() => this.buildBuckets(this.costRecords(), this.window(), this.params().range));
  protected readonly requestsChart = computed<ChartData<'line'>>(() => this.lineChart(this.usageBuckets(), [
    { key: 'success', label: 'Success', color: '--chart-series-primary' },
    { key: 'error', label: 'Error', color: '--chart-series-warning' },
  ]));
  protected readonly tokenChart = computed<ChartData<'line'>>(() => this.lineChart(this.usageBuckets(), [
    { key: 'input', label: 'Input Tokens', color: '--chart-series-primary' },
    { key: 'output', label: 'Output Tokens', color: '--chart-series-secondary' },
  ]));
  protected readonly errorChart = computed<ChartData<'line'>>(() => ({
    labels: this.usageBuckets().labels,
    datasets: [{
      label: 'Error Rate',
      data: this.usageBuckets().rows.map((row) => (row.success + row.error ? (row.error / (row.success + row.error)) * 100 : 0)),
      borderColor: 'var(--chart-series-warning)',
      backgroundColor: areaFade('--chart-series-warning', '#f5b942'),
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      fill: true,
      tension: 0.35,
    }],
  }));
  protected readonly costTrendChart = computed<ChartData<'line'>>(() => this.lineChart(this.costBuckets(), [
    { key: 'cost', label: 'Provider Cost', color: '--chart-series-success' },
  ]));
  protected readonly productCostChart = computed(() => this.barChart(this.groupCost(this.costRecords(), (record) => this.productsStore.getById(record.productId)?.name ?? record.productId)));
  protected readonly providerCostChart = computed<ChartData<'doughnut'>>(() => {
    const groups = this.groupCost(this.costRecords(), (record) => this.productsStore.providerName(record.providerId));
    return {
      labels: groups.map((item) => item.label),
      datasets: [{
        label: 'Provider Cost',
        data: groups.map((item) => item.value),
        backgroundColor: ['var(--chart-series-primary)', 'var(--chart-series-secondary)', 'var(--chart-series-success)', 'var(--chart-series-warning)', 'var(--chart-series-muted)'],
        borderColor: 'var(--color-surface)',
        borderWidth: 3,
      }],
    };
  });
  protected readonly modelCostChart = computed(() => this.barChart(this.groupCost(this.costRecords(), (record) => this.productsStore.modelName(record.modelId)), '--chart-series-secondary'));
  protected readonly modelOptions = computed(() => {
    const provider = this.params().provider;
    return this.productsStore.models().filter((model) => provider === 'all' || model.providerId === provider);
  });
  protected readonly formModels = computed(() => this.productsStore.models().filter((model) => model.providerId === this.selectedProviderId()));
  protected readonly rateModelOptions = computed(() => {
    const provider = this.params().rProvider;
    return this.productsStore.models().filter((model) => provider === 'all' || model.providerId === provider);
  });
  protected readonly requestRows = computed(() => this.sortRecords(this.usageRecords()));
  protected readonly requestPages = computed(() => Math.max(1, Math.ceil(this.requestRows().length / this.params().size)));
  protected readonly requestPage = computed(() => Math.min(this.params().page, this.requestPages()));
  protected readonly pagedRequests = computed(() => this.slice(this.requestRows(), this.requestPage(), this.params().size));
  protected readonly breakdownRows = computed(() => this.breakdown(this.costRecords()));
  protected readonly breakdownPages = computed(() => Math.max(1, Math.ceil(this.breakdownRows().length / 10)));
  protected readonly breakdownPage = computed(() => Math.min(this.params().cPage, this.breakdownPages()));
  protected readonly pagedBreakdown = computed(() => this.slice(this.breakdownRows(), this.breakdownPage(), 10));
  protected readonly breakdownTotal = computed(() => this.breakdownRows().reduce((sum, row) => sum + row.cost, 0));
  protected readonly rateRows = computed(() => this.filteredRates());
  protected readonly ratePages = computed(() => Math.max(1, Math.ceil(this.rateRows().length / 10)));
  protected readonly ratePage = computed(() => Math.min(this.params().rPage, this.ratePages()));
  protected readonly pagedRates = computed(() => this.slice(this.rateRows(), this.ratePage(), 10));
  protected readonly viewedRequest = computed(() => this.usage.records().find((record) => record.id === this.editingId()) ?? null);
  protected readonly viewedRate = computed(() => this.usage.rateCards().find((card) => card.id === this.editingId()) ?? null);
  protected readonly viewedHistory = computed(() => this.usage.historyFor(this.editingId() ?? ''));
  protected readonly dualPrice = computed(() => usesDualPrice(this.selectedUnit()));
  protected readonly granularityLabel = computed(() => {
    const mode = this.granularity(this.window(), this.params().range);
    return mode === 'hour' ? 'Hourly' : mode === 'week' ? 'Weekly' : 'Daily';
  });

  protected readonly lineOptions: ChartOptions<'line'> = this.axisOptions();
  protected readonly percentOptions: ChartOptions<'line'> = this.axisOptions('%');
  protected readonly moneyOptions: ChartOptions<'line'> = this.axisOptions('$');
  protected readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (context) => ` ${context.dataset.label ?? ''}: ${this.formatUsd(context.parsed.y ?? 0)}` } },
    },
    scales: {
      x: { border: { display: false }, grid: { display: false }, ticks: { color: 'var(--color-text-muted)', maxRotation: 0, autoSkipPadding: 16 } },
      y: { border: { display: false }, beginAtZero: true, ticks: { color: 'var(--color-text-muted)', maxTicksLimit: 4 } },
    },
  };
  protected readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, color: 'var(--color-text-secondary)' } } },
  };

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed()).subscribe((query) => {
      const range = query.get('range');
      const status = query.get('status');
      const size = Number(query.get('size'));
      const rStatus = query.get('rStatus');
      this.params.set({
        tab: query.get('tab') === 'cost-analytics' || query.get('tab') === 'rate-cards' ? query.get('tab') as TabId : 'api-usage',
        range: range === '1' || range === '7' || range === 'custom' ? range : '30',
        from: query.get('from') ?? '',
        to: query.get('to') ?? '',
        product: query.get('product') ?? 'all',
        provider: query.get('provider') ?? 'all',
        model: query.get('model') ?? 'all',
        status: status === 'success' || status === 'error' ? status : 'all',
        sort: query.get('sort') ?? 'timestamp',
        direction: query.get('direction') === 'asc' ? 'asc' : 'desc',
        page: Math.max(1, Number(query.get('page') ?? 1) || 1),
        size: size === 10 || size === 50 ? size : 20,
        cSort: query.get('cSort') ?? 'cost',
        cDir: query.get('cDir') === 'asc' ? 'asc' : 'desc',
        cPage: Math.max(1, Number(query.get('cPage') ?? 1) || 1),
        rq: query.get('rq') ?? '',
        rProvider: query.get('rProvider') ?? 'all',
        rModel: query.get('rModel') ?? 'all',
        rUnit: query.get('rUnit') ?? 'all',
        rStatus: rStatus === 'active' || rStatus === 'inactive' ? rStatus : 'all',
        rFrom: query.get('rFrom') ?? '',
        rTo: query.get('rTo') ?? '',
        rSort: query.get('rSort') ?? 'provider',
        rDir: query.get('rDir') === 'desc' ? 'desc' : 'asc',
        rPage: Math.max(1, Number(query.get('rPage') ?? 1) || 1),
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
  protected closeMenu(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element) || target.closest('.icon-action, .action-menu')) return;
    this.actionMenu.set(null);
    this.actionMenuStyle.set(null);
  }

  protected setTab(tab: TabId): void {
    this.actionMenu.set(null);
    this.navigate({ ...this.params(), tab });
  }

  protected setRange(range: RangeId): void {
    this.navigate({ ...this.params(), range, page: 1, cPage: 1 });
  }

  protected updateAnalysis(key: 'from' | 'to' | 'product' | 'provider' | 'model' | 'status', value: string): void {
    const next = { ...this.params(), [key]: value, page: 1, cPage: 1 };
    if (key === 'provider' && value !== 'all' && !this.productsStore.models().some((model) => model.id === next.model && model.providerId === value)) {
      next.model = 'all';
    }
    this.navigate(next);
  }

  protected updateRateFilter(key: 'rq' | 'rProvider' | 'rModel' | 'rUnit' | 'rStatus' | 'rFrom' | 'rTo', value: string): void {
    const next = { ...this.params(), [key]: value, rPage: 1 };
    if (key === 'rProvider' && value !== 'all' && !this.productsStore.models().some((model) => model.id === next.rModel && model.providerId === value)) {
      next.rModel = 'all';
    }
    this.navigate(next);
  }

  protected clearAnalysis(): void {
    this.navigate({ ...this.params(), range: '30', from: '', to: '', product: 'all', provider: 'all', model: 'all', status: 'all', page: 1, cPage: 1 });
  }

  protected clearRates(): void {
    this.navigate({ ...this.params(), rq: '', rProvider: 'all', rModel: 'all', rUnit: 'all', rStatus: 'all', rFrom: '', rTo: '', rPage: 1 });
  }

  protected sortRequests(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, sort, direction: current.sort === sort && current.direction === 'desc' ? 'asc' : 'desc', page: 1 });
  }

  protected sortBreakdown(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, cSort: sort, cDir: current.cSort === sort && current.cDir === 'desc' ? 'asc' : 'desc', cPage: 1 });
  }

  protected sortRates(sort: string): void {
    const current = this.params();
    this.navigate({ ...current, rSort: sort, rDir: current.rSort === sort && current.rDir === 'asc' ? 'desc' : 'asc', rPage: 1 });
  }

  protected changeRequestPage(page: number): void {
    this.navigate({ ...this.params(), page });
  }

  protected changeRequestSize(value: string): void {
    const size: PageSize = value === '10' || value === '50' ? Number(value) as PageSize : 20;
    this.navigate({ ...this.params(), size, page: 1 });
  }

  protected changeBreakdownPage(page: number): void {
    this.navigate({ ...this.params(), cPage: page });
  }

  protected changeRatePage(page: number): void {
    this.navigate({ ...this.params(), rPage: page });
  }

  protected pages(total: number): number[] {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  protected openRequest(record: ApiUsageRecord): void {
    this.editingId.set(record.id);
    this.dialog.set('request');
  }

  protected openRequestFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    const record = this.usage.records().find((item) => item.id === id);
    if (record) this.openRequest(record);
  }

  protected async copyRequestId(id: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(id);
      this.showToast('Request ID를 복사했습니다.');
    } catch {
      this.showToast('Request ID를 복사하지 못했습니다.');
    }
  }

  protected openRate(card?: RateCard): void {
    this.actionMenu.set(null);
    const unit = card?.billingUnit ?? '1m-tokens';
    this.rateForm.reset({
      providerId: card?.providerId ?? '',
      modelId: card?.modelId ?? '',
      billingUnit: unit,
      inputPrice: this.priceText(card?.inputPrice),
      outputPrice: this.priceText(card?.outputPrice),
      unitPrice: this.priceText(card?.unitPrice),
      effectiveDate: card?.effectiveDate ?? USAGE_CLOCK,
      status: card?.status ?? 'active',
    });
    if (card) {
      this.rateForm.controls.providerId.disable();
      this.rateForm.controls.modelId.disable();
      this.rateForm.controls.status.disable();
    } else {
      this.rateForm.controls.providerId.enable();
      this.rateForm.controls.modelId.enable();
      this.rateForm.controls.status.enable();
    }
    this.selectedProviderId.set(card?.providerId ?? '');
    this.selectedUnit.set(unit);
    this.editingId.set(card?.id ?? null);
    this.formError.set('');
    this.dialog.set('rate');
  }

  protected changeRateProvider(event: Event): void {
    const providerId = event.target instanceof HTMLSelectElement ? event.target.value : '';
    this.selectedProviderId.set(providerId);
    this.rateForm.controls.providerId.setValue(providerId);
    this.rateForm.controls.modelId.setValue('');
  }

  protected changeRateUnit(event: Event): void {
    const unit = event.target instanceof HTMLSelectElement ? event.target.value as BillingUnit : '1m-tokens';
    this.selectedUnit.set(unit);
    this.rateForm.controls.billingUnit.setValue(unit);
  }

  protected saveRate(): void {
    this.rateForm.markAllAsTouched();
    if (this.rateForm.invalid) {
      this.formError.set('Provider, Model, Billing Unit, Effective Date를 확인해 주세요.');
      return;
    }
    const value = this.rateForm.getRawValue();
    const input = {
      providerId: value.providerId,
      modelId: value.modelId,
      billingUnit: value.billingUnit,
      inputPrice: this.parsePrice(value.inputPrice),
      outputPrice: this.parsePrice(value.outputPrice),
      unitPrice: this.parsePrice(value.unitPrice),
      effectiveDate: value.effectiveDate,
      status: value.status,
    };
    try {
      if (this.editingId()) this.usage.updateRateCard(this.editingId()!, input);
      else this.usage.createRateCard(input);
      this.closeDialog();
      this.showToast('Rate Card를 저장했습니다.');
    } catch (error) {
      this.formError.set(error instanceof Error ? error.message : 'Rate Card를 저장하지 못했습니다.');
    }
  }

  protected openRateFromRow(id: string, event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && target.closest('a, button')) return;
    this.openRateView(id);
  }

  protected openRateView(id: string): void {
    this.actionMenu.set(null);
    this.editingId.set(id);
    this.dialog.set('view-rate');
  }

  protected requestRateStatus(id: string, active: boolean): void {
    this.actionMenu.set(null);
    if (active) {
      this.usage.setRateCardStatus(id, 'active');
      this.showToast('활성화했습니다.');
      return;
    }
    this.editingId.set(id);
    this.dialog.set('confirm');
  }

  protected confirmRateStatus(): void {
    const id = this.editingId();
    if (!id) return;
    this.usage.setRateCardStatus(id, 'inactive');
    this.closeDialog();
    this.showToast('비활성화했습니다.');
  }

  protected closeDialog(): void {
    this.dialog.set(null);
    this.formError.set('');
  }

  protected editMenuRate(): void {
    const id = this.actionMenu();
    if (!id) return;
    this.openRate(this.usage.rateCards().find((card) => card.id === id));
  }

  protected toggleMenuRate(): void {
    const id = this.actionMenu();
    if (!id) return;
    const active = this.usage.rateCards().find((card) => card.id === id)?.status === 'active';
    this.requestRateStatus(id, !active);
  }

  protected menuRateActive(): boolean {
    const id = this.actionMenu();
    return !!id && this.usage.rateCards().find((card) => card.id === id)?.status === 'active';
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

  protected unitLabel(unit: BillingUnit): string {
    return this.billingUnits.find((item) => item.id === unit)?.label ?? unit;
  }

  protected priceText(value: number | null | undefined): string {
    return value === null || value === undefined ? '' : String(value);
  }

  protected formatPrice(value: number | null): string {
    return value === null ? '—' : this.formatUsd(value);
  }

  protected formatCount(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  protected formatTokens(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return this.formatCount(value);
  }

  protected formatTokenCell(value: number | null): string {
    return value === null ? '—' : this.formatCount(value);
  }

  protected formatUsd(value: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(value);
  }

  protected formatPercent(value: number | null): string {
    return value === null ? '—' : `${value.toFixed(1)}%`;
  }

  protected formatLatency(value: number | null): string {
    if (value === null) return '—';
    return value >= 1000 ? `${(value / 1000).toFixed(2)}s` : `${Math.round(value)}ms`;
  }

  protected formatStamp(value: string): string {
    return formatKst(value);
  }

  protected statusLabel(status: string): string {
    if (status === 'success' || status === 'active') return status === 'success' ? '성공' : '활성';
    if (status === 'error') return '오류';
    return '비활성';
  }

  protected analysisFiltered(): boolean {
    const params = this.params();
    return params.range !== '30' || Boolean(params.from || params.to) || params.product !== 'all' || params.provider !== 'all' || params.model !== 'all' || params.status !== 'all';
  }

  protected ratesFiltered(): boolean {
    const params = this.params();
    return Boolean(params.rq || params.rFrom || params.rTo) || params.rProvider !== 'all' || params.rModel !== 'all' || params.rUnit !== 'all' || params.rStatus !== 'all';
  }

  private filterRecords(params: ListParams, includeStatus: boolean): ApiUsageRecord[] {
    const bounds = this.resolveWindow(params);
    return this.usage.records().filter((record) => {
      const day = kstDay(record.timestamp);
      const matchesDate = bounds.start && bounds.end ? day >= bounds.start && day <= bounds.end : false;
      const matchesStatus = !includeStatus || params.status === 'all' || record.status === params.status;
      return matchesDate && matchesStatus && this.matchesDimensions(record, params);
    });
  }

  private matchesDimensions(record: ApiUsageRecord, params: ListParams): boolean {
    return (params.product === 'all' || record.productId === params.product)
      && (params.provider === 'all' || record.providerId === params.provider)
      && (params.model === 'all' || record.modelId === params.model);
  }

  private summarize(records: readonly ApiUsageRecord[]) {
    const total = records.length;
    const success = records.filter((record) => record.status === 'success').length;
    const errors = records.filter((record) => record.status === 'error').length;
    const latency = records.reduce((sum, record) => sum + record.latencyMs, 0);
    return {
      total,
      successRate: total ? (success / total) * 100 : null,
      errorRate: total ? (errors / total) * 100 : null,
      input: records.reduce((sum, record) => sum + (record.inputTokens ?? 0), 0),
      output: records.reduce((sum, record) => sum + (record.outputTokens ?? 0), 0),
      latency: total ? latency / total : null,
    };
  }

  private topName(records: readonly ApiUsageRecord[], idOf: (record: ApiUsageRecord) => string, nameOf: (id: string) => string): string {
    const totals = new Map<string, number>();
    records.forEach((record) => totals.set(idOf(record), (totals.get(idOf(record)) ?? 0) + record.costUsd));
    const top = [...totals.entries()].sort((left, right) => right[1] - left[1] || nameOf(left[0]).localeCompare(nameOf(right[0])))[0];
    return top && top[1] > 0 ? nameOf(top[0]) : '—';
  }

  private buildBuckets(records: readonly ApiUsageRecord[], bounds: { start: string; end: string }, range: RangeId): { labels: string[]; rows: Bucket[] } {
    const mode = this.granularity(bounds, range);
    const keys: string[] = [];
    if (!bounds.start || !bounds.end || bounds.start > bounds.end) return { labels: [], rows: [] };
    if (mode === 'hour') {
      let date = bounds.start;
      while (date <= bounds.end && keys.length < 72) {
        for (let hour = 0; hour < 24; hour += 1) keys.push(`${date} ${String(hour).padStart(2, '0')}`);
        date = shiftDate(date, 1);
      }
    } else if (mode === 'week') {
      let date = weekStart(bounds.start);
      const last = weekStart(bounds.end);
      while (date <= last) {
        keys.push(date);
        date = shiftDate(date, 7);
      }
    } else {
      let date = bounds.start;
      while (date <= bounds.end) {
        keys.push(date);
        date = shiftDate(date, 1);
      }
    }
    const rows = new Map<string, Bucket>(keys.map((key) => [key, { success: 0, error: 0, input: 0, output: 0, cost: 0 }]));
    records.forEach((record) => {
      const day = kstDay(record.timestamp);
      const key = mode === 'hour' ? `${day} ${String(kstHour(record.timestamp)).padStart(2, '0')}` : mode === 'week' ? weekStart(day) : day;
      const bucket = rows.get(key);
      if (!bucket) return;
      if (record.status === 'success') bucket.success += 1;
      else bucket.error += 1;
      bucket.input += record.inputTokens ?? 0;
      bucket.output += record.outputTokens ?? 0;
      bucket.cost += record.costUsd;
    });
    return {
      labels: keys.map((key) => (mode === 'hour' ? `${key.slice(5, 10)} ${key.slice(11)}시` : key.slice(5))),
      rows: keys.map((key) => rows.get(key) ?? { success: 0, error: 0, input: 0, output: 0, cost: 0 }),
    };
  }

  private granularity(bounds: { start: string; end: string }, range: RangeId): 'hour' | 'day' | 'week' {
    const days = bounds.start && bounds.end ? inclusiveDays(bounds.start, bounds.end) : 0;
    if (range === '1' || days <= 2) return 'hour';
    if (days > 62) return 'week';
    return 'day';
  }

  private lineChart(source: { labels: string[]; rows: Bucket[] }, series: { key: keyof Bucket; label: string; color: string }[]): ChartData<'line'> {
    return {
      labels: source.labels,
      datasets: series.map((item) => ({
        label: item.label,
        data: source.rows.map((row) => Number(row[item.key].toFixed(6))),
        borderColor: `var(${item.color})`,
        backgroundColor: areaFade(item.color, '#2f9aff'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: 'var(--color-surface)',
        fill: true,
        tension: 0.35,
      })),
    };
  }

  private barChart(groups: { label: string; value: number }[], token = '--chart-series-primary') {
    return {
      labels: groups.map((item) => item.label),
      datasets: [{
        label: 'Provider Cost',
        data: groups.map((item) => Number(item.value.toFixed(6))),
        backgroundColor: '#2f9aff',
        gradientTokens: [token],
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 72,
      }],
    } as unknown as ChartData<'bar'>;
  }

  private groupCost(records: readonly ApiUsageRecord[], labelOf: (record: ApiUsageRecord) => string): { label: string; value: number }[] {
    const totals = new Map<string, number>();
    records.forEach((record) => {
      const label = labelOf(record);
      totals.set(label, (totals.get(label) ?? 0) + record.costUsd);
    });
    return [...totals.entries()].map(([label, value]) => ({ label, value })).sort((left, right) => right.value - left.value);
  }

  private sortRecords(records: readonly ApiUsageRecord[]): ApiUsageRecord[] {
    const params = this.params();
    const direction = params.direction === 'asc' ? 1 : -1;
    return [...records].sort((left, right) => this.compare(this.recordValue(left, params.sort), this.recordValue(right, params.sort)) * direction);
  }

  private recordValue(record: ApiUsageRecord, sort: string): string | number {
    if (sort === 'id') return record.id;
    if (sort === 'product') return this.productsStore.getById(record.productId)?.name ?? record.productId;
    if (sort === 'provider') return this.productsStore.providerName(record.providerId);
    if (sort === 'model') return this.productsStore.modelName(record.modelId);
    if (sort === 'input') return record.inputTokens ?? -1;
    if (sort === 'output') return record.outputTokens ?? -1;
    if (sort === 'latency') return record.latencyMs;
    if (sort === 'status') return record.status;
    return record.timestamp;
  }

  private breakdown(records: readonly ApiUsageRecord[]) {
    const total = records.reduce((sum, record) => sum + record.costUsd, 0);
    const groups = new Map<string, { productId: string; providerId: string; modelId: string; requests: number; input: number; output: number; cost: number }>();
    records.forEach((record) => {
      const key = `${record.productId}|${record.providerId}|${record.modelId}`;
      const current = groups.get(key) ?? { productId: record.productId, providerId: record.providerId, modelId: record.modelId, requests: 0, input: 0, output: 0, cost: 0 };
      current.requests += 1;
      current.input += record.inputTokens ?? 0;
      current.output += record.outputTokens ?? 0;
      current.cost += record.costUsd;
      groups.set(key, current);
    });
    const params = this.params();
    const direction = params.cDir === 'asc' ? 1 : -1;
    return [...groups.values()]
      .map((row) => ({ ...row, share: total ? (row.cost / total) * 100 : 0 }))
      .sort((left, right) => this.compare(this.breakdownValue(left, params.cSort), this.breakdownValue(right, params.cSort)) * direction);
  }

  private breakdownValue(row: { productId: string; providerId: string; modelId: string; requests: number; input: number; output: number; cost: number; share: number }, sort: string): string | number {
    if (sort === 'product') return this.productsStore.getById(row.productId)?.name ?? row.productId;
    if (sort === 'provider') return this.productsStore.providerName(row.providerId);
    if (sort === 'model') return this.productsStore.modelName(row.modelId);
    if (sort === 'requests') return row.requests;
    if (sort === 'input') return row.input;
    if (sort === 'output') return row.output;
    if (sort === 'share') return row.share;
    return row.cost;
  }

  private filteredRates(): RateCard[] {
    const params = this.params();
    const query = params.rq.trim().toLowerCase();
    const rows = this.usage.rateCards().filter((card) => {
      const provider = this.productsStore.providerName(card.providerId).toLowerCase();
      const model = this.productsStore.modelName(card.modelId).toLowerCase();
      const matchesQuery = !query || provider.includes(query) || model.includes(query);
      const matchesProvider = params.rProvider === 'all' || card.providerId === params.rProvider;
      const matchesModel = params.rModel === 'all' || card.modelId === params.rModel;
      const matchesUnit = params.rUnit === 'all' || card.billingUnit === params.rUnit;
      const matchesStatus = params.rStatus === 'all' || card.status === params.rStatus;
      const matchesFrom = !params.rFrom || card.effectiveDate >= params.rFrom;
      const matchesTo = !params.rTo || card.effectiveDate <= params.rTo;
      return matchesQuery && matchesProvider && matchesModel && matchesUnit && matchesStatus && matchesFrom && matchesTo;
    });
    const direction = params.rDir === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => this.compare(this.rateValue(left, params.rSort), this.rateValue(right, params.rSort)) * direction);
  }

  private rateValue(card: RateCard, sort: string): string | number {
    if (sort === 'model') return this.productsStore.modelName(card.modelId);
    if (sort === 'unit') return card.billingUnit;
    if (sort === 'input') return card.inputPrice ?? card.unitPrice ?? -1;
    if (sort === 'output') return card.outputPrice ?? -1;
    if (sort === 'date') return card.effectiveDate;
    if (sort === 'status') return card.status;
    return this.productsStore.providerName(card.providerId);
  }

  private compare(left: string | number, right: string | number): number {
    return typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right), 'ko');
  }

  private resolveWindow(params: ListParams): { start: string; end: string } {
    if (params.range === 'custom') return { start: params.from, end: params.to };
    const length = params.range === '1' ? 0 : params.range === '7' ? 6 : 29;
    return { start: shiftDate(USAGE_CLOCK, -length), end: USAGE_CLOCK };
  }

  private slice<T>(rows: readonly T[], page: number, size: number): T[] {
    return rows.slice((page - 1) * size, page * size);
  }

  private parsePrice(value: string | number | null): number | null {
    if (value === null || value === '') return null;
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  private axisOptions(suffix = ''): ChartOptions<'line'> {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: true, position: 'bottom', labels: { boxWidth: 10, color: 'var(--color-text-secondary)' } },
        tooltip: {
          callbacks: {
            label: (context) => ` ${context.dataset.label}: ${suffix === '$' ? this.formatUsd(context.parsed.y ?? 0) : suffix === '%' ? `${(context.parsed.y ?? 0).toFixed(1)}%` : this.formatCount(context.parsed.y ?? 0)}`,
          },
        },
      },
      scales: {
        x: { border: { display: false }, grid: { display: false }, ticks: { color: 'var(--color-text-muted)', maxRotation: 0, autoSkipPadding: 16 } },
        y: { border: { display: false }, beginAtZero: true, ticks: { color: 'var(--color-text-muted)', maxTicksLimit: 4 } },
      },
    };
  }

  private emptyParams(): ListParams {
    return {
      tab: 'api-usage', range: '30', from: '', to: '', product: 'all', provider: 'all', model: 'all', status: 'all',
      sort: 'timestamp', direction: 'desc', page: 1, size: 20, cSort: 'cost', cDir: 'desc', cPage: 1,
      rq: '', rProvider: 'all', rModel: 'all', rUnit: 'all', rStatus: 'all', rFrom: '', rTo: '', rSort: 'provider', rDir: 'asc', rPage: 1,
    };
  }

  private navigate(params: ListParams): void {
    const query: Params = {};
    if (params.tab !== 'api-usage') query['tab'] = params.tab;
    if (params.range !== '30') query['range'] = params.range;
    if (params.from) query['from'] = params.from;
    if (params.to) query['to'] = params.to;
    if (params.product !== 'all') query['product'] = params.product;
    if (params.provider !== 'all') query['provider'] = params.provider;
    if (params.model !== 'all') query['model'] = params.model;
    if (params.status !== 'all') query['status'] = params.status;
    if (params.sort !== 'timestamp') query['sort'] = params.sort;
    if (params.direction !== 'desc') query['direction'] = params.direction;
    if (params.page > 1) query['page'] = String(params.page);
    if (params.size !== 20) query['size'] = String(params.size);
    if (params.cSort !== 'cost') query['cSort'] = params.cSort;
    if (params.cDir !== 'desc') query['cDir'] = params.cDir;
    if (params.cPage > 1) query['cPage'] = String(params.cPage);
    if (params.rq) query['rq'] = params.rq;
    if (params.rProvider !== 'all') query['rProvider'] = params.rProvider;
    if (params.rModel !== 'all') query['rModel'] = params.rModel;
    if (params.rUnit !== 'all') query['rUnit'] = params.rUnit;
    if (params.rStatus !== 'all') query['rStatus'] = params.rStatus;
    if (params.rFrom) query['rFrom'] = params.rFrom;
    if (params.rTo) query['rTo'] = params.rTo;
    if (params.rSort !== 'provider') query['rSort'] = params.rSort;
    if (params.rDir !== 'asc') query['rDir'] = params.rDir;
    if (params.rPage > 1) query['rPage'] = String(params.rPage);
    void this.router.navigate([], { relativeTo: this.route, queryParams: query });
  }

  private placeActionMenu(button: HTMLElement): void {
    const rect = button.getBoundingClientRect();
    const menuWidth = 148;
    const menuHeight = 110;
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
