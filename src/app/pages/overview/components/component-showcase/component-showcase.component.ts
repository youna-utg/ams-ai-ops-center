import {
  Component,
  HostListener,
  OnDestroy,
  computed,
  signal,
} from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { areaFade, barGradientPlugin } from '../../../../shared/charts/chart-fill';
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

interface ActionCodeRow {
  id: number;
  code: string;
  name: string;
  target: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

const TABLE_ROWS: ShowcaseTableRow[] = [
  { id: 1, product: 'ChangeUp', owner: '김서연', status: 'Active', requests: 8440 },
  { id: 2, product: 'TimeUp', owner: '이도윤', status: 'Active', requests: 6700 },
  { id: 3, product: 'DeckUp', owner: '박지민', status: 'Pending', requests: 2520 },
  { id: 4, product: 'DocUp', owner: '최유진', status: 'Active', requests: 5610 },
  { id: 5, product: 'MatchUp', owner: '정하준', status: 'Inactive', requests: 2070 },
];

const ACTION_CODES: ActionCodeRow[] = [
  { id: 1, code: 'ACT-014', name: 'Product 생성', target: 'Product', status: 'Active' },
  { id: 2, code: 'ACT-021', name: '사용자 초대', target: 'Product User', status: 'Active' },
  { id: 3, code: 'ACT-033', name: 'Provider 연결', target: 'Provider', status: 'Pending' },
  { id: 4, code: 'ACT-040', name: '가격 변경', target: 'Pricing', status: 'Inactive' },
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
  protected readonly visibleAlerts = signal({ info: true, success: true, warning: true, danger: true });
  protected readonly tableSearch = signal('');
  protected readonly tableStatusFilter = signal<'All' | ShowcaseTableRow['status']>('All');
  protected readonly tableOwnerFilter = signal('All');
  protected readonly tableStatusOpen = signal(false);
  protected readonly tableOwnerOpen = signal(false);
  protected readonly actionTargetOpen = signal(false);
  protected readonly actionStatusOpen = signal(false);
  protected readonly tableStatusOptions: Array<{
    value: 'All' | ShowcaseTableRow['status'];
    label: string;
  }> = [
    { value: 'All', label: '전체 상태' },
    { value: 'Active', label: '활성' },
    { value: 'Pending', label: '대기' },
    { value: 'Inactive', label: '비활성' },
  ];
  protected readonly actionStatusOptions: Array<{
    value: 'All' | ActionCodeRow['status'];
    label: string;
  }> = [
    { value: 'All', label: '모든 상태' },
    { value: 'Active', label: '활성' },
    { value: 'Pending', label: '대기' },
    { value: 'Inactive', label: '비활성' },
  ];
  protected readonly sortAscending = signal(false);
  protected readonly selectedRows = signal<Set<number>>(new Set([1]));
  protected readonly selectedDetailRow = signal<ShowcaseTableRow>(TABLE_ROWS[0]);
  protected readonly currentPage = signal(1);
  protected readonly iconLiked = signal(false);
  protected readonly buttonLoading = signal(false);
  protected readonly modalSaving = signal(false);
  protected readonly endpointValue = signal('invalid endpoint');
  protected readonly endpointSubmitted = signal(false);
  protected readonly formSearch = signal('');
  protected readonly compactSearch = signal('');
  protected readonly compactFilterActive = signal(false);
  protected readonly tableRows = signal<ShowcaseTableRow[]>([...TABLE_ROWS]);
  protected readonly actionCodes = signal<ActionCodeRow[]>([...ACTION_CODES]);
  protected readonly actionSearch = signal('');
  protected readonly actionTargetFilter = signal('All');
  protected readonly actionStatusFilter = signal<'All' | ActionCodeRow['status']>('All');
  protected readonly createKind = signal<'product' | 'action' | null>(null);
  protected readonly draftCode = signal('');
  protected readonly draftName = signal('');
  protected readonly draftDescription = signal('');
  protected readonly draftRpm = signal(0);
  protected readonly draftRph = signal(0);
  protected readonly draftStatus = signal<'Active' | 'Pending' | 'Inactive'>('Active');
  protected readonly draftTarget = signal('Product');
  protected readonly creditPools = signal([{ id: 1, name: 'Credit Pool', amount: 0 }]);
  protected readonly dialogScrolling = signal(false);
  protected readonly dialogThumb = signal({ top: 12, height: 0 });
  protected readonly startDate = signal('2026-11-01');
  protected readonly endDate = signal('2026-11-15');

  private toastTimer?: number;
  private buttonTimer?: number;
  private modalTimer?: number;
  private dialogScrollTimer?: number;

  protected readonly filteredRows = computed(() => {
    const query = this.tableSearch().trim().toLowerCase();
    const filtered = this.tableRows().filter((row) => {
      const matchesQuery = query
        ? `${row.product} ${row.owner} ${row.status}`
            .toLowerCase()
            .includes(query)
        : true;
      const matchesStatus =
        this.tableStatusFilter() === 'All' ||
        row.status === this.tableStatusFilter();
      const matchesOwner =
        this.tableOwnerFilter() === 'All' ||
        row.owner === this.tableOwnerFilter();

      return matchesQuery && matchesStatus && matchesOwner;
    });

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
  protected readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );
  protected readonly allRowsSelected = computed(
    () =>
      this.filteredRows().length > 0 &&
      this.filteredRows().every((row) => this.selectedRows().has(row.id)),
  );
  protected readonly someRowsSelected = computed(
    () =>
      !this.allRowsSelected() &&
      this.filteredRows().some((row) => this.selectedRows().has(row.id)),
  );
  protected readonly tableOwners = computed(() => [
    ...new Set(this.tableRows().map((row) => row.owner)),
  ]);
  protected readonly tableOwnerOptions = computed(() => [
    { value: 'All', label: '전체 담당자' },
    ...this.tableOwners().map((owner) => ({ value: owner, label: owner })),
  ]);
  protected readonly tableStatusLabel = computed(
    () =>
      this.tableStatusOptions.find((option) => option.value === this.tableStatusFilter())
        ?.label ?? '전체 상태',
  );
  protected readonly tableOwnerLabel = computed(
    () =>
      this.tableOwnerOptions().find((option) => option.value === this.tableOwnerFilter())
        ?.label ?? '전체 담당자',
  );
  protected readonly actionTargets = computed(() => [
    ...new Set(this.actionCodes().map((row) => row.target)),
  ]);
  protected readonly actionTargetOptions = computed(() => [
    { value: 'All', label: '모든 대상' },
    ...this.actionTargets().map((target) => ({ value: target, label: target })),
  ]);
  protected readonly actionTargetLabel = computed(
    () =>
      this.actionTargetOptions().find((option) => option.value === this.actionTargetFilter())
        ?.label ?? '모든 대상',
  );
  protected readonly actionStatusLabel = computed(
    () =>
      this.actionStatusOptions.find((option) => option.value === this.actionStatusFilter())
        ?.label ?? '모든 상태',
  );
  protected readonly filteredActionCodes = computed(() => {
    const query = this.actionSearch().trim().toLowerCase();
    return this.actionCodes().filter((row) => {
      const matchesQuery =
        !query || `${row.code} ${row.name}`.toLowerCase().includes(query);
      const matchesTarget =
        this.actionTargetFilter() === 'All' || row.target === this.actionTargetFilter();
      const matchesStatus =
        this.actionStatusFilter() === 'All' || row.status === this.actionStatusFilter();
      return matchesQuery && matchesTarget && matchesStatus;
    });
  });
  protected readonly endpointValid = computed(() => {
    try {
      const url = new URL(this.endpointValue());
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  });
  protected readonly dateRangeValid = computed(
    () => this.startDate() <= this.endDate(),
  );
  protected readonly searchPreview = computed(() => {
    const query = this.formSearch().trim();
    return query ? `"${query}" 검색 결과 3명` : '';
  });

  protected readonly lineData: ChartData<'line'> = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Requests',
        data: [38, 44, 41, 56, 52, 68, 74],
        borderColor: 'var(--chart-series-primary)',
        backgroundColor: areaFade('--chart-series-primary', '#2f9aff'),
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.42,
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
        backgroundColor: areaFade('--chart-series-success', '#818cf8'),
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.42,
      },
    ],
  };

