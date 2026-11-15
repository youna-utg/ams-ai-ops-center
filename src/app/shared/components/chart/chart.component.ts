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

  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
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
    this.chart?.destroy();
  }

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
        ...this.resolveCssVariables(this.options),
      },
    });
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
