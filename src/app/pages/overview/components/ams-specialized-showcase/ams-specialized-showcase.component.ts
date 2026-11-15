import { Component, OnDestroy, computed, signal } from '@angular/core';
import { ChartData, ChartOptions } from 'chart.js';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import {
  StatusBadgeComponent,
  StatusTone,
} from '../../../../shared/components/status-badge/status-badge.component';

type PermissionPreset =
  | 'Super Admin'
  | 'System Admin'
  | 'Product Manager'
  | 'Custom';

interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: string;
  initials: string;
  lastActive: string;
}

interface PermissionItem {
  id: string;
  label: string;
  description: string;
  group: string;
}

const ACCOUNTS: AdminAccount[] = [
  {
    id: 'luna',
    name: 'Luna Kim',
    email: 'luna.kim@example.com',
    role: 'Super Admin',
    initials: 'LK',
    lastActive: '방금 전',
  },
  {
    id: 'seoyeon',
    name: '김서연',
    email: 'seoyeon.kim@example.com',
    role: 'Product Manager',
    initials: 'KS',
    lastActive: '18분 전',
  },
  {
    id: 'doyun',
    name: '이도윤',
    email: 'doyun.lee@example.com',
    role: 'System Admin',
    initials: 'LD',
    lastActive: '2시간 전',
  },
];

const PERMISSIONS: PermissionItem[] = [
  {
    id: 'products.view',
    label: 'Product 조회',
    description: 'Product 목록과 상세 정보 조회',
    group: 'Product',
  },
  {
    id: 'products.manage',
    label: 'Product 관리',
    description: 'Product 생성 및 운영 설정 변경',
    group: 'Product',
  },
  {
    id: 'ai.view',
    label: 'AI 사용량 조회',
    description: 'Provider 사용량과 원가 데이터 조회',
    group: 'AI Operations',
  },
  {
    id: 'ai.manage',
    label: 'Provider 관리',
    description: 'Model, API 연결 및 가격 정보 변경',
    group: 'AI Operations',
  },
  {
    id: 'admin.accounts',
    label: '계정 관리',
    description: '관리자 계정 초대 및 상태 변경',
    group: 'Administration',
  },
  {
    id: 'system.manage',
    label: 'System 설정',
    description: '시스템 전역 설정과 상태 관리',
    group: 'System',
  },
];

const PRESETS: Record<Exclude<PermissionPreset, 'Custom'>, string[]> = {
  'Super Admin': PERMISSIONS.map((permission) => permission.id),
  'System Admin': [
    'products.view',
    'ai.view',
    'ai.manage',
    'admin.accounts',
    'system.manage',
  ],
  'Product Manager': ['products.view', 'products.manage', 'ai.view'],
};

@Component({
  selector: 'app-ams-specialized-showcase',
  standalone: true,
  imports: [ChartComponent, IconComponent, StatusBadgeComponent],
  templateUrl: './ams-specialized-showcase.component.html',
  styleUrl: './ams-specialized-showcase.component.scss',
})
export class AmsSpecializedShowcaseComponent implements OnDestroy {
  protected readonly accounts = ACCOUNTS;
  protected readonly permissions = PERMISSIONS;
  protected readonly selectedAccountId = signal('luna');
  protected readonly accountPresets = signal<Record<string, PermissionPreset>>({
    luna: 'Super Admin',
    seoyeon: 'Product Manager',
    doyun: 'System Admin',
  });
  protected readonly accountPermissions = signal<Record<string, string[]>>({
    luna: [...PRESETS['Super Admin']],
    seoyeon: [...PRESETS['Product Manager']],
    doyun: [...PRESETS['System Admin']],
  });
  protected readonly apiKeyVisible = signal(false);
  protected readonly permissionSaving = signal(false);
  protected readonly permissionMessage = signal('');
  protected readonly pricingActionMessage = signal('');
  protected readonly severityFilter = signal<'All' | 'Info' | 'Warning' | 'Error'>('All');

  private permissionTimer?: number;

  protected readonly selectedAccount = computed(
    () =>
      ACCOUNTS.find(
        (account) => account.id === this.selectedAccountId(),
      ) ?? ACCOUNTS[0],
  );

  protected readonly selectedPermissions = computed(
    () => this.accountPermissions()[this.selectedAccountId()] ?? [],
  );
  protected readonly selectedPreset = computed(
    () => this.accountPresets()[this.selectedAccountId()] ?? 'Custom',
  );

