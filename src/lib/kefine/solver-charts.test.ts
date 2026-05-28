import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import {
  efficiencyValue,
  efficiencySeries,
  timeSeries,
  priceSeries,
  successRateSeries
} from './solver-charts';
import type { SolutionMetric } from './solutions-data';

const sample: SolutionMetric[] = [
  { solverId: '1', solver: 'A', executionTimeSec: 12, priceUsd: 0.5, successRate: 80 },
  { solverId: '2', solver: 'B', executionTimeSec: 8, priceUsd: 1.0, successRate: 90 },
  { solverId: '3', solver: 'C', executionTimeSec: 4, priceUsd: 0, successRate: 70 }
];

describe('solver-charts efficiencyValue', () => {
  test('returns success per dollar when price > 0', () => {
    assert.equal(efficiencyValue(sample[0]), 80 / 0.5);
    assert.equal(efficiencyValue(sample[1]), 90 / 1.0);
  });

  test('falls back to successRate when price is zero', () => {
    assert.equal(efficiencyValue(sample[2]), 70);
  });
});

describe('solver-charts series builders', () => {
  test('timeSeries marks the active solver index', () => {
    const series = timeSeries(sample, '2');
    assert.equal(series.activeIndex, 1);
    assert.deepEqual(series.values, [12, 8, 4]);
    assert.ok(series.max > 12);
  });

  test('priceSeries falls back to a positive max even when all prices are zero', () => {
    const zeros: SolutionMetric[] = sample.map((m) => ({ ...m, priceUsd: 0 }));
    const series = priceSeries(zeros, zeros[0].solverId);
    assert.ok(series.max > 0);
  });

  test('successRateSeries always uses a 100 ceiling', () => {
    const series = successRateSeries(sample, '1');
    assert.equal(series.max, 100);
  });

  test('efficiencySeries produces one value per metric', () => {
    const series = efficiencySeries(sample, '1');
    assert.equal(series.values.length, sample.length);
    assert.equal(series.activeIndex, 0);
  });
});
