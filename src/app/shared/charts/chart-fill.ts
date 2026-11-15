import { Chart, Plugin, ScriptableContext } from 'chart.js';

function tokenColor(chart: Chart, token: string, fallback: string): string {
  const value = getComputedStyle(chart.canvas).getPropertyValue(token).trim();
  return value || fallback;
}

function channelsOf(color: string): [number, number, number] | null {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const value = Number.parseInt(hex[1], 16);
    return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  }

  const channels = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (channels) {
    return [Number(channels[1]), Number(channels[2]), Number(channels[3])];
  }

  return null;
}

function withAlpha(color: string, alpha: number): string {
  const hex = color.trim().match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const value = Number.parseInt(hex[1], 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const channels = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (channels) {
    return `rgba(${channels[1]}, ${channels[2]}, ${channels[3]}, ${alpha})`;
  }

  return color;
}

function lighter(color: string, amount: number): string {
  const channels = channelsOf(color);
  if (!channels) {
    return color;
  }

  const mix = (channel: number) =>
    Math.round(channel + (255 - channel) * amount);
  return `rgb(${mix(channels[0])}, ${mix(channels[1])}, ${mix(channels[2])})`;
}

export function areaFade(token: string, fallback: string) {
  return (context: ScriptableContext<'line'>) => {
    const { chart } = context;
    const { chartArea, ctx } = chart;
    const color = tokenColor(chart, token, fallback);
    if (!chartArea) {
      return withAlpha(color, 0.28);
    }

    const gradient = ctx.createLinearGradient(
      0,
      chartArea.top,
      0,
      chartArea.bottom,
    );
    gradient.addColorStop(0, withAlpha(color, 0.42));
    gradient.addColorStop(0.72, withAlpha(color, 0.08));
    gradient.addColorStop(1, withAlpha(color, 0));
    return gradient;
  };
}

type BarShape = {
  x: number;
  y: number;
  base: number;
  options?: { backgroundColor?: unknown };
};

export const barGradientPlugin: Plugin = {
  id: 'barGradient',
  beforeDatasetDraw(chart, args) {
    const dataset = chart.data.datasets[args.index] as {
      gradientTokens?: string[];
    };
    const tokens = dataset.gradientTokens;
    if (!tokens?.length) {
      return;
    }

    const horizontal = chart.options.indexAxis === 'y';
    chart.getDatasetMeta(args.index).data.forEach((element, index) => {
      const bar = element as unknown as BarShape;
      if (!bar.options) {
        return;
      }

      const span = horizontal
        ? Math.abs(bar.x - bar.base)
        : Math.abs(bar.y - bar.base);
      if (!Number.isFinite(span) || span < 1) {
        return;
      }

      const color = tokenColor(
        chart,
        tokens[index % tokens.length],
        '#2f9aff',
      );
      const startX = horizontal ? Math.max(bar.x, bar.base) : bar.x;
      const startY = horizontal ? bar.y : Math.min(bar.y, bar.base);
      const endX = horizontal ? Math.min(bar.x, bar.base) : bar.x;
      const endY = horizontal ? bar.y : Math.max(bar.y, bar.base);
      const gradient = chart.ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, lighter(color, 0.62));
      bar.options = { ...bar.options, backgroundColor: gradient };
    });
  },
};