  protected readonly permissionGroups = computed(() =>
    [...new Set(PERMISSIONS.map((permission) => permission.group))].map(
      (group) => ({
        group,
        items: PERMISSIONS.filter((permission) => permission.group === group),
      }),
    ),
  );

  protected readonly selectedPermissionCount = computed(
    () => this.selectedPermissions().length,
  );

  protected readonly costTrendData: ChartData<'line'> = {
    labels: ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'],
    datasets: [
      {
        label: 'Provider Cost',
        data: [248, 261, 255, 286, 302, 318, 329.5],
        borderColor: 'var(--chart-series-primary)',
        backgroundColor: 'var(--chart-fill-primary)',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        tension: 0.35,
      },
    ],
  };

  protected readonly costTrendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'var(--chart-tooltip-bg)',
        padding: 10,
        callbacks: {
          label: (context) => ` Provider Cost: $${context.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: 'var(--color-text-muted)', font: { size: 10 } },
      },
      y: {
        border: { display: false },
        grid: { color: 'var(--chart-grid)' },
        ticks: {
          color: 'var(--color-text-muted)',
          callback: (value) => `$${value}`,
          font: { size: 10 },
        },
      },
    },
  };

  ngOnDestroy(): void {
    if (this.permissionTimer) {
      window.clearTimeout(this.permissionTimer);
    }
  }

  protected selectAccount(account: AdminAccount): void {
    this.selectedAccountId.set(account.id);
    this.permissionMessage.set('');
  }

  protected setPreset(event: Event): void {
    const preset = (event.target as HTMLSelectElement)
      .value as PermissionPreset;
    this.updateSelectedPreset(preset);

    if (preset !== 'Custom') {
      this.updateSelectedPermissions(PRESETS[preset]);
    }
  }

  protected togglePermission(permissionId: string): void {
    const current = new Set(this.selectedPermissions());
    current.has(permissionId)
      ? current.delete(permissionId)
      : current.add(permissionId);
    this.updateSelectedPermissions([...current]);
    this.updateSelectedPreset('Custom');
  }

  protected selectAllPermissions(): void {
    this.updateSelectedPermissions(PERMISSIONS.map((item) => item.id));
    this.updateSelectedPreset('Custom');
  }

  protected clearPermissions(): void {
    this.updateSelectedPermissions([]);
    this.updateSelectedPreset('Custom');
  }

  protected hasPermission(permissionId: string): boolean {
    return this.selectedPermissions().includes(permissionId);
  }

  protected savePermissions(): void {
    if (this.permissionSaving()) {
      return;
    }
    this.permissionSaving.set(true);
    this.permissionMessage.set('');
    if (this.permissionTimer) {
      window.clearTimeout(this.permissionTimer);
    }
    this.permissionTimer = window.setTimeout(() => {
      this.permissionSaving.set(false);
      this.permissionMessage.set(
        `${this.selectedAccount().name} 계정 권한을 저장했습니다.`,
      );
    }, 900);
  }

  protected choosePricingAction(model: string): void {
    this.pricingActionMessage.set(`${model} 가격 편집 화면을 준비했습니다.`);
  }

  protected cycleSeverityFilter(): void {
    const filters: Array<'All' | 'Info' | 'Warning' | 'Error'> = [
      'All',
      'Info',
      'Warning',
      'Error',
    ];
    const next = (filters.indexOf(this.severityFilter()) + 1) % filters.length;
    this.severityFilter.set(filters[next]);
  }

  protected logVisible(severity: string): boolean {
    return this.severityFilter() === 'All' || this.severityFilter() === severity;
  }

  protected statusTone(status: string): StatusTone {
    return {
      Operational: 'success',
      Connected: 'success',
      Degraded: 'warning',
      Review: 'info',
    }[status] as StatusTone;
  }

  private updateSelectedPermissions(permissions: string[]): void {
    this.permissionMessage.set('');
    this.accountPermissions.update((accounts) => ({
      ...accounts,
      [this.selectedAccountId()]: permissions,
    }));
  }

  private updateSelectedPreset(preset: PermissionPreset): void {
    this.permissionMessage.set('');
    this.accountPresets.update((presets) => ({
      ...presets,
      [this.selectedAccountId()]: preset,
    }));
  }
}
