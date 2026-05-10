<script lang="ts">
  import type { SolutionMetric } from '$lib/kefine/solutions-data';

  let {
    metrics,
    activeSolverId
  }: {
    metrics: SolutionMetric[];
    activeSolverId: string;
  } = $props();

  const chartWidth = 320;
  const chartHeight = 160;
  const padding = { top: 18, right: 14, bottom: 28, left: 32 };

  type ChartPoint = {
    label: string;
    value: number;
    x: number;
    y: number;
    barX: number;
    isActive: boolean;
  };

  function buildChart(values: number[], labels: string[], maxValue: number, activeIndex: number): {
    points: ChartPoint[];
    barWidth: number;
    innerWidth: number;
    innerHeight: number;
  } {
    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const slot = innerWidth / values.length;
    const barWidth = Math.max(18, slot * 0.5);
    const points: ChartPoint[] = values.map((value, index) => {
      const ratio = maxValue === 0 ? 0 : value / maxValue;
      const x = padding.left + slot * index + slot / 2;
      const y = padding.top + innerHeight - ratio * innerHeight;
      const barX = x - barWidth / 2;
      return {
        label: labels[index] ?? '',
        value,
        x,
        y,
        barX,
        isActive: index === activeIndex
      };
    });
    return { points, barWidth, innerWidth, innerHeight };
  }

  const labels = $derived(metrics.map((m) => `#${m.solverId}`));
  const activeIndex = $derived(metrics.findIndex((m) => m.solverId === activeSolverId));

  const timeValues = $derived(metrics.map((m) => m.executionTimeSec));
  const timeMax = $derived(Math.max(...timeValues, 1) * 1.15);
  const timeChart = $derived(buildChart(timeValues, labels, timeMax, activeIndex));

  const weightValues = $derived(metrics.map((m) => m.solutionWeightKb));
  const weightMax = $derived(Math.max(...weightValues, 1) * 1.15);
  const weightChart = $derived(buildChart(weightValues, labels, weightMax, activeIndex));

  function makeLinePath(points: ChartPoint[]): string {
    if (points.length === 0) return '';
    const segments = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`);
    return segments.join(' ');
  }

  function buildYTicks(maxValue: number): Array<{ value: number; y: number }> {
    const innerHeight = chartHeight - padding.top - padding.bottom;
    const tickCount = 4;
    const ticks: Array<{ value: number; y: number }> = [];
    for (let i = 0; i <= tickCount; i += 1) {
      const ratio = i / tickCount;
      const value = maxValue * ratio;
      const y = padding.top + innerHeight - ratio * innerHeight;
      ticks.push({ value, y });
    }
    return ticks;
  }

  const timeTicks = $derived(buildYTicks(timeMax));
  const weightTicks = $derived(buildYTicks(weightMax));
  const timePath = $derived(makeLinePath(timeChart.points));
  const weightPath = $derived(makeLinePath(weightChart.points));
</script>

<lef-metrics-block aria-label="Solver metrics">
  <lef-metrics-head>
    <strong>Solver metrics</strong>
    <lefine-text>Hardcoded execution time &amp; solution weight per solver</lefine-text>
  </lef-metrics-head>

  <lef-metrics-grid>
    <lef-chart-card aria-label="Execution time per solver task">
      <lef-chart-head>
        <lefine-text>Execution time</lefine-text>
        <lef-chart-unit>seconds</lef-chart-unit>
      </lef-chart-head>

      <svg viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Execution time chart" class="lef-chart-svg">
        <g class="lef-chart-grid">
          {#each timeTicks as tick (tick.y)}
            <line x1={padding.left} x2={chartWidth - padding.right} y1={tick.y} y2={tick.y} />
            <text x={padding.left - 6} y={tick.y + 3} text-anchor="end">{tick.value.toFixed(1)}</text>
          {/each}
        </g>
        <g class="lef-chart-bars">
          {#each timeChart.points as point (point.label)}
            <rect
              x={point.barX}
              y={point.y}
              width={timeChart.barWidth}
              height={chartHeight - padding.bottom - point.y}
              rx="3"
              ry="3"
              class="lef-chart-bar"
              class:lef-chart-bar--active={point.isActive}
            />
          {/each}
        </g>
        <path d={timePath} class="lef-chart-line" />
        <g class="lef-chart-dots">
          {#each timeChart.points as point (point.label)}
            <circle cx={point.x} cy={point.y} r={point.isActive ? 4.5 : 3} class="lef-chart-dot" class:lef-chart-dot--active={point.isActive} />
          {/each}
        </g>
        <g class="lef-chart-axis">
          {#each timeChart.points as point (point.label)}
            <text x={point.x} y={chartHeight - padding.bottom + 16} text-anchor="middle">{point.label}</text>
          {/each}
        </g>
      </svg>

      <lef-chart-legend>
        {#each metrics as m, i (m.solverId)}
          <lef-chart-legend-item class:lef-chart-legend-item--active={i === activeIndex}>
            <lef-chart-legend-dot></lef-chart-legend-dot>
            <lefine-text>#{m.solverId} {m.solver}</lefine-text>
            <lef-chart-legend-value>{m.executionTimeSec.toFixed(1)}s</lef-chart-legend-value>
          </lef-chart-legend-item>
        {/each}
      </lef-chart-legend>
    </lef-chart-card>

    <lef-chart-card aria-label="Solution weight per solver task">
      <lef-chart-head>
        <lefine-text>Solution weight</lefine-text>
        <lef-chart-unit>kilobytes</lef-chart-unit>
      </lef-chart-head>

      <svg viewBox="0 0 {chartWidth} {chartHeight}" role="img" aria-label="Solution weight chart" class="lef-chart-svg">
        <g class="lef-chart-grid">
          {#each weightTicks as tick (tick.y)}
            <line x1={padding.left} x2={chartWidth - padding.right} y1={tick.y} y2={tick.y} />
            <text x={padding.left - 6} y={tick.y + 3} text-anchor="end">{tick.value.toFixed(1)}</text>
          {/each}
        </g>
        <g class="lef-chart-bars">
          {#each weightChart.points as point (point.label)}
            <rect
              x={point.barX}
              y={point.y}
              width={weightChart.barWidth}
              height={chartHeight - padding.bottom - point.y}
              rx="3"
              ry="3"
              class="lef-chart-bar lef-chart-bar--alt"
              class:lef-chart-bar--active={point.isActive}
            />
          {/each}
        </g>
        <path d={weightPath} class="lef-chart-line lef-chart-line--alt" />
        <g class="lef-chart-dots">
          {#each weightChart.points as point (point.label)}
            <circle cx={point.x} cy={point.y} r={point.isActive ? 4.5 : 3} class="lef-chart-dot lef-chart-dot--alt" class:lef-chart-dot--active={point.isActive} />
          {/each}
        </g>
        <g class="lef-chart-axis">
          {#each weightChart.points as point (point.label)}
            <text x={point.x} y={chartHeight - padding.bottom + 16} text-anchor="middle">{point.label}</text>
          {/each}
        </g>
      </svg>

      <lef-chart-legend>
        {#each metrics as m, i (m.solverId)}
          <lef-chart-legend-item class:lef-chart-legend-item--active={i === activeIndex}>
            <lef-chart-legend-dot class="lef-chart-legend-dot--alt"></lef-chart-legend-dot>
            <lefine-text>#{m.solverId} {m.solver}</lefine-text>
            <lef-chart-legend-value>{m.solutionWeightKb.toFixed(1)}kb</lef-chart-legend-value>
          </lef-chart-legend-item>
        {/each}
      </lef-chart-legend>
    </lef-chart-card>
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

  lef-chart-card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.85rem 0.85rem 0.95rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 50%, var(--kef-bg-card));
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.6rem;
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
    fill: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 28%, transparent);
    transition: fill 200ms ease;
  }

  .lef-chart-bar--alt {
    fill: color-mix(in oklab, #14b8a6 26%, transparent);
  }

  .lef-chart-bar--active {
    fill: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 70%, transparent);
  }

  .lef-chart-bar--alt.lef-chart-bar--active {
    fill: color-mix(in oklab, #14b8a6 70%, transparent);
  }

  .lef-chart-line {
    fill: none;
    stroke: var(--kef-color-primary, #3a7afe);
    stroke-width: 1.6;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .lef-chart-line--alt {
    stroke: #14b8a6;
  }

  .lef-chart-dot {
    fill: var(--kef-color-primary, #3a7afe);
    stroke: var(--kef-bg-card);
    stroke-width: 1.5;
  }

  .lef-chart-dot--alt {
    fill: #14b8a6;
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
    border-radius: 0.35rem;
    color: var(--lefine-text-soft);
  }

  lef-chart-legend-item.lef-chart-legend-item--active {
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 10%, transparent);
    color: var(--lefine-text);
    font-weight: 600;
  }

  lef-chart-legend-dot {
    display: inline-block;
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    background: var(--kef-color-primary, #3a7afe);
  }

  .lef-chart-legend-dot--alt {
    background: #14b8a6;
  }

  lef-chart-legend-value {
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.72rem;
  }
</style>
