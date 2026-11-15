import { Component, computed, signal } from '@angular/core';
import { ChartData, ChartOptions, TooltipItem } from 'chart.js';
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
import { IconComponent } from '../../shared/components/icon/icon.component';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../shared/components/status-badge/status-badge.component';
import { ComponentShowcaseComponent } from './components/component-showcase/component-showcase.component';

type DashboardPopover = 'filter' | 'customize' | null;
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
      },
      ticks: {
        color: 'var(--color-text-muted)',
        font: {
          family: 'var(--font-family-data)',
          size: 11,
        },
        padding: 8,
      },
    },
  },
};

@Component({
  selector: 'app-overview-page',
  standalone: true,
  imports: [
    ChartComponent,
    ComponentShowcaseComponent,
    IconComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './overview.page.html',
  styleUrl: './overview.page.scss',
})
export class OverviewPage {
  protected readonly selectedRange = signal<DateRangeKey>('30d');
  protected readonly activePopover = signal<DashboardPopover>(null);
  protected readonly pendingStatus = signal('all');
  protected readonly pendingProvider = signal('all');
  protected readonly appliedStatus = signal('all');
  protected readonly appliedProvider = signal('all');
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
    return status === 'all'
      ? this.products
      : this.products.filter((product) => product.status === status);
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
        backgroundColor: 'var(--chart-fill-primary)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBorderWidth: 2,
        pointHoverBackgroundColor: 'var(--color-surface)',
        fill: true,
        tension: 0.34,
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
        backgroundColor: 'var(--chart-fill-primary)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.34,
      },
      {
        label: 'Output Tokens',
        data: this.trend().outputTokens,
        borderColor: 'var(--chart-series-secondary)',
        backgroundColor: 'var(--chart-fill-secondary)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 3,
        fill: true,
        tension: 0.34,
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
          backgroundColor: 'var(--chart-fill-success)',
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 3,
          fill: true,
          tension: 0.34,
        },
      ],
    }),
  );

  protected readonly productCostData: ChartData<'bar'> = {
    labels: PRODUCTS.map((product) => product.product),
    datasets: [
      {
        label: 'Provider Cost',
        data: PRODUCTS.map((product) => product.providerCost),
        backgroundColor: [
          'var(--chart-series-primary)',
          'var(--chart-series-secondary)',
          'var(--chart-series-success)',
          'var(--chart-series-warning)',
          'var(--chart-series-muted)',
        ],
        borderRadius: 5,
        borderSkipped: false,
        maxBarThickness: 34,
      },
    ],
  };

  protected readonly providerCostData: ChartData<'doughnut'> = {
    labels: COST_BY_PROVIDER.labels,
    datasets: [
      {
        data: COST_BY_PROVIDER.values,
        backgroundColor: [
          'var(--chart-series-primary)',
          'var(--chart-series-secondary)',
          'var(--chart-series-success)',
          'var(--color-primary-300)',
          'var(--chart-series-warning)',
        ],
        borderColor: 'var(--color-surface)',
        borderWidth: 3,
        hoverOffset: 3,
      },
    ],
  };

  protected readonly modelCostData: ChartData<'bar'> = {
    labels: COST_BY_MODEL.labels,
    datasets: [
      {
        label: 'Provider Cost',
        data: COST_BY_MODEL.values,
        backgroundColor: 'var(--chart-series-primary)',
        borderRadius: 4,
        borderSkipped: false,
        maxBarThickness: 18,
      },
    ],
  };

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
          callback: (value) => {
            const amount = Number(value);
            return amount >= 1000
              ? `${Math.round(amount / 1000)}K`
              : `${amount}`;
          },
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
    },
  };

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

  protected setRange(event: Event): void {
    this.selectedRange.set(
      (event.target as HTMLSelectElement).value as DateRangeKey,
    );
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
    return new Intl.NumberFormat('ko-KR', {
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
