<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions-data';
  import {
    defaultChartSize,
    timeSeries,
    priceSeries,
    successRateSeries,
    efficiencySeries,
    efficiencyValue
  } from '$lib/kefine/solver-charts';
  import SolutionChartCard from './SolutionChartCard.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  let {
    metrics,
    activeSolverId,
    title = 'Solver metrics',
    subtitle = 'Execution time, price & success rate per solver'
  }: {
    metrics: SolutionMetric[];
    activeSolverId: string;
    title?: string;
    subtitle?: string;
  } = $props();

  const time = $derived(timeSeries(metrics, activeSolverId));
  const price = $derived(priceSeries(metrics, activeSolverId));
  const success = $derived(successRateSeries(metrics, activeSolverId));
  const efficiency = $derived(efficiencySeries(metrics, activeSolverId));

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
      title={localeText.solversView.chartPrice}
      unit={localeText.solversView.chartUsd}
      series={price}
      metrics={metrics}
      size={defaultChartSize}
      variant="alt"
      valueFormatter={(v) => `$${v.toFixed(2)}`}
      seriesValue={(m) => m.priceUsd}
    />

    <SolutionChartCard
      title={localeText.solversView.chartSuccessRate}
      unit={localeText.solversView.chartPercent}
      series={success}
      metrics={metrics}
      size={defaultChartSize}
      variant="primary"
      valueFormatter={(v) => `${v.toFixed(0)}%`}
      seriesValue={(m) => m.successRate}
    />

    <SolutionChartCard
      title={localeText.solversView.chartEfficiency}
      unit={localeText.solversView.chartEfficiencyUnit}
      series={efficiency}
      metrics={metrics}
      size={defaultChartSize}
      variant="alt"
      valueFormatter={(v) => v.toFixed(0)}
      seriesValue={(m) => efficiencyValue(m)}
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
