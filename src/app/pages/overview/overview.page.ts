import { Component, HostListener, computed, signal } from '@angular/core';
import { ChartData, ChartOptions, Plugin, TooltipItem } from 'chart.js';
import {
  DateRangeKey,
  HealthStatus,
  ProductStatus,
} from '../../core/models/overview.models';
import {
  COST_BY_MODEL,
  COST_BY_PROVIDER,
  PRODUCTS,
  PROVIDER_USAGE,
  RECENT_ACTIVITIES,
  SYSTEM_HEALTH,
  TREND_DATA,
} from '../../data/mocks/overview.mock';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { GaugeComponent } from '../../shared/components/gauge/gauge.component';
import { areaFade, barGradientPlugin } from '../../shared/charts/chart-fill';
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../shared/components/status-badge/status-badge.component';
import { ComponentShowcaseComponent } from './components/component-showcase/component-showcase.component';

type DashboardPopover = 'filter' | 'customize' | null;
type ProductSortKey = 'name' | 'users' | 'requests' | 'cost';
type DashboardSection =
  | 'usage'
  | 'cost'
  | 'products'
  | 'providers'
  | 'activities'
  | 'health';

const lineBaseOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'var(--chart-tooltip-bg)',
      padding: 12,
      cornerRadius: 6,
      titleFont: {
        family: 'var(--font-family-sans)',
        size: 12,
        weight: 600,
      },
      bodyFont: {
        family: 'var(--font-family-data)',
        size: 12,
      },
    },
  },
  scales: {
    x: {
      border: {
        display: false,
      },
      grid: {
        display: false,
      },
      ticks: {
        color: 'var(--color-text-muted)',
        font: {
          family: 'var(--font-family-sans)',
          size: 11,
        },
        maxRotation: 0,
        autoSkipPadding: 20,
      },
    },
    y: {
      border: {
        display: false,
      },
      grid: {
        color: 'var(--chart-grid)',
        drawTicks: false,
      },
      ticks: {
        color: 'var(--color-text-muted)',
        font: {
          family: 'var(--font-family-data)',
          size: 11,
        },
        maxTicksLimit: 4,
        padding: 10,
      },
      beginAtZero: true,
    },
  },
};

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [
    ChartComponent,
    GaugeComponent,
    ComponentShowcaseComponent,
    IconComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  protected readonly selectedRange = signal<DateRangeKey>('30d');
  protected readonly rangeOpen = signal(false);
  protected readonly rangeOptions: ReadonlyArray<{
    key: DateRangeKey;
    label: string;
  }> = [
    { key: '14d', label: '최근 14일' },
    { key: '30d', label: '최근 30일' },
    { key: '90d', label: '최근 90일' },
  ];
  protected readonly activePopover = signal<DashboardPopover>(null);
  protected readonly pendingStatus = signal('all');
  protected readonly pendingProvider = signal('all');
  protected readonly appliedStatus = signal('all');
  protected readonly appliedProvider = signal('all');
  protected readonly productSearch = signal('');
  protected readonly productStatusOpen = signal(false);
  protected readonly productSortOpen = signal(false);
  protected readonly productSort = signal<ProductSortKey>('name');
  protected readonly productStatusOptions: Array<{
    value: string;
    label: string;
  }> = [
    { value: 'all', label: '전체 상태' },
    { value: 'Operational', label: '정상' },
    { value: 'Attention', label: '확인 필요' },
    { value: 'Maintenance', label: '점검 중' },
  ];
  protected readonly statusFilterLabel = computed(
    () =>
      this.productStatusOptions.find((option) => option.value === this.appliedStatus())
        ?.label ?? '전체 상태',
  );
  protected readonly productSortOptions: Array<{
    key: ProductSortKey;
    label: string;
  }> = [
    { key: 'name', label: 'Product' },
    { key: 'users', label: 'Active Users' },
    { key: 'requests', label: 'API Requests' },
    { key: 'cost', label: 'Provider Cost' },
  ];
  protected readonly sectionVisibility = signal<Record<DashboardSection, boolean>>({
    usage: true,
    cost: true,
    products: true,
    providers: true,
    activities: true,
    health: true,
  });

  protected readonly products = signal([...PRODUCTS]);
  protected readonly productCreateOpen = signal(false);
  protected readonly productCode = signal('');
  protected readonly productName = signal('');
  protected readonly productDescription = signal('');
  protected readonly productRpm = signal(0);
  protected readonly productRph = signal(0);
  protected readonly productStatusDraft = signal<ProductStatus>('Operational');
  protected readonly productPools = signal([{ id: 1, name: 'Credit Pool', amount: 0 }]);
  protected readonly providers = PROVIDER_USAGE;
  protected readonly activities = RECENT_ACTIVITIES;
  protected readonly systemHealth = SYSTEM_HEALTH;

  protected readonly totalActiveUsers = PRODUCTS.reduce(
    (sum, product) => sum + product.activeUsers,
    0,
  );
  protected get totalRequests(): number {
    return this.trend().apiRequests.reduce((sum, value) => sum + value, 0);
  }

  protected get totalTokens(): number {
    return (
      this.trend().inputTokens.reduce((sum, value) => sum + value, 0)
      + this.trend().outputTokens.reduce((sum, value) => sum + value, 0)
    ) * 1_000_000;
  }

  protected get totalProviderCost(): number {
    return this.trend().providerCost.reduce((sum, value) => sum + value, 0);
  }

  protected readonly activeFilterCount = computed(
    () =>
      Number(this.appliedStatus() !== 'all') +
      Number(this.appliedProvider() !== 'all'),
  );

  protected readonly filteredProducts = computed(() => {
    const status = this.appliedStatus();
    const query = this.productSearch().trim().toLowerCase();

    return this.products()
      .filter((product) => {
        const matchesStatus = status === 'all' || product.status === status;
        const matchesQuery =
          !query ||
          `${product.product} ${product.domain}`.toLowerCase().includes(query);
        return matchesStatus && matchesQuery;
      })
      .sort((left, right) => {
        switch (this.productSort()) {
          case 'users':
            return right.activeUsers - left.activeUsers;
          case 'requests':
            return right.apiRequests - left.apiRequests;
          case 'cost':
            return right.providerCost - left.providerCost;
          default:
            return left.product.localeCompare(right.product);
        }
      });
  });

  protected readonly filteredProviders = computed(() => {
    const provider = this.appliedProvider();
    return provider === 'all'
      ? this.providers
      : this.providers.filter((item) => item.provider === provider);
  });

  private readonly trend = computed(() => TREND_DATA[this.selectedRange()]);

  protected readonly apiTrendData = computed<ChartData<'line'>>(() => ({
    labels: this.trend().labels,
    datasets: [
      {
        label: 'API Requests',
        data: this.trend().apiRequests,
        borderColor: 'var(--chart-series-primary)',
        backgroundColor: areaFade('--chart-series-primary', '#2f9aff'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: 'var(--color-surface)',
        fill: true,
        tension: 0.42,
      },
    ],
  }));

  protected readonly tokenTrendData = computed<ChartData<'line'>>(() => ({
    labels: this.trend().labels,
    datasets: [
      {
        label: 'Input Tokens',
        data: this.trend().inputTokens,
        borderColor: 'var(--chart-series-primary)',
        backgroundColor: areaFade('--chart-series-primary', '#2f9aff'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.42,
      },
      {
        label: 'Output Tokens',
        data: this.trend().outputTokens,
        borderColor: 'var(--chart-series-secondary)',
        backgroundColor: areaFade('--chart-series-secondary', '#38bdf8'),
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.42,
      },
    ],
  }));

  protected readonly providerCostTrendData = computed<ChartData<'line'>>(
    () => ({
      labels: this.trend().labels,
      datasets: [
        {
          label: 'Provider Cost',
          data: this.trend().providerCost,
          borderColor: 'var(--chart-series-success)',
          backgroundColor: areaFade('--chart-series-success', '#818cf8'),
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          fill: true,
          tension: 0.42,
        },
      ],
    }),
  );

  protected readonly productCostData = {
    labels: PRODUCTS.map((product) => product.product),
    datasets: [
      {
        label: 'Provider Cost',
        data: PRODUCTS.map((product) => product.providerCost),
        backgroundColor: '#2f9aff',
        gradientTokens: [
          '--chart-series-primary',
          '--chart-series-secondary',
          '--chart-series-success',
          '--chart-series-warning',
          '--chart-series-muted',
        ],
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 84,
        categoryPercentage: 0.96,
        barPercentage: 0.92,
      },
    ],
  } as unknown as ChartData<'bar'>;

  protected readonly providerCostData: ChartData<'doughnut'> = {
    labels: COST_BY_PROVIDER.labels,
    datasets: [
      {
        label: 'Provider Cost',
        data: COST_BY_PROVIDER.values,
        backgroundColor: [
          'var(--chart-series-primary)',
          'var(--chart-series-secondary)',
          'var(--chart-series-success)',
          'var(--chart-series-warning)',
          'var(--chart-series-muted)',
        ],
        borderColor: 'var(--color-surface)',
        borderWidth: 3,
        hoverOffset: 3,
      },
    ],
  };

  protected readonly modelCostData = {
    labels: COST_BY_MODEL.labels,
    datasets: [
      {
        label: 'Provider Cost',
        data: COST_BY_MODEL.values,
        backgroundColor: '#2f9aff',
        gradientTokens: ['--chart-series-primary'],
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 46,
        categoryPercentage: 0.96,
        barPercentage: 0.92,
      },
    ],
  } as unknown as ChartData<'bar'>;

  protected readonly apiTrendOptions: ChartOptions<'line'> = {
    ...lineBaseOptions,
    plugins: {
      ...lineBaseOptions.plugins,
      tooltip: {
        ...lineBaseOptions.plugins?.tooltip,
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            ` ${context.dataset.label}: ${this.formatNumber(context.parsed.y ?? 0)}건`,
        },
      },
    },
    scales: {
      ...lineBaseOptions.scales,
      y: {
        ...lineBaseOptions.scales?.['y'],
        ticks: {
          color: 'var(--color-text-muted)',
          font: {
            family: 'var(--font-family-data)',
            size: 11,
          },
          maxTicksLimit: 4,
          padding: 10,
          callback: (value) => this.formatCompact(Number(value)),
        },
      },
    },
  };

  protected readonly tokenTrendOptions: ChartOptions<'line'> = {
    ...lineBaseOptions,
    plugins: {
      ...lineBaseOptions.plugins,
      legend: {
        display: true,
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
          color: 'var(--color-text-secondary)',
          font: {
            family: 'var(--font-family-sans)',
            size: 11,
          },
        },
      },
      tooltip: {
        ...lineBaseOptions.plugins?.tooltip,
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            ` ${context.dataset.label}: ${(context.parsed.y ?? 0).toFixed(1)}M`,
        },
      },
    },
    scales: {
      ...lineBaseOptions.scales,
      y: {
        ...lineBaseOptions.scales?.['y'],
        ticks: {
          color: 'var(--color-text-muted)',
          callback: (value) => `${value}M`,
        },
      },
    },
  };

  protected readonly providerCostTrendOptions: ChartOptions<'line'> = {
    ...lineBaseOptions,
    plugins: {
      ...lineBaseOptions.plugins,
      tooltip: {
        ...lineBaseOptions.plugins?.tooltip,
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            ` Provider Cost: $${this.formatNumber(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      ...lineBaseOptions.scales,
      y: {
        ...lineBaseOptions.scales?.['y'],
        ticks: {
          color: 'var(--color-text-muted)',
          callback: (value) =>
            `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`,
        },
      },
    },
  };

  protected readonly barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 12,
        callbacks: {
          label: (context) =>
            ` Provider Cost: $${this.formatNumber(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--color-text-muted)',
          font: {
            family: 'var(--font-family-sans)',
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: 'var(--chart-grid)',
          drawTicks: false,
        },
        ticks: {
          color: 'var(--color-text-muted)',
          maxTicksLimit: 4,
          padding: 10,
          callback: (value) =>
            `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`,
        },
      },
    },
  };

  protected readonly barPlugins = [barGradientPlugin];

  protected readonly doughnutPlugins: Plugin<'doughnut'>[] = [
    {
      id: 'donutCenterText',
      afterDraw: (chart) => {
        const { chartArea, ctx } = chart;
        const x = (chartArea.left + chartArea.right) / 2;
        const y = (chartArea.top + chartArea.bottom) / 2;
        const style = getComputedStyle(chart.canvas);
        const font =
          style.getPropertyValue('--font-family-data').trim() ||
          'Figtree, sans-serif';
        const muted =
          style.getPropertyValue('--color-text-muted').trim() || '#6b7280';
        const ink =
          style.getPropertyValue('--color-text-primary').trim() || '#15181e';

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = muted;
        ctx.font = `500 13px ${font}`;
        ctx.fillText('Total Cost', x, y - 14);
        ctx.fillStyle = ink;
        ctx.font = `700 22px ${font}`;
        ctx.fillText(this.formatCurrency(this.totalProviderCost), x, y + 12);
        ctx.restore();
      },
    },
  ];

  protected readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '58%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 16,
          color: 'var(--color-text-secondary)',
          font: {
            family: 'var(--font-family-sans)',
            size: 13,
          },
        },
      },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 12,
        callbacks: {
          label: (context) =>
            ` ${context.label}: $${this.formatNumber(context.parsed)}`,
        },
      },
    },
  };

  protected readonly horizontalBarOptions: ChartOptions<'bar'> = {
    ...this.barChartOptions,
    indexAxis: 'y',
    plugins: {
      ...this.barChartOptions.plugins,
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 12,
        callbacks: {
          label: (context) =>
            ` Provider Cost: $${this.formatNumber(context.parsed.x ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          color: 'var(--chart-grid)',
        },
        ticks: {
          color: 'var(--color-text-muted)',
          callback: (value) =>
            `$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(value))}`,
        },
      },
      y: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: 'var(--color-text-secondary)',
          font: {
            family: 'var(--font-family-sans)',
            size: 11,
          },
        },
      },
    },
  };

  protected rangeLabel(): string {
    return (
      this.rangeOptions.find((option) => option.key === this.selectedRange())
        ?.label ?? '최근 30일'
    );
  }

  protected selectRange(range: DateRangeKey): void {
    this.selectedRange.set(range);
    this.rangeOpen.set(false);
  }

  protected togglePopover(popover: Exclude<DashboardPopover, null>): void {
    this.activePopover.update((active) =>
      active === popover ? null : popover,
    );
  }

  protected setPendingStatus(event: Event): void {
    this.pendingStatus.set((event.target as HTMLSelectElement).value);
  }

  protected setAppliedStatus(value: string): void {
    this.pendingStatus.set(value);
    this.appliedStatus.set(value);
    this.productStatusOpen.set(false);
  }

  protected toggleProductStatus(): void {
    this.productSortOpen.set(false);
    this.productStatusOpen.update((open) => !open);
  }

  protected toggleProductSort(): void {
    this.productStatusOpen.set(false);
    this.productSortOpen.update((open) => !open);
  }

  protected setPendingProvider(event: Event): void {
    this.pendingProvider.set((event.target as HTMLSelectElement).value);
  }

  protected updateProductSearch(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.productSearch.set(target.value);
  }

  protected openProductCreate(): void {
    this.productCode.set('');
    this.productName.set('');
    this.productDescription.set('');
    this.productRpm.set(0);
    this.productRph.set(0);
    this.productStatusDraft.set('Operational');
    this.productPools.set([{ id: 1, name: 'Credit Pool', amount: 0 }]);
    this.productCreateOpen.set(true);
  }

  protected addProductPool(): void {
    this.productPools.update((pools) => [
      ...pools,
      { id: Math.max(...pools.map((pool) => pool.id)) + 1, name: 'Credit Pool', amount: 0 },
    ]);
  }

  protected updateProductPool(id: number, key: 'name' | 'amount', value: string): void {
    this.productPools.update((pools) =>
      pools.map((pool) =>
        pool.id === id
          ? { ...pool, [key]: key === 'amount' ? Number(value) || 0 : value }
          : pool,
      ),
    );
  }

  protected fieldValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  protected fieldNumber(event: Event): number {
    return Number(this.fieldValue(event)) || 0;
  }

  protected setProductStatusDraft(event: Event): void {
    const value = this.fieldValue(event);
    this.productStatusDraft.set(
      value === 'Attention' || value === 'Maintenance' ? value : 'Operational',
    );
  }

  protected saveProductCreate(): void {
    const next = this.products().length + 1;
    const name = this.productName().trim();
    const code = this.productCode().trim();
    const label = name || code || `New Product ${next}`;
    const mark = label.replace(/[^A-Za-z0-9가-힣]/g, '').slice(0, 2).toUpperCase() || 'NP';
    const domain = code
      ? `${code.toLowerCase().replace(/\s+/g, '-')}.ops.center`
      : 'new.ops.center';
    this.products.update((items) => [
      {
        product: label,
        domain,
        mark,
        status: this.productStatusDraft(),
        activeUsers: 0,
        apiRequests: this.productRpm(),
        tokenUsage: this.productRph(),
        providerCost: 0,
      },
      ...items,
    ]);
    this.productCreateOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeProductCreate(): void {
    this.productCreateOpen.set(false);
    this.productStatusOpen.set(false);
    this.productSortOpen.set(false);
  }

  protected setProductSort(key: ProductSortKey): void {
    this.productSort.set(key);
    this.productSortOpen.set(false);
  }

  protected applyFilters(): void {
    this.appliedStatus.set(this.pendingStatus());
    this.appliedProvider.set(this.pendingProvider());
    this.activePopover.set(null);
  }

  protected resetFilters(): void {
    this.pendingStatus.set('all');
    this.pendingProvider.set('all');
    this.appliedStatus.set('all');
    this.appliedProvider.set('all');
  }

  protected toggleSection(section: DashboardSection): void {
    this.sectionVisibility.update((visibility) => ({
      ...visibility,
      [section]: !visibility[section],
    }));
  }

  protected isSectionVisible(section: DashboardSection): boolean {
    return this.sectionVisibility()[section];
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  protected formatCompact(value: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }

  protected productStatusLabel(status: ProductStatus): string {
    return {
      Operational: '정상',
      Attention: '확인 필요',
      Maintenance: '점검 중',
    }[status];
  }

  protected productStatusTone(status: ProductStatus): StatusTone {
    return {
      Operational: 'success',
      Attention: 'warning',
      Maintenance: 'info',
    }[status] as StatusTone;
  }

  protected activityStatusLabel(status: string): string {
    return {
      Success: '완료',
      Processing: '처리 중',
      Failed: '실패',
    }[status] ?? status;
  }

  protected activityStatusTone(status: string): StatusTone {
    return {
      Success: 'success',
      Processing: 'info',
      Failed: 'danger',
    }[status] as StatusTone;
  }

  protected healthStatusLabel(status: HealthStatus): string {
    return {
      Operational: '정상',
      Degraded: '성능 저하',
      Maintenance: '점검 중',
    }[status];
  }

  protected healthStatusTone(status: HealthStatus): StatusTone {
    return {
      Operational: 'success',
      Degraded: 'warning',
      Maintenance: 'info',
    }[status] as StatusTone;
  }
}
