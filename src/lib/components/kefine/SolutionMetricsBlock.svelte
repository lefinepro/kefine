<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions-data';
  import { defaultChartSize, timeSeries, weightSeries } from '$lib/kefine/solver-charts';
  import SolutionChartCard from './SolutionChartCard.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  let {
    metrics,
    activeSolverId,
    title = 'Solver metrics',
    subtitle = 'Hardcoded execution time & solution weight per solver'
  }: {
    metrics: SolutionMetric[];
    activeSolverId: string;
    title?: string;
    subtitle?: string;
  } = $props();

  const time = $derived(timeSeries(metrics, activeSolverId));
  const weight = $derived(weightSeries(metrics, activeSolverId));

  const localeText = $derived($kefineLocaleText);
</script>

<lef-metrics-block aria-label={localeText.solversView.metricsAria}>
  <lef-metrics-head>
    <strong>{title}</strong>
    <lefine-text>{subtitle}</lefine-text>
  </lef-metrics-head>

  <lef-metrics-grid>
    <SolutionChartCard
      title={localeText.solversView.chartExecutionTime}
      unit={localeText.solversView.chartSeconds}
      series={time}
      metrics={metrics}
      size={defaultChartSize}
      variant="primary"
      valueFormatter={(v) => `${v.toFixed(1)}s`}
      seriesValue={(m) => m.executionTimeSec}
    />

    <SolutionChartCard
      title={localeText.solversView.chartSolutionWeight}
      unit={localeText.solversView.chartKilobytes}
      series={weight}
      metrics={metrics}
      size={defaultChartSize}
      variant="alt"
      valueFormatter={(v) => `${v.toFixed(1)}kb`}
      seriesValue={(m) => m.solutionWeightKb}
    />
  </lef-metrics-grid>
</lef-metrics-block>

<style>
  lef-metrics-block {
    display: block;
    margin-top: 1rem;
    padding: 1rem 1.1rem 1.15rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
  }

  lef-metrics-head {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    margin-bottom: 0.85rem;
  }

  lef-metrics-head strong {
    font-size: 0.95rem;
    color: var(--lefine-text);
    font-weight: 700;
  }

  lef-metrics-head lefine-text {
    display: block;
    font-size: 0.78rem;
    color: var(--lefine-text-soft);
  }

  lef-metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 0.85rem;
  }
</style>
