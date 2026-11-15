import { Component, OnDestroy, computed, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AmsSpecializedShowcaseComponent } from '../ams-specialized-showcase/ams-specialized-showcase.component';

interface ShowcaseTableRow {
  id: number;
  product: string;
  owner: string;
  status: 'Active' | 'Pending' | 'Inactive';
  requests: number;
}

type ShowcaseTab = 'overview' | 'usage' | 'settings';

const TABLE_ROWS: ShowcaseTableRow[] = [
  { id: 1, product: 'ChangeUp', owner: '김서연', status: 'Active', requests: 8440 },
  { id: 2, product: 'TimeUp', owner: '이도윤', status: 'Active', requests: 6700 },
  { id: 3, product: 'DeckUp', owner: '박지민', status: 'Pending', requests: 2520 },
  { id: 4, product: 'DocUp', owner: '최유진', status: 'Active', requests: 5610 },
  { id: 5, product: 'MatchUp', owner: '정하준', status: 'Inactive', requests: 2070 },
];

@Component({
  selector: 'app-component-showcase',
  standalone: true,
  imports: [
    AmsSpecializedShowcaseComponent,
    ChartComponent,
    IconComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './component-showcase.component.html',
  styleUrl: './component-showcase.component.scss',
})
export class ComponentShowcaseComponent implements OnDestroy {
  protected readonly anchors = [
    { id: 'showcase-typography', label: 'Typography' },
    { id: 'showcase-buttons', label: 'Buttons' },
    { id: 'showcase-forms', label: 'Forms' },
    { id: 'showcase-status', label: 'Status' },
    { id: 'showcase-cards', label: 'Cards' },
    { id: 'showcase-tables', label: 'Tables' },
    { id: 'showcase-charts', label: 'Charts' },
    { id: 'showcase-navigation', label: 'Navigation' },
    { id: 'showcase-feedback', label: 'Feedback' },
    { id: 'showcase-additional', label: 'Additional' },
    { id: 'showcase-token-cost', label: 'Token & Cost' },
    { id: 'showcase-provider-model', label: 'Provider & Model' },
    { id: 'showcase-provider-pricing', label: 'Pricing' },
    { id: 'showcase-permissions', label: 'Permissions' },
    { id: 'showcase-monitoring', label: 'Monitoring' },
    { id: 'showcase-activity-logs', label: 'Activity & Logs' },
  ];

  protected readonly activeTab = signal<ShowcaseTab>('overview');
  protected readonly dropdownOpen = signal(false);
  protected readonly multiSelectOpen = signal(false);
  protected readonly selectedModels = signal(['GPT-4.1', 'Claude 3.7']);
  protected readonly passwordVisible = signal(false);
  protected readonly switchEnabled = signal(true);
  protected readonly accordionOpen = signal<number | null>(0);
  protected readonly currentStep = signal(2);
  protected readonly modalOpen = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly toastVisible = signal(false);
  protected readonly toastMessage = signal('설정이 저장되었습니다.');
  protected readonly alertVisible = signal(true);
  protected readonly tableLoading = signal(false);
  protected readonly tableSearch = signal('');
  protected readonly sortAscending = signal(false);
  protected readonly selectedRows = signal<Set<number>>(new Set([1]));
  protected readonly currentPage = signal(1);
  protected readonly iconLiked = signal(false);

  private toastTimer?: number;
  private loadingTimer?: number;

  protected readonly filteredRows = computed(() => {
    const query = this.tableSearch().trim().toLowerCase();
    const filtered = query
      ? TABLE_ROWS.filter((row) =>
          `${row.product} ${row.owner} ${row.status}`
            .toLowerCase()
            .includes(query),
        )
      : TABLE_ROWS;

    return [...filtered].sort((a, b) =>
      this.sortAscending()
        ? a.requests - b.requests
        : b.requests - a.requests,
    );
  });

  protected readonly pagedRows = computed(() => {
    const pageSize = 3;
    const start = (this.currentPage() - 1) * pageSize;
    return this.filteredRows().slice(start, start + pageSize);
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / 3)),
  );

  protected readonly lineData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Requests',
        data: [38, 44, 41, 56, 52, 68, 74],
        borderColor: 'var(--chart-series-primary)',
        backgroundColor: 'var(--chart-fill-primary)',
        borderWidth: 2,
        pointRadius: 2,
        tension: 0.35,
      },
    ],
  };

  protected readonly areaData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tokens',
        data: [22, 28, 25, 39, 35, 46, 52],
        borderColor: 'var(--chart-series-success)',
        backgroundColor: 'var(--chart-fill-success)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.38,
      },
    ],
  };

  protected readonly barData: ChartData<'bar'> = {
    labels: ['ChangeUp', 'TimeUp', 'DeckUp', 'DocUp'],
    datasets: [
      {
        label: 'Requests',
        data: [82, 67, 43, 59],
        backgroundColor: 'var(--chart-series-primary)',
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  protected readonly stackedData: ChartData<'bar'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Input',
        data: [34, 39, 36, 46, 51],
        backgroundColor: 'var(--chart-series-primary)',
        borderRadius: 3,
      },
      {
        label: 'Output',
        data: [12, 14, 13, 17, 19],
        backgroundColor: 'var(--chart-series-secondary)',
        borderRadius: 3,
      },
    ],
  };

  protected readonly donutData: ChartData<'doughnut'> = {
    labels: ['OpenAI', 'Anthropic', 'Google', 'Others'],
    datasets: [
      {
        data: [42, 31, 18, 9],
        backgroundColor: [
          'var(--chart-series-primary)',
          'var(--chart-series-secondary)',
          'var(--chart-series-success)',
          'var(--chart-series-muted)',
        ],
        borderColor: 'var(--color-surface)',
        borderWidth: 3,
      },
    ],
  };

  protected readonly lineOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 10,
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { size: 10 },
        },
      },
      y: {
        border: { display: false },
        grid: { color: 'var(--chart-grid)' },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { size: 10 },
        },
      },
    },
  };

  protected readonly barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 10,
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { size: 10 },
        },
      },
      y: {
        border: { display: false },
        grid: { color: 'var(--chart-grid)' },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { size: 10 },
        },
      },
    },
  };

  protected readonly stackedOptions: ChartOptions<'bar'> = {
    ...this.barOptions,
    plugins: {
      ...this.barOptions.plugins,
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          color: 'var(--color-text-secondary)',
          font: { size: 10 },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        border: { display: false },
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)', font: { size: 10 } },
      },
      y: {
        stacked: true,
        border: { display: false },
        grid: { color: 'var(--chart-grid)' },
        ticks: { color: 'var(--color-text-muted)', font: { size: 10 } },
      },
    },
  };

  protected readonly donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '66%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          padding: 12,
          color: 'var(--color-text-secondary)',
          font: { size: 10 },
        },
      },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 10,
      },
    },
  };

  ngOnDestroy(): void {
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    if (this.loadingTimer) {
      window.clearTimeout(this.loadingTimer);
    }
  }

  protected toggleModel(model: string): void {
    this.selectedModels.update((models) =>
      models.includes(model)
        ? models.filter((item) => item !== model)
        : [...models, model],
    );
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected toggleMultiSelect(): void {
    this.multiSelectOpen.update((open) => !open);
  }

  protected toggleSwitch(): void {
    this.switchEnabled.update((enabled) => !enabled);
  }

  protected toggleDropdown(): void {
    this.dropdownOpen.update((open) => !open);
  }

  protected toggleIconState(): void {
    this.iconLiked.update((liked) => !liked);
  }

  protected updateSearch(event: Event): void {
    this.tableSearch.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  protected toggleSort(): void {
    this.sortAscending.update((ascending) => !ascending);
  }

  protected toggleRow(id: number): void {
    this.selectedRows.update((selected) => {
      const next = new Set(selected);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  protected toggleAllRows(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.selectedRows.set(
      checked ? new Set(this.filteredRows().map((row) => row.id)) : new Set(),
    );
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected simulateLoading(): void {
    this.tableLoading.set(true);
    if (this.loadingTimer) {
      window.clearTimeout(this.loadingTimer);
    }
    this.loadingTimer = window.setTimeout(() => this.tableLoading.set(false), 1200);
  }

  protected showToast(message = '설정이 저장되었습니다.'): void {
    this.toastMessage.set(message);
    this.toastVisible.set(true);
    if (this.toastTimer) {
      window.clearTimeout(this.toastTimer);
    }
    this.toastTimer = window.setTimeout(() => this.toastVisible.set(false), 3200);
  }

  protected confirmAction(): void {
    this.confirmationOpen.set(false);
    this.showToast('변경 사항이 적용되었습니다.');
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  protected statusTone(status: ShowcaseTableRow['status']): 'success' | 'warning' | 'neutral' {
    return status === 'Active'
      ? 'success'
      : status === 'Pending'
        ? 'warning'
        : 'neutral';
  }

  protected statusLabel(status: ShowcaseTableRow['status']): string {
    return { Active: '활성', Pending: '대기', Inactive: '비활성' }[status];
  }
}
