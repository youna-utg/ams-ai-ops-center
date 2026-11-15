import { Component, computed, signal } from '@angular/core';
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
  protected readonly productSortOpen = signal(false);
  protected readonly productSort = signal<ProductSortKey>('name');
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

  protected readonly products = PRODUCTS;
  protected readonly providers = PROVIDER_USAGE;
  protected readonly activities = RECENT_ACTIVITIES;
  protected readonly systemHealth = SYSTEM_HEALTH;

  protected readonly totalActiveUsers = PRODUCTS.reduce(
    (sum, product) => sum + product.activeUsers,
    0,
  );
  protected readonly totalRequests = PRODUCTS.reduce(
    (sum, product) => sum + product.apiRequests,
    0,
  );
  protected readonly totalTokens = PRODUCTS.reduce(
    (sum, product) => sum + product.tokenUsage,
    0,
  );
  protected readonly totalProviderCost = PRODUCTS.reduce(
    (sum, product) => sum + product.providerCost,
    0,
  );

  protected readonly activeFilterCount = computed(
    () =>
      Number(this.appliedStatus() !== 'all') +
      Number(this.appliedProvider() !== 'all'),
  );

  protected readonly filteredProducts = computed(() => {
    const status = this.appliedStatus();
    const query = this.productSearch().trim().toLowerCase();

    return this.products
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
        maxBarThickness: 42,
        categoryPercentage: 0.86,
        barPercentage: 0.92,
      },
    ],
  } as unknown as ChartData<'bar'>;

  protected readonly providerCostData: ChartData<'doughnut'> = {
    labels: COST_BY_PROVIDER.labels,
    datasets: [
      {
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
        maxBarThickness: 28,
        categoryPercentage: 0.82,
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
        ctx.font = `500 10px ${font}`;
        ctx.fillText('Total Cost', x, y - 10);
        ctx.fillStyle = ink;
        ctx.font = `700 16px ${font}`;
        ctx.fillText(this.formatCurrency(this.totalProviderCost), x, y + 9);
        ctx.restore();
      },
    },
  ];

  protected readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 7,
          boxHeight: 7,
          padding: 14,
          color: 'var(--color-text-secondary)',
          font: {
            family: 'var(--font-family-sans)',
            size: 11,
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

  protected setPendingProvider(event: Event): void {
    this.pendingProvider.set((event.target as HTMLSelectElement).value);
  }

  protected updateProductSearch(event: Event): void {
    this.productSearch.set((event.target as HTMLInputElement).value);
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
