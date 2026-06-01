<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions-data';
  import {
    buildChart,
    buildYTicks,
    makeLinePath,
    type ChartSize,
    type SolverChartSeries
  } from '$lib/kefine/solver-charts';

  let {
    title,
    unit,
    series,
    metrics,
    valueFormatter,
    seriesValue,
    size,
    variant = 'primary'
  }: {
    title: string;
    unit: string;
    series: SolverChartSeries;
    metrics: SolutionMetric[];
    valueFormatter: (value: number) => string;
    seriesValue: (m: SolutionMetric) => number;
    size: ChartSize;
    variant?: 'primary' | 'alt';
  } = $props();

  const layout = $derived(buildChart(series.values, series.labels, series.max, series.activeIndex, size));
  const ticks = $derived(buildYTicks(series.max, size));
  const path = $derived(makeLinePath(layout.points));
</script>

<lef-chart-card aria-label={title} data-variant={variant}>
  <lef-chart-head>
    <lefine-text>{title}</lefine-text>
    <lef-chart-unit>{unit}</lef-chart-unit>
  </lef-chart-head>

  <svg viewBox="0 0 {layout.width} {layout.height}" role="img" aria-label="{title} chart" class="lef-chart-svg">
    <g class="lef-chart-grid">
      {#each ticks as tick (tick.y)}
        <line x1={layout.padding.left} x2={layout.width - layout.padding.right} y1={tick.y} y2={tick.y} />
        <text x={layout.padding.left - 6} y={tick.y + 3} text-anchor="end">{tick.value.toFixed(1)}</text>
      {/each}
    </g>
    <g class="lef-chart-bars">
      {#each layout.points as point, i (point.label)}
        <rect
          x={point.barX}
          y={point.y}
          width={layout.barWidth}
          height={layout.height - layout.padding.bottom - point.y}
          rx="3"
          ry="3"
          class="lef-chart-bar"
          class:lef-chart-bar--active={point.isActive}
          style="transform-origin: {point.x}px {layout.height - layout.padding.bottom}px; animation-delay: {i * 90}ms;"
        />
      {/each}
    </g>
    <path d={path} class="lef-chart-line" />
    <g class="lef-chart-dots">
      {#each layout.points as point (point.label)}
        <circle
          cx={point.x}
          cy={point.y}
          r={point.isActive ? 4.5 : 3}
          class="lef-chart-dot"
          class:lef-chart-dot--active={point.isActive}
        />
      {/each}
    </g>
    <g class="lef-chart-axis">
      {#each layout.points as point (point.label)}
        <text x={point.x} y={layout.height - layout.padding.bottom + 16} text-anchor="middle">{point.label}</text>
      {/each}
    </g>
  </svg>

  <lef-chart-legend>
    {#each metrics as m, i (m.solverId)}
      <lef-chart-legend-item class:lef-chart-legend-item--active={i === series.activeIndex}>
        <lef-chart-legend-dot></lef-chart-legend-dot>
        <lefine-text>#{m.solverId} {m.solver}</lefine-text>
        <lef-chart-legend-value>{valueFormatter(seriesValue(m))}</lef-chart-legend-value>
      </lef-chart-legend-item>
    {/each}
  </lef-chart-legend>
</lef-chart-card>

<style>
  lef-chart-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 0.85rem 0.95rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 50%, var(--kef-bg-card));
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.25rem;
    --chart-accent: var(--kef-color-primary, #3a7afe);
  }

  lef-chart-card[data-variant='alt'] {
    --chart-accent: #14b8a6;
  }

  lef-chart-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-chart-head lefine-text {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--lefine-text);
  }

  lef-chart-unit {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--lefine-text-soft);
  }

  .lef-chart-svg {
    display: block;
    width: 100%;
    height: auto;
    max-height: 200px;
  }

  .lef-chart-grid line {
    stroke: var(--kef-line-soft);
    stroke-width: 1;
    stroke-dasharray: 2 3;
    opacity: 0.8;
  }

  .lef-chart-grid text,
  .lef-chart-axis text {
    font-size: 9px;
    fill: var(--lefine-text-soft);
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
  }

  .lef-chart-bar {
    fill: color-mix(in oklab, var(--chart-accent) 28%, transparent);
    transition: fill 200ms ease;
    transform-box: fill-box;
    animation: lef-chart-bar-grow 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .lef-chart-bar--active {
    fill: color-mix(in oklab, var(--chart-accent) 70%, transparent);
  }

  @keyframes lef-chart-bar-grow {
    0% {
      transform: scaleY(0);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    100% {
      transform: scaleY(1);
      opacity: 1;
    }
  }

  .lef-chart-line {
    fill: none;
    stroke: var(--chart-accent);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    animation: lef-chart-fade-in 600ms ease-out 480ms both;
  }

  .lef-chart-dot {
    fill: var(--chart-accent);
    stroke: var(--kef-bg-card);
    stroke-width: 1.5;
    animation: lef-chart-fade-in 360ms ease-out 720ms both;
  }

  @keyframes lef-chart-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @media (prefers-reduced-motion: reduce) {
    .lef-chart-bar,
    .lef-chart-line,
    .lef-chart-dot {
      animation: none;
    }
  }

  .lef-chart-dot--active {
    stroke-width: 2.5;
  }

  lef-chart-legend {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: 0.4rem;
    font-size: 0.75rem;
  }

  lef-chart-legend-item {
    display: grid;
    grid-template-columns: 0.65rem 1fr auto;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0.35rem;
    border-radius: 0.2rem;
    color: var(--lefine-text-soft);
  }

  lef-chart-legend-item.lef-chart-legend-item--active {
    background: color-mix(in oklab, var(--chart-accent) 10%, transparent);
    color: var(--lefine-text);
    font-weight: 600;
  }

  lef-chart-legend-dot {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: var(--chart-accent);
  }

  lef-chart-legend-value {
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.72rem;
  }
</style>
