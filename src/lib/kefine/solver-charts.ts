import type { SolutionMetric } from './solutions-data';

export type ChartPoint = {
  label: string;
  value: number;
  x: number;
  y: number;
  barX: number;
  isActive: boolean;
};

export type ChartLayout = {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
  innerWidth: number;
  innerHeight: number;
  barWidth: number;
  points: ChartPoint[];
};

export type ChartTick = { value: number; y: number };

export type ChartSize = {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
};

export const defaultChartSize: ChartSize = {
  width: 320,
  height: 160,
  padding: { top: 18, right: 14, bottom: 28, left: 32 }
};

export const compactChartSize: ChartSize = {
  width: 280,
  height: 130,
  padding: { top: 14, right: 10, bottom: 24, left: 28 }
};

export function buildChart(
  values: number[],
  labels: string[],
  maxValue: number,
  activeIndex: number,
  size: ChartSize
): ChartLayout {
  const innerWidth = size.width - size.padding.left - size.padding.right;
  const innerHeight = size.height - size.padding.top - size.padding.bottom;
  const slot = values.length > 0 ? innerWidth / values.length : innerWidth;
  const barWidth = Math.max(14, slot * 0.5);
  const points: ChartPoint[] = values.map((value, index) => {
    const ratio = maxValue === 0 ? 0 : value / maxValue;
    const x = size.padding.left + slot * index + slot / 2;
    const y = size.padding.top + innerHeight - ratio * innerHeight;
    return {
      label: labels[index] ?? '',
      value,
      x,
      y,
      barX: x - barWidth / 2,
      isActive: index === activeIndex
    };
  });
  return {
    width: size.width,
    height: size.height,
    padding: size.padding,
    innerWidth,
    innerHeight,
    barWidth,
    points
  };
}

export function makeLinePath(points: ChartPoint[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

export function buildYTicks(maxValue: number, size: ChartSize, tickCount = 4): ChartTick[] {
  const innerHeight = size.height - size.padding.top - size.padding.bottom;
  const ticks: ChartTick[] = [];
  for (let i = 0; i <= tickCount; i += 1) {
    const ratio = i / tickCount;
    ticks.push({ value: maxValue * ratio, y: size.padding.top + innerHeight - ratio * innerHeight });
  }
  return ticks;
}

export type SolverChartSeries = {
  values: number[];
  labels: string[];
  max: number;
  activeIndex: number;
};

export function timeSeries(metrics: SolutionMetric[], activeSolverId: string): SolverChartSeries {
  const values = metrics.map((m) => m.executionTimeSec);
  return {
    values,
    labels: metrics.map((m) => `#${m.solverId}`),
    max: Math.max(...values, 1) * 1.15,
    activeIndex: metrics.findIndex((m) => m.solverId === activeSolverId)
  };
}

export function weightSeries(metrics: SolutionMetric[], activeSolverId: string): SolverChartSeries {
  const values = metrics.map((m) => m.solutionWeightKb);
  return {
    values,
    labels: metrics.map((m) => `#${m.solverId}`),
    max: Math.max(...values, 1) * 1.15,
    activeIndex: metrics.findIndex((m) => m.solverId === activeSolverId)
  };
}
