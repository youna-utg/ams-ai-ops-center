import {
  Component,
  OnDestroy,
  effect,
  input,
  signal,
  untracked,
} from '@angular/core';

interface GaugeNotch {
  index: number;
  d: string;
}

const NOTCH_COUNT = 13;
const NOTCHES = buildNotches(NOTCH_COUNT);

@Component({
  selector: 'app-gauge',
  standalone: true,
  templateUrl: './gauge.component.html',
  styleUrl: './gauge.component.scss',
})
export class GaugeComponent implements OnDestroy {
  readonly value = input.required<number>();
  readonly label = input('');

  protected readonly notches = NOTCHES;
  protected readonly shown = signal(0);

  private frame = 0;

  constructor() {
    effect(() => {
      const target = clamp(this.value());
      untracked(() => this.animateTo(target));
    });
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }

  protected notchColor(index: number): string {
    const shown = this.shown();
    const start = (index / NOTCH_COUNT) * 100;
    const end = ((index + 1) / NOTCH_COUNT) * 100;
    const place = index / (NOTCH_COUNT - 1);
    const active = mix('#2F78F6', '#D9ECFF', Math.pow(place, 1.55));
    const inactive = '#F3F5F8';

    if (shown >= end) {
      return active;
    }
    if (shown <= start) {
      return inactive;
    }
    return mix(inactive, active, (shown - start) / (end - start));
  }

  protected formatted(): string {
    return `${this.shown().toFixed(1)}%`;
  }

  private animateTo(target: number): void {
    cancelAnimationFrame(this.frame);
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      this.shown.set(target);
      return;
    }

    const from = this.shown();
    const started = performance.now();
    const duration = 900;
    const step = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      this.shown.set(from + (target - from) * zeroBounce(progress));
      if (progress < 1) {
        this.frame = requestAnimationFrame(step);
      } else {
        this.shown.set(target);
      }
    };
    this.frame = requestAnimationFrame(step);
  }
}

function buildNotches(count: number): GaugeNotch[] {
  const centerX = 160;
  const centerY = 158;
  const inner = 104;
  const outer = 140;
  const step = Math.PI / count;
  const stroke = 14;
  const gap = 4.4 + stroke;
  const notches: GaugeNotch[] = [];

  for (let index = 0; index < count; index += 1) {
    const center = Math.PI - (index + 0.5) * step;
    const outerHalf = (step - gap / outer) / 2;
    const innerHalf = (step - gap / inner) / 2;
    const outerLeft = point(centerX, centerY, outer, center + outerHalf);
    const outerRight = point(centerX, centerY, outer, center - outerHalf);
    const innerRight = point(centerX, centerY, inner, center - innerHalf);
    const innerLeft = point(centerX, centerY, inner, center + innerHalf);
    notches.push({
      index,
      d: `M ${outerLeft} A ${outer} ${outer} 0 0 1 ${outerRight} L ${innerRight} A ${inner} ${inner} 0 0 0 ${innerLeft} Z`,
    });
  }

  return notches;
}

function point(centerX: number, centerY: number, radius: number, angle: number): string {
  return `${round(centerX + Math.cos(angle) * radius)} ${round(centerY - Math.sin(angle) * radius)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function zeroBounce(progress: number): number {
  if (progress >= 1) {
    return 1;
  }
  const distance = progress * 8;
  return 1 - Math.exp(-distance) * (1 + distance);
}

function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function mix(from: string, to: string, amount: number): string {
  const start = channels(from);
  const end = channels(to);
  const mixed = start.map((channel, index) =>
    Math.round(channel + (end[index] - channel) * amount),
  );
  return `rgb(${mixed.join(', ')})`;
}

function channels(color: string): [number, number, number] {
  const rgb = color.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) {
    return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  }
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
