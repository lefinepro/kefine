import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
  badgeForSolver,
  formatSolverDelta,
  rankSolvers,
  solverMetricValue,
  solverRankingMetrics
} from '../solver-badges';
import type { SolutionMetric } from '../solutions-data';

const sample: SolutionMetric[] = [
  { solverId: '1', solver: 'A', executionTimeSec: 12, priceUsd: 0.5, successRate: 80 },
  { solverId: '2', solver: 'B', executionTimeSec: 8, priceUsd: 1.0, successRate: 90 },
  { solverId: '3', solver: 'C', executionTimeSec: 4, priceUsd: 2.0, successRate: 70 }
];

describe('solver-badges solverMetricValue', () => {
  test('reads the raw value for each ranking metric', () => {
    assert.equal(solverMetricValue(sample[0], 'success'), 80);
    assert.equal(solverMetricValue(sample[0], 'price'), 0.5);
    assert.equal(solverMetricValue(sample[0], 'speed'), 12);
    assert.equal(solverMetricValue(sample[0], 'efficiency'), 80 / 0.5);
  });

  test('exposes a stable list of selectable metrics', () => {
    assert.deepEqual([...solverRankingMetrics], ['efficiency', 'success', 'price', 'speed']);
  });
});

describe('solver-badges rankSolvers (higher is better)', () => {
  test('marks the highest success rate as best with non-positive deltas', () => {
    const badges = rankSolvers(sample, 'success');
    const byId = Object.fromEntries(badges.map((b) => [b.solverId, b]));

    assert.equal(byId['2'].isBest, true);
    assert.equal(byId['2'].rank, 1);
    assert.equal(byId['2'].delta, 0);

    assert.equal(byId['1'].isBest, false);
    assert.equal(byId['1'].rank, 2);
    assert.ok(Math.abs((byId['1'].delta ?? 0) - (80 - 90) / 90) < 1e-9);

    assert.equal(byId['3'].rank, 3);
    assert.ok((byId['3'].delta ?? 0) < (byId['1'].delta ?? 0));
  });

  test('ranks efficiency (value per dollar) by the cheapest strong solver', () => {
    const badges = rankSolvers(sample, 'efficiency');
    const best = badges.find((b) => b.isBest);
    assert.equal(best?.solverId, '1');
    assert.ok(badges.every((b) => (b.delta ?? 0) <= 0));
  });

  test('returns one badge per solver in input order', () => {
    const badges = rankSolvers(sample, 'success');
    assert.deepEqual(badges.map((b) => b.solverId), ['1', '2', '3']);
  });
});

describe('solver-badges rankSolvers (lower is better)', () => {
  test('marks the cheapest solver as best when ranking by price', () => {
    const badges = rankSolvers(sample, 'price');
    const byId = Object.fromEntries(badges.map((b) => [b.solverId, b]));
    assert.equal(byId['1'].isBest, true);
    assert.equal(byId['2'].delta, (0.5 - 1.0) / 0.5);
    assert.equal(byId['3'].delta, (0.5 - 2.0) / 0.5);
  });

  test('marks the fastest solver as best when ranking by speed', () => {
    const badges = rankSolvers(sample, 'speed');
    const best = badges.find((b) => b.isBest);
    assert.equal(best?.solverId, '3');
  });
});

describe('solver-badges edge cases', () => {
  test('returns an empty list for no metrics', () => {
    assert.deepEqual(rankSolvers([], 'success'), []);
  });

  test('treats ties at the top as multiple best solvers', () => {
    const ties: SolutionMetric[] = [
      { solverId: 'a', solver: 'A', executionTimeSec: 1, priceUsd: 1, successRate: 90 },
      { solverId: 'b', solver: 'B', executionTimeSec: 1, priceUsd: 1, successRate: 90 },
      { solverId: 'c', solver: 'C', executionTimeSec: 1, priceUsd: 1, successRate: 80 }
    ];
    const badges = rankSolvers(ties, 'success');
    const byId = Object.fromEntries(badges.map((b) => [b.solverId, b]));
    assert.equal(byId['a'].isBest, true);
    assert.equal(byId['b'].isBest, true);
    assert.equal(byId['a'].rank, 1);
    assert.equal(byId['b'].rank, 2);
    assert.equal(byId['c'].isBest, false);
  });

  test('uses a null delta when the best value is zero (free solver by price)', () => {
    const free: SolutionMetric[] = [
      { solverId: 'x', solver: 'X', executionTimeSec: 1, priceUsd: 0, successRate: 70 },
      { solverId: 'y', solver: 'Y', executionTimeSec: 1, priceUsd: 0.5, successRate: 90 }
    ];
    const badges = rankSolvers(free, 'price');
    const byId = Object.fromEntries(badges.map((b) => [b.solverId, b]));
    assert.equal(byId['x'].isBest, true);
    assert.equal(byId['x'].delta, 0);
    assert.equal(byId['y'].delta, null);
  });
});

describe('solver-badges formatSolverDelta', () => {
  test('shrinks precision as the gap grows', () => {
    assert.equal(formatSolverDelta(-0.1111), '-11%');
    assert.equal(formatSolverDelta(-0.0667), '-6.7%');
    assert.equal(formatSolverDelta(-0.0025), '-0.25%');
  });

  test('renders the best solver gap as zero and null as empty', () => {
    assert.equal(formatSolverDelta(0), '0%');
    assert.equal(formatSolverDelta(null), '');
  });
});

describe('solver-badges badgeForSolver', () => {
  test('finds the badge for a solver id', () => {
    const badges = rankSolvers(sample, 'success');
    assert.equal(badgeForSolver(badges, '2')?.isBest, true);
    assert.equal(badgeForSolver(badges, 'missing'), undefined);
  });
});
