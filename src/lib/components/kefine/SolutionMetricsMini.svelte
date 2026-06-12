<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions/solutions-data';
  import { compactChartSize, timeSeries, priceSeries } from '$lib/kefine/solutions/solver-charts';
  import SolutionChartCard from './SolutionChartCard.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  let {
    metrics,
    activeSolverId,
    project,
    slug
  }: {
    metrics: SolutionMetric[];
    activeSolverId: string;
    project?: string;
    slug?: string;
  } = $props();

  const time = $derived(timeSeries(metrics, activeSolverId));
  const price = $derived(priceSeries(metrics, activeSolverId));

  const localeText = $derived($kefineLocaleText);
</script>

<lef-metrics-mini aria-label={localeText.solversView.metricsAria}>
  <lef-metrics-mini-head>
    <strong>{localeText.solversView.chartMetrics}</strong>
    {#if project || slug}
      <lef-metrics-mini-project aria-label={localeText.solversView.chartProjectAria}>
        {#if project}
          <lef-metrics-mini-project-name>
            <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
              <path d="M2 2.5A1.5 1.5 0 0 1 3.5 1h6.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12c.281.282.439.664.439 1.061V13.5a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 2 13.5v-11Z"></path>
            </svg>
            <lefine-text>{project}</lefine-text>
          </lef-metrics-mini-project-name>
        {/if}
        {#if slug}
          <lef-metrics-mini-slug>
            <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="5" cy="3.5" r="1.5"></circle>
              <circle cx="5" cy="12.5" r="1.5"></circle>
              <circle cx="11.5" cy="8" r="1.5"></circle>
              <path d="M5 5v6"></path>
              <path d="M5 8h3a3 3 0 0 0 3-3"></path>
            </svg>
            <lefine-text>{slug}</lefine-text>
          </lef-metrics-mini-slug>
        {/if}
      </lef-metrics-mini-project>
    {:else}
      <lefine-text>{localeText.solversView.chartFallback}</lefine-text>
    {/if}
  </lef-metrics-mini-head>

  <SolutionChartCard
    title={localeText.solversView.chartExecutionTime}
    unit={localeText.solversView.chartSeconds}
    series={time}
    metrics={metrics}
    size={compactChartSize}
    variant="primary"
    valueFormatter={(v) => `${v.toFixed(1)}s`}
    seriesValue={(m) => m.executionTimeSec}
  />

  <SolutionChartCard
    title={localeText.solversView.chartPrice}
    unit={localeText.solversView.chartUsd}
    series={price}
    metrics={metrics}
    size={compactChartSize}
    variant="alt"
    valueFormatter={(v) => `$${v.toFixed(2)}`}
    seriesValue={(m) => m.priceUsd}
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

  lef-metrics-mini-project {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    margin-top: 0.15rem;
    font-size: 0.72rem;
  }

  lef-metrics-mini-project-name {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--lefine-text-soft);
  }

  lef-metrics-mini-project-name lefine-text {
    font-size: 0.72rem;
    font-weight: 500;
    color: var(--lefine-text-soft);
  }

  lef-metrics-mini-slug {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    color: var(--kef-color-primary, var(--kef-primary));
  }

  lef-metrics-mini-slug lefine-text {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--kef-color-primary, var(--kef-primary));
  }
</style>
