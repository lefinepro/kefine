<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions-data';
  import { compactChartSize, timeSeries, weightSeries } from '$lib/kefine/solver-charts';
  import SolutionChartCard from './SolutionChartCard.svelte';

  let {
    metrics,
    activeSolverId
  }: {
    metrics: SolutionMetric[];
    activeSolverId: string;
  } = $props();

  const time = $derived(timeSeries(metrics, activeSolverId));
  const weight = $derived(weightSeries(metrics, activeSolverId));
</script>

<lef-metrics-mini aria-label="Solver metrics">
  <lef-metrics-mini-head>
    <strong>Metrics</strong>
    <lefine-text>Time &amp; weight per solver</lefine-text>
  </lef-metrics-mini-head>

  <SolutionChartCard
    title="Execution time"
    unit="seconds"
    series={time}
    metrics={metrics}
    size={compactChartSize}
    variant="primary"
    valueFormatter={(v) => `${v.toFixed(1)}s`}
    seriesValue={(m) => m.executionTimeSec}
  />

  <SolutionChartCard
    title="Solution weight"
    unit="kilobytes"
    series={weight}
    metrics={metrics}
    size={compactChartSize}
    variant="alt"
    valueFormatter={(v) => `${v.toFixed(1)}kb`}
    seriesValue={(m) => m.solutionWeightKb}
  />
</lef-metrics-mini>

<style>
  lef-metrics-mini {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem 0.9rem 0.95rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
  }

  lef-metrics-mini-head {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    margin-bottom: 0.15rem;
  }

  lef-metrics-mini-head strong {
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--lefine-text);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  lef-metrics-mini-head lefine-text {
    display: block;
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
  }
</style>
