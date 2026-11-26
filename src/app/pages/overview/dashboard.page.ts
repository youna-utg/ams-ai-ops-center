import { Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartData, ChartOptions, Plugin, TooltipItem } from 'chart.js';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { GaugeComponent } from '../../shared/components/gauge/gauge.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { areaFade } from '../../shared/charts/chart-fill';

type TrendRange = 'today' | '7d' | '30d';

interface TrendSet {
  labels: string[];
  usage: number[];
  cost: number[];
}

interface RankingRow {
  name: string;
  usage: string;
  cost: string;
}

const PROVIDER_LABELS = ['OpenAI', 'Anthropic', 'Google', 'Azure AI', 'DeepL'];
const PROVIDER_WEIGHTS = [133.6, 102.3, 56.8, 22.5, 14.3];
const PROVIDER_WEIGHT_TOTAL = PROVIDER_WEIGHTS.reduce((sum, value) => sum + value, 0);

const TREND_SETS: Record<TrendRange, TrendSet> = {
  today: {
    labels: ['00시', '04시', '08시', '12시', '16시', '20시', '현재'],
    usage: [520, 410, 680, 1240, 1480, 1120, 1390],
    cost: [2.4, 1.9, 3.3, 6.1, 7.2, 5.4, 6.6],
  },
  '7d': {
    labels: ['11/20', '11/21', '11/22', '11/23', '11/24', '11/25', '11/26'],
    usage: [5840, 6420, 5980, 7120, 6680, 7340, 6840],
    cost: [29.4, 32.2, 30.1, 35.8, 33.6, 36.9, 32.9],
  },
  '30d': {
    labels: ['10/28', '11/02', '11/07', '11/12', '11/17', '11/22', '11/26'],
    usage: [24800, 27600, 26100, 31200, 29400, 33800, 30100],
    cost: [118.4, 132.6, 124.8, 152.2, 142.6, 168.4, 147.4],
  },
};

const CUSTOMER_RANKINGS: Record<TrendRange, RankingRow[]> = {
  today: [
    { name: 'Uptempo Global', usage: '1,420', cost: '$6.83' },
    { name: 'Mirae Retail', usage: '1,080', cost: '$5.20' },
    { name: 'Nexus Labs', usage: '860', cost: '$4.14' },
    { name: 'Orbit Finance', usage: '720', cost: '$3.46' },
    { name: 'Lumen Works', usage: '540', cost: '$2.60' },
  ],
  '7d': [
    { name: 'Uptempo Global', usage: '9,860', cost: '$49.26' },
    { name: 'Mirae Retail', usage: '7,420', cost: '$37.07' },
    { name: 'Nexus Labs', usage: '5,640', cost: '$28.18' },
    { name: 'Orbit Finance', usage: '4,280', cost: '$21.38' },
    { name: 'Lumen Works', usage: '3,160', cost: '$15.79' },
  ],
  '30d': [
    { name: 'Uptempo Global', usage: '42,800', cost: '$207.99' },
    { name: 'Mirae Retail', usage: '32,400', cost: '$157.46' },
    { name: 'Nexus Labs', usage: '24,600', cost: '$119.55' },
    { name: 'Orbit Finance', usage: '19,800', cost: '$96.22' },
    { name: 'Lumen Works', usage: '14,200', cost: '$69.01' },
  ],
};

const PRODUCT_RANKINGS: Record<TrendRange, RankingRow[]> = {
  today: [
    { name: 'AI Copy Studio', usage: '1,680', cost: '$8.08' },
    { name: 'Support Copilot', usage: '1,320', cost: '$6.35' },
    { name: 'Document Insight', usage: '980', cost: '$4.71' },
    { name: 'Smart Search', usage: '720', cost: '$3.46' },
    { name: 'Meeting Summary', usage: '480', cost: '$2.31' },
  ],
  '7d': [
    { name: 'AI Copy Studio', usage: '11,240', cost: '$56.16' },
    { name: 'Support Copilot', usage: '8,960', cost: '$44.77' },
    { name: 'Document Insight', usage: '6,540', cost: '$32.67' },
    { name: 'Smart Search', usage: '4,820', cost: '$24.08' },
    { name: 'Meeting Summary', usage: '3,280', cost: '$16.38' },
  ],
  '30d': [
    { name: 'AI Copy Studio', usage: '48,600', cost: '$236.15' },
    { name: 'Support Copilot', usage: '38,400', cost: '$186.58' },
    { name: 'Document Insight', usage: '28,200', cost: '$137.02' },
    { name: 'Smart Search', usage: '20,800', cost: '$101.07' },
    { name: 'Meeting Summary', usage: '14,200', cost: '$69.01' },
  ],
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    ChartComponent,
    GaugeComponent,
    IconComponent,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
})
export class DashboardPage {
  protected readonly selectedRange = signal<TrendRange>('today');
  protected readonly trendData = computed<ChartData<'line'>>(() => {
    const trend = TREND_SETS[this.selectedRange()];
    return {
      labels: trend.labels,
      datasets: [
        {
          label: 'API 사용량',
          data: trend.usage,
          borderColor: 'var(--chart-series-primary)',
          backgroundColor: areaFade('--chart-series-primary', '#2f9aff'),
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBorderWidth: 2,
          pointHoverBackgroundColor: 'var(--color-surface)',
          fill: true,
          tension: 0.42,
          yAxisID: 'y',
        },
        {
          label: '외부 비용',
          data: trend.cost,
          borderColor: 'var(--chart-series-success)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.42,
          yAxisID: 'cost',
        },
      ],
    };
  });