  protected readonly barData = {
    labels: ['ChangeUp', 'TimeUp', 'DeckUp', 'DocUp'],
    datasets: [
      {
        label: 'Requests',
        data: [82, 67, 43, 59],
        backgroundColor: '#2f9aff',
        gradientTokens: ['--chart-series-primary'],
        borderRadius: 10,
        borderSkipped: false,
        maxBarThickness: 84,
        categoryPercentage: 0.96,
        barPercentage: 0.92,
      },
    ],
  } as unknown as ChartData<'bar'>;

  protected readonly stackedData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        label: 'Input',
        data: [34, 39, 36, 46, 51],
        backgroundColor: '#2f9aff',
        gradientTokens: ['--chart-series-primary'],
        borderRadius: 8,
        maxBarThickness: 64,
        categoryPercentage: 0.96,
        barPercentage: 0.92,
      },
      {
        label: 'Output',
        data: [12, 14, 13, 17, 19],
        backgroundColor: '#38bdf8',
        gradientTokens: ['--chart-series-secondary'],
        borderRadius: 8,
        maxBarThickness: 64,
        categoryPercentage: 0.96,
        barPercentage: 0.92,
      },
    ],
  } as unknown as ChartData<'bar'>;

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

  protected readonly barPlugins = [barGradientPlugin];

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
    cutout: '56%',
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
    if (this.buttonTimer) {
      window.clearTimeout(this.buttonTimer);
    }
    if (this.modalTimer) {
      window.clearTimeout(this.modalTimer);
    }
    if (this.dialogScrollTimer) {
      window.clearTimeout(this.dialogScrollTimer);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOverlays(): void {
    this.dropdownOpen.set(false);
    this.multiSelectOpen.set(false);
    this.modalOpen.set(false);
    this.createKind.set(null);
    this.confirmationOpen.set(false);
    this.closeTableMenus();
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

  protected setTableStatus(value: 'All' | ShowcaseTableRow['status']): void {
    this.tableStatusFilter.set(value);
    this.currentPage.set(1);
    this.closeTableMenus();
  }

  protected setTableOwner(value: string): void {
    this.tableOwnerFilter.set(value);
    this.currentPage.set(1);
    this.closeTableMenus();
  }

  protected setActionTarget(value: string): void {
    this.actionTargetFilter.set(value);
    this.closeTableMenus();
  }

  protected setActionStatus(value: 'All' | ActionCodeRow['status']): void {
    this.actionStatusFilter.set(value);
    this.closeTableMenus();
  }

  protected toggleTableStatus(): void {
    const next = !this.tableStatusOpen();
    this.closeTableMenus();
    this.tableStatusOpen.set(next);
  }

  protected toggleTableOwner(): void {
    const next = !this.tableOwnerOpen();
    this.closeTableMenus();
    this.tableOwnerOpen.set(next);
  }

  protected toggleActionTarget(): void {
    const next = !this.actionTargetOpen();
    this.closeTableMenus();
    this.actionTargetOpen.set(next);
  }

  protected toggleActionStatus(): void {
    const next = !this.actionStatusOpen();
    this.closeTableMenus();
    this.actionStatusOpen.set(next);
  }

  private closeTableMenus(): void {
    this.tableStatusOpen.set(false);
    this.tableOwnerOpen.set(false);
    this.actionTargetOpen.set(false);
    this.actionStatusOpen.set(false);
  }

  protected updateActionSearch(event: Event): void {
    this.actionSearch.set((event.target as HTMLInputElement).value);
  }

  protected addShowcaseProduct(): void {
    this.resetDraft();
    this.createKind.set('product');
  }

  protected addActionCode(): void {
    this.resetDraft();
    this.draftTarget.set('Product');
    this.createKind.set('action');
  }

  protected inputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement).value;
  }

  protected inputNumber(event: Event): number {
    return Number(this.inputValue(event)) || 0;
  }

  protected statusValue(event: Event): 'Active' | 'Pending' | 'Inactive' {
    const value = this.inputValue(event);
    return value === 'Pending' || value === 'Inactive' ? value : 'Active';
  }

  protected addCreditPool(): void {
    this.creditPools.update((pools) => [
      ...pools,
      { id: Math.max(...pools.map((pool) => pool.id)) + 1, name: 'Credit Pool', amount: 0 },
    ]);
  }

  protected updateCreditPool(id: number, key: 'name' | 'amount', value: string): void {
    this.creditPools.update((pools) =>
      pools.map((pool) =>
        pool.id === id
          ? { ...pool, [key]: key === 'amount' ? Number(value) || 0 : value }
          : pool,
      ),
    );
  }

  protected saveCreateModal(): void {
    const name = this.draftName().trim();
    const code = this.draftCode().trim();
    if (this.createKind() === 'product') {
      const rows = this.tableRows();
      const nextId = Math.max(...rows.map((row) => row.id)) + 1;
      this.tableRows.update((items) => [
        {
          id: nextId,
          product: name || code || `New Product ${nextId}`,
          owner: '김서연',
          status: this.draftStatus(),
          requests: this.draftRpm(),
        },
        ...items,
      ]);
      this.currentPage.set(1);
      this.showToast('Product를 추가했습니다.');
    }

    if (this.createKind() === 'action') {
      const rows = this.actionCodes();
      const nextId = Math.max(...rows.map((row) => row.id)) + 1;
      this.actionCodes.update((items) => [
        {
          id: nextId,
          code: code || `ACT-${String(40 + nextId * 3).padStart(3, '0')}`,
          name: name || '새 액션 코드',
          target: this.draftTarget(),
          status: this.draftStatus(),
        },
        ...items,
      ]);
      this.showToast('액션 코드를 추가했습니다.');
    }

    this.createKind.set(null);
  }

  private resetDraft(): void {
    this.draftCode.set('');
    this.draftName.set('');
    this.draftDescription.set('');
    this.draftRpm.set(0);
    this.draftRph.set(0);
    this.draftStatus.set('Active');
    this.draftTarget.set('Product');
    this.creditPools.set([{ id: 1, name: 'Credit Pool', amount: 0 }]);
  }

  protected openDetailModal(row: ShowcaseTableRow): void {
    this.selectedDetailRow.set(row);
    this.modalOpen.set(true);
  }

  protected onDialogScroll(event: Event): void {
    const element = event.currentTarget as HTMLElement;
    const overflow = element.scrollHeight - element.clientHeight;
    if (overflow <= 1) {
      this.dialogScrolling.set(false);
      this.dialogThumb.set({ top: 12, height: 0 });
      return;
    }

    const inset = 12;
    const track = element.clientHeight - inset * 2;
    const height = Math.max(32, (element.clientHeight / element.scrollHeight) * track);
    const top =
      element.offsetTop +
      inset +
      (element.scrollTop / overflow) * (track - height);
    this.dialogThumb.set({ top, height });
    this.dialogScrolling.set(true);
    if (this.dialogScrollTimer) {
      window.clearTimeout(this.dialogScrollTimer);
    }
    this.dialogScrollTimer = window.setTimeout(() => {
      this.dialogScrolling.set(false);
    }, 700);
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

  protected updateEndpoint(event: Event): void {
    this.endpointValue.set((event.target as HTMLInputElement).value);
    this.endpointSubmitted.set(false);
  }

  protected validateEndpoint(): void {
    this.endpointSubmitted.set(true);
    this.showToast(
      this.endpointValid()
        ? 'Endpoint 검증에 성공했습니다.'
        : 'Endpoint 형식을 확인해 주세요.',
    );
  }

  protected updateFormSearch(event: Event): void {
    this.formSearch.set((event.target as HTMLInputElement).value);
  }

  protected updateCompactSearch(event: Event): void {
    this.compactSearch.set((event.target as HTMLInputElement).value);
  }

  protected updateDate(
    boundary: 'start' | 'end',
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value;
    boundary === 'start' ? this.startDate.set(value) : this.endDate.set(value);
  }

  protected goToPage(page: number): void {
    this.currentPage.set(Math.min(Math.max(page, 1), this.totalPages()));
  }

  protected simulateButtonLoading(): void {
    if (this.buttonLoading()) {
      return;
    }
    this.buttonLoading.set(true);
    if (this.buttonTimer) {
      window.clearTimeout(this.buttonTimer);
    }
    this.buttonTimer = window.setTimeout(() => {
      this.buttonLoading.set(false);
      this.showToast('비동기 작업이 완료되었습니다.');
    }, 1200);
  }

  protected saveModal(): void {
    this.modalSaving.set(true);
    if (this.modalTimer) {
      window.clearTimeout(this.modalTimer);
    }
    this.modalTimer = window.setTimeout(() => {
      this.modalSaving.set(false);
      this.modalOpen.set(false);
      this.showToast('Provider 설정이 저장되었습니다.');
    }, 900);
  }

  protected chooseDropdownAction(action: string): void {
    this.dropdownOpen.set(false);
    action === '삭제'
      ? this.confirmationOpen.set(true)
      : this.showToast(`${action} 작업을 실행했습니다.`);
  }

  protected handleTabKey(event: KeyboardEvent): void {
    const tabs: ShowcaseTab[] = ['overview', 'usage', 'settings'];
    const current = tabs.indexOf(this.activeTab());
    let next = current;

    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;

    event.preventDefault();
    this.activeTab.set(tabs[next]);
  }

  protected dismissAlert(kind: 'info' | 'success' | 'warning' | 'danger'): void {
    this.visibleAlerts.update((alerts) => ({ ...alerts, [kind]: false }));
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
