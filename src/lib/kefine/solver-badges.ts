/**
 * Ranking helpers for the solver badges shown on each solver card and inside
 * the "Select solver" modal. Like the route picker in a swap UI, the strongest
 * solver earns a "Best" badge while the rest show how far behind they sit on the
 * selected metric (e.g. `-6.7%`). The logic is kept pure so it can be unit
 * tested without rendering any component.
 */
import type { SolutionMetric } from './solutions-data';
import { efficiencyValue } from './solver-charts';

/** Metrics a solver list can be ranked by. */
export type SolverRankingMetric = 'efficiency' | 'success' | 'price' | 'speed';

/** Stable order of the selectable ranking metrics, used to render selectors. */
export const solverRankingMetrics: readonly SolverRankingMetric[] = [
  'efficiency',
  'success',
  'price',
  'speed'
] as const;

/** Whether a higher or lower raw value is better for each ranking metric. */
const RANKING_DIRECTION: Record<SolverRankingMetric, 'higher' | 'lower'> = {
  efficiency: 'higher',
  success: 'higher',
  price: 'lower',
  speed: 'lower'
};

/** Raw comparable value for a solver under a given ranking metric. */
export function solverMetricValue(metric: SolutionMetric, ranking: SolverRankingMetric): number {
  switch (ranking) {
    case 'efficiency':
      return efficiencyValue(metric);
    case 'success':
      return metric.successRate;
    case 'price':
      return metric.priceUsd;
    case 'speed':
      return metric.executionTimeSec;
  }
}

export type SolverBadge = {
  solverId: string;
  /** 1-based position after sorting by the ranking metric (1 = best). */
  rank: number;
  /** True for the best solver(s); ties at the top all count as best. */
  isBest: boolean;
  /**
   * Signed relative difference versus the best solver on the ranking metric.
   * Always `<= 0`: `0` for the best, negative for weaker solvers. `null` when
   * the difference can't be expressed as a ratio because the best value is `0`
   * (e.g. ranking by price when a free solver is present).
   */
  delta: number | null;
  /** The raw metric value used for ranking. */
  value: number;
};

const EPSILON = 1e-9;

/**
 * Rank a list of solver metrics, returning one badge per solver in the same
 * order as the input. The best solver(s) get `isBest: true`; everyone else gets
 * a negative `delta` describing how far behind they are on `ranking`.
 */
export function rankSolvers(
  metrics: SolutionMetric[],
  ranking: SolverRankingMetric = 'success'
): SolverBadge[] {
  if (metrics.length === 0) return [];

  const direction = RANKING_DIRECTION[ranking];
  const entries = metrics.map((metric, index) => ({
    index,
    solverId: metric.solverId,
    value: solverMetricValue(metric, ranking)
  }));

  // Best is the maximum for higher-is-better metrics, the minimum otherwise.
  const bestValue = entries.reduce(
    (best, entry) => (direction === 'higher' ? Math.max(best, entry.value) : Math.min(best, entry.value)),
    direction === 'higher' ? -Infinity : Infinity
  );

  // Order by "betterness" to assign ranks; keep input order on ties for a
  // deterministic, stable result.
  const ordered = [...entries].sort((a, b) => {
    const diff = direction === 'higher' ? b.value - a.value : a.value - b.value;
    if (Math.abs(diff) > EPSILON) return diff;
    return a.index - b.index;
  });
  const rankByIndex = new Map<number, number>();
  ordered.forEach((entry, position) => rankByIndex.set(entry.index, position + 1));

  return entries.map((entry) => {
    const isBest = Math.abs(entry.value - bestValue) <= EPSILON;
    let delta: number | null;
    if (isBest) {
      delta = 0;
    } else if (Math.abs(bestValue) <= EPSILON) {
      // No meaningful percentage relative to a zero best (e.g. a free solver).
      delta = null;
    } else if (direction === 'higher') {
      delta = (entry.value - bestValue) / bestValue;
    } else {
      delta = (bestValue - entry.value) / bestValue;
    }

    return {
      solverId: entry.solverId,
      rank: rankByIndex.get(entry.index) ?? 1,
      isBest,
      delta,
      value: entry.value
    };
  });
}

/** Look up the badge for a single solver id within a ranked set. */
export function badgeForSolver(badges: SolverBadge[], solverId: string): SolverBadge | undefined {
  return badges.find((badge) => badge.solverId === solverId);
}

/**
 * Format a badge delta as a short signed percentage, e.g. `-6.7%`. The decimal
 * precision shrinks as the gap grows so small, swap-style gaps stay readable
 * (`-0.25%`) while large ones stay compact (`-78%`). Returns an empty string
 * for an unrepresentable delta (`null`), so callers can fall back to the
 * dedicated "Best" label.
 */
export function formatSolverDelta(delta: number | null): string {
  if (delta === null) return '';
  const percent = delta * 100;
  const magnitude = Math.abs(percent);
  if (magnitude <= EPSILON) return '0%';
  const decimals = magnitude >= 10 ? 0 : magnitude >= 1 ? 1 : 2;
  return `${percent.toFixed(decimals)}%`;
}