  protected readonly trendOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        display: true,
        align: 'end',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 6,
          boxHeight: 6,
          color: 'var(--color-text-secondary)',
          font: { family: 'var(--font-family-sans)', size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            context.datasetIndex === 0
              ? ` API 사용량: ${this.formatNumber(context.parsed.y ?? 0)}건`
              : ` 외부 비용: $${this.formatNumber(context.parsed.y ?? 0)}`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: {
          color: 'var(--color-text-muted)',
          font: { family: 'var(--font-family-sans)', size: 11 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: 'var(--chart-grid)', drawTicks: false },
        ticks: {
          color: 'var(--color-text-muted)',
          maxTicksLimit: 4,
          padding: 10,
          callback: (value) => this.formatCompact(Number(value)),
        },
      },
      cost: {
        display: false,
        beginAtZero: true,
        position: 'right',
        grid: { display: false },
      },
    },
  };

  protected readonly providerCostTotal = computed(() =>
    TREND_SETS[this.selectedRange()].cost.reduce((sum, value) => sum + value, 0),
  );

  protected readonly providerCostData = computed<ChartData<'doughnut'>>(() => {
    const total = this.providerCostTotal();
    const values = PROVIDER_WEIGHTS.map((weight, index) => {
      if (index === PROVIDER_WEIGHTS.length - 1) {
        const allocated = PROVIDER_WEIGHTS.slice(0, -1).reduce(
          (sum, item) => sum + roundMoney((total * item) / PROVIDER_WEIGHT_TOTAL),
          0,
        );
        return roundMoney(total - allocated);
      }
      return roundMoney((total * weight) / PROVIDER_WEIGHT_TOTAL);
    });

    return {
      labels: PROVIDER_LABELS,
      datasets: [
        {
          label: '외부 비용',
          data: values,
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
  });

  protected readonly doughnutPlugins: Plugin<'doughnut'>[] = [
    {
      id: 'dashboardDonutCenter',
      afterDraw: (chart) => {
        const { chartArea, ctx } = chart;
        const x = (chartArea.left + chartArea.right) / 2;
        const y = (chartArea.top + chartArea.bottom) / 2;
        const style = getComputedStyle(chart.canvas);
        const font = style.getPropertyValue('--font-family-data').trim() || 'Figtree, sans-serif';
        const total = this.formatCurrency(this.providerCostTotal());
        const valueSize = total.length > 12 ? 16 : 18;

        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = style.getPropertyValue('--color-text-muted').trim() || '#727883';
        ctx.font = `500 12px ${font}`;
        ctx.fillText('Total Cost', x, y - 12);
        ctx.fillStyle = style.getPropertyValue('--color-text-primary').trim() || '#15181e';
        ctx.font = `700 ${valueSize}px ${font}`;
        ctx.fillText(total, x, y + 12);
        ctx.restore();
      },
    },
  ];

  protected readonly doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          boxHeight: 8,
          padding: 14,
          color: 'var(--color-text-secondary)',
          font: { family: 'var(--font-family-sans)', size: 13 },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) =>
            ` ${context.label}: $${this.formatNumber(Number(context.parsed))}`,
        },
      },
    },
  };

  protected readonly customers = computed(() => CUSTOMER_RANKINGS[this.selectedRange()]);
  protected readonly products = computed(() => PRODUCT_RANKINGS[this.selectedRange()]);

  protected readonly recentErrors = [
    { time: '11:48:22', product: 'Support Copilot', type: 'Rate limit exceeded', result: '자동 재시도 완료', tone: 'success' as const },
    { time: '11:32:09', product: 'AI Copy Studio', type: 'Context length 초과', result: '요청 차단', tone: 'warning' as const },
    { time: '10:58:41', product: 'Smart Search', type: 'Provider timeout', result: 'Fallback 처리', tone: 'info' as const },
    { time: '10:17:36', product: 'Document Insight', type: 'Invalid request', result: '확인 필요', tone: 'danger' as const },
    { time: '09:44:12', product: 'Meeting Summary', type: 'Provider timeout', result: '자동 재시도 완료', tone: 'success' as const },
  ];

  protected readonly providerModels = [
    { provider: 'OpenAI', model: 'GPT-4.1', status: '정상', tone: 'success' as const, latency: '286ms' },
    { provider: 'Anthropic', model: 'Claude Sonnet 4', status: '정상', tone: 'success' as const, latency: '312ms' },
    { provider: 'Google', model: 'Gemini 2.5 Pro', status: '지연', tone: 'warning' as const, latency: '524ms' },
    { provider: 'OpenAI', model: 'GPT-4o mini', status: '정상', tone: 'success' as const, latency: '198ms' },
  ];

  protected setRange(range: TrendRange): void {
    this.selectedRange.set(range);
  }

  protected formatNumber(value: number): string {
    return new Intl.NumberFormat('ko-KR').format(value);
  }

  protected formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }

  private formatCompact(value: number): string {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  }
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}
