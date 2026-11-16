import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  Chart,
  ChartData,
  ChartOptions,
  ChartType,
  Plugin,
  TooltipModel,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-chart',
  standalone: true,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss',
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) type!: ChartType;
  @Input({ required: true }) data!: ChartData;
  @Input() options: ChartOptions = {};
  @Input() plugins: Plugin[] = [];
  @Input() height = 280;
  @Input() label = '데이터 차트';

  @ViewChild('canvas') private canvas?: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private viewReady = false;
  private tooltipEl?: HTMLDivElement;

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.className = 'chart-tooltip';
    document.body.append(this.tooltipEl);
    window.addEventListener('scroll', this.hideTooltip, true);
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      this.viewReady &&
      (changes['data'] ||
        changes['options'] ||
        changes['plugins'] ||
        changes['type'])
    ) {
      this.render();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.hideTooltip, true);
    this.tooltipEl?.remove();
    this.chart?.destroy();
  }

  private readonly hideTooltip = (): void => {
    this.tooltipEl?.classList.remove('is-visible');
  };

  private render(): void {
    if (!this.canvas) {
      return;
    }

    this.chart?.destroy();
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.chart = new Chart(this.canvas.nativeElement, {
      type: this.type,
      data: this.resolveCssVariables(this.data),
      plugins: this.plugins,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: reduceMotion ? 0 : 280,
        },
        ...this.withExternalTooltip(this.resolveCssVariables(this.options)),
      },
    });
  }

  private withExternalTooltip(options: ChartOptions): ChartOptions {
    const plugins = { ...(options.plugins ?? {}) };
    const tooltip = { ...(plugins.tooltip ?? {}) };

    plugins.tooltip = {
      ...tooltip,
      enabled: false,
      external: (context) => this.showTooltip(context),
    };

    return { ...options, plugins };
  }

  private showTooltip(context: {
    chart: Chart;
    tooltip: TooltipModel<ChartType>;
  }): void {
    const tooltip = context.tooltip;
    const element = this.tooltipEl;
    if (!element) {
      return;
    }

    if (tooltip.opacity === 0 || tooltip.dataPoints.length === 0) {
      element.classList.remove('is-visible');
      return;
    }

    const appearing = !element.classList.contains('is-visible');

    const title = formatTooltipTitle(tooltip.title?.[0] ?? '');
    element.replaceChildren();

    if (title) {
      const heading = document.createElement('p');
      heading.className = 'chart-tooltip__title';
      heading.textContent = title;
      element.append(heading);
    }

    tooltip.dataPoints.forEach((point, index) => {
      const line = tooltip.body?.[index]?.lines?.[0] ?? '';
      const metric = splitMetric(line);
      const datasetLabel = String(point.dataset.label ?? '').trim();
      const name =
        metric.name && metric.name !== title && metric.name !== tooltip.title?.[0]
          ? metric.name
          : datasetLabel && datasetLabel !== title
            ? datasetLabel
            : metric.name === title
              ? ''
              : metric.name;

      const row = document.createElement('div');
      row.className = 'chart-tooltip__row';

      const dot = document.createElement('span');
      dot.className = 'chart-tooltip__dot';
      dot.style.background = dotColor(
        context.chart,
        point.dataset,
        point.dataIndex,
        tooltip.labelColors[index],
        index,
      );
      row.append(dot);

      if (name) {
        const label = document.createElement('span');
        label.className = 'chart-tooltip__name';
        label.textContent = name;
        row.append(label);
      }

      const value = document.createElement('span');
      value.className = 'chart-tooltip__value';
      value.textContent = metric.value || line.trim();
      row.append(value);
      element.append(row);
    });

    const bounds = context.chart.canvas.getBoundingClientRect();
    const anchorX = bounds.left + tooltip.caretX;
    const anchorY = bounds.top + tooltip.caretY;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    let left = anchorX - width / 2;
    let top = anchorY - height - 14;

    if (top < 8) {
      top = anchorY + 14;
    }

    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    element.style.left = `${left}px`;
    element.style.top = `${top}px`;

    if (appearing) {
      requestAnimationFrame(() => element.classList.add('is-visible'));
    }
  }

  private resolveCssVariables<T>(value: T): T {
    if (typeof value === 'string' && value.startsWith('var(')) {
      const token = value.slice(4, -1).trim();
      return getComputedStyle(this.host.nativeElement)
        .getPropertyValue(token)
        .trim() as T;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.resolveCssVariables(item)) as T;
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
          key,
          this.resolveCssVariables(item),
        ]),
      ) as T;
    }

    return value;
  }
}

const TOOLTIP_FALLBACKS = ['#2f9aff', '#38bdf8', '#818cf8', '#2dd4bf', '#d8dce2'];

function formatTooltipTitle(title: string): string {
  const date = title.match(/^(\d{2})\/(\d{2})$/);
  if (date) {
    return `${Number(date[1])}월 ${Number(date[2])}일`;
  }

  return title;
}

function splitMetric(line: string): { name: string; value: string } {
  const text = line.trim();
  const index = text.indexOf(':');
  if (index === -1) {
    return { name: text, value: '' };
  }

  return {
    name: text.slice(0, index).trim(),
    value: text.slice(index + 1).trim(),
  };
}

function dotColor(
  chart: Chart,
  dataset: { gradientTokens?: string[]; borderColor?: unknown; backgroundColor?: unknown },
  dataIndex: number,
  color: { borderColor: unknown; backgroundColor: unknown } | undefined,
  index: number,
): string {
  const tokens = dataset.gradientTokens;
  if (tokens?.length) {
    const token = tokens[dataIndex % tokens.length];
    const resolved = getComputedStyle(chart.canvas).getPropertyValue(token).trim();
    if (resolved) {
      return resolved;
    }
  }

  const border = usableColor(dataset.borderColor) ?? usableColor(color?.borderColor);
  const background =
    usableColor(dataset.backgroundColor) ?? usableColor(color?.backgroundColor);
  return border ?? background ?? TOOLTIP_FALLBACKS[index % TOOLTIP_FALLBACKS.length];
}

function usableColor(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const color = value.trim().toLowerCase();
  if (
    !color ||
    color === 'transparent' ||
    color.startsWith('var(') ||
    color === '#fff' ||
    color === '#ffffff' ||
    color === 'white' ||
    color === '#f9f9fb'
  ) {
    return null;
  }

  return value;
}
