<script lang="ts">
  /**
   * "Compare solvers" modal — the solver-list analogue of a swap route picker.
   * Solvers are ranked by a selectable metric; the leader earns a green "Best"
   * badge while the rest show how far behind they sit (e.g. `-6.7%`). The same
   * metric drives the plots below via the shared `SolutionMetricsBlock`.
   */
  import type { Solution, SolutionMetric } from '$lib/kefine/solutions-data';
  import {
    rankSolvers,
    badgeForSolver,
    solverRankingMetrics,
    type SolverRankingMetric
  } from '$lib/kefine/solver-badges';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';
  import KefineSolverBadge from '$lib/components/kefine/KefineSolverBadge.svelte';
  import SolutionMetricsBlock from '$lib/components/kefine/SolutionMetricsBlock.svelte';
  import { solverAvatarColor, solverInitials } from '$lib/kefine/solver-avatars';

  let {
    open,
    onClose,
    solutions = [],
    metrics = [],
    ranking = $bindable('success'),
    onViewSolution
  }: {
    open: boolean;
    onClose: () => void;
    solutions?: Solution[];
    metrics?: SolutionMetric[];
    ranking?: SolverRankingMetric;
    onViewSolution?: ((id: string) => void) | null | undefined;
  } = $props();

  const localeText = $derived($kefineLocaleText);
  const labels = $derived(localeText.solversView.solversModal);

  const badges = $derived(rankSolvers(metrics, ranking));
  const bestSolverId = $derived(badges.find((badge) => badge.isBest)?.solverId ?? metrics[0]?.solverId ?? '');

  // Join each solution with its rank/badge and order best-first, mirroring the
  // route picker where the recommended route sits on top.
  const rankedRoutes = $derived(
    solutions
      .map((solution) => ({
        solution,
        metric: metrics.find((m) => m.solverId === solution.id),
        badge: badgeForSolver(badges, solution.id)
      }))
      .filter((route) => route.metric)
      .sort((a, b) => (a.badge?.rank ?? Infinity) - (b.badge?.rank ?? Infinity))
  );

  function formatPrice(value: number): string {
    if (Number.isNaN(value)) return '—';
    if (value <= 0) return localeText.solversView.priceFree;
    return `$${value.toFixed(2)}`;
  }

  function formatSeconds(value: number): string {
    return Number.isNaN(value) ? '—' : `${value.toFixed(1)}s`;
  }

  function formatPercent(value: number): string {
    return Number.isNaN(value) ? '—' : `${value.toFixed(0)}%`;
  }

  function selectRoute(id: string) {
    onViewSolution?.(id);
    onClose();
  }
</script>

<KefineModal {open} {onClose} closeLabel={labels.close} width="xwide">
  <kefine-solvers-modal data-testid="solvers-compare-modal">
    <kefine-solvers-modal-head>
      <h2>{labels.title}</h2>
      <p>{labels.subtitle}</p>
    </kefine-solvers-modal-head>

    <kefine-metric-switch role="group" aria-label={labels.rankedBy}>
      <lefine-text data-part="switch-label">{labels.rankedBy}</lefine-text>
      <kefine-metric-options>
        {#each solverRankingMetrics as metric (metric)}
          <button
            type="button"
            class="metric-option"
            data-metric={metric}
            data-active={ranking === metric ? 'true' : 'false'}
            aria-pressed={ranking === metric}
            title={labels.metricHints[metric]}
            onclick={() => (ranking = metric)}
          >
            {labels.metricNames[metric]}
          </button>
        {/each}
      </kefine-metric-options>
    </kefine-metric-switch>

    {#if rankedRoutes.length > 0}
      <kefine-route-list data-testid="solvers-route-list">
        {#each rankedRoutes as route (route.solution.id)}
          <button
            type="button"
            class="route-card"
            data-variant={route.solution.id}
            data-best={route.badge?.isBest ? 'true' : 'false'}
            onclick={() => selectRoute(route.solution.id)}
          >
            <lef-solver-avatar
              style="--avatar-color: {solverAvatarColor(route.solution.solver)}"
              aria-hidden="true"
            >{solverInitials(route.solution.solver)}</lef-solver-avatar>

            <kefine-route-meta>
              <kefine-route-name>
                <strong>{route.solution.solver}</strong>
                <KefineSolverBadge
                  badge={route.badge}
                  bestLabel={localeText.solversView.badges.best}
                  bestTitle={localeText.solversView.badges.bestTitle}
                  deltaTitle={localeText.solversView.badges.deltaTitle}
                />
              </kefine-route-name>
              <small>{route.solution.title}</small>
            </kefine-route-meta>

            {#if route.metric}
              <kefine-route-stats>
                <strong>{formatPrice(route.metric.priceUsd)}</strong>
                <small>
                  {formatSeconds(route.metric.executionTimeSec)}
                  · {formatPercent(route.metric.successRate)}
                </small>
              </kefine-route-stats>
            {/if}
          </button>
        {/each}
      </kefine-route-list>

      <SolutionMetricsBlock
        metrics={metrics}
        activeSolverId={bestSolverId}
        title={localeText.solversView.metricsTitle}
        subtitle={labels.plotsSubtitle}
      />
    {:else}
      <kefine-route-empty>{labels.empty}</kefine-route-empty>
    {/if}
  </kefine-solvers-modal>
</KefineModal>

<style>
  kefine-solvers-modal {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  kefine-solvers-modal-head {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding-right: 1.5rem;
  }

  kefine-solvers-modal-head h2 {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  kefine-solvers-modal-head p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.4;
    color: var(--lefine-text-soft);
  }

  kefine-metric-switch {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 0.75rem;
  }

  kefine-metric-switch [data-part='switch-label'] {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    font-weight: 700;
    color: var(--lefine-text-soft);
  }

  kefine-metric-options {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 0.3rem;
    padding: 0.25rem;
    background: var(--kef-bg-soft, color-mix(in oklab, var(--kef-bg-card) 70%, var(--kef-bg)));
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.6rem;
  }

  .metric-option {
    appearance: none;
    border: 1px solid transparent;
    background: transparent;
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
    font-weight: 600;
    padding: 0.28rem 0.7rem;
    border-radius: 0.45rem;
    cursor: pointer;
    transition: background 160ms ease, color 160ms ease;
  }

  .metric-option:hover {
    color: var(--lefine-text);
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, transparent);
  }

  .metric-option[data-active='true'] {
    color: var(--lefine-text);
    background: var(--kef-bg-card);
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 45%, var(--kef-line));
    box-shadow: 0 1px 2px color-mix(in oklab, var(--lefine-text, #2e2317) 10%, transparent);
  }

  kefine-route-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .route-card {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.7rem;
    width: 100%;
    text-align: left;
    padding: 0.7rem 0.85rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.65rem;
    cursor: pointer;
    transition: border-color 160ms ease, background 160ms ease, transform 120ms ease;
  }

  .route-card:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 40%, var(--kef-line));
    transform: translateY(-1px);
  }

  .route-card[data-best='true'] {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 7%, var(--kef-bg-card));
  }

  lef-solver-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #fff;
    background: var(--avatar-color, #6b7280);
  }

  kefine-route-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  kefine-route-name {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-width: 0;
  }

  kefine-route-name strong {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--lefine-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kefine-route-meta small {
    font-size: 0.76rem;
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kefine-route-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.1rem;
    text-align: right;
    white-space: nowrap;
  }

  kefine-route-stats strong {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--lefine-text);
    font-family: 'Synt', monospace;
  }

  kefine-route-stats small {
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
    font-family: 'Synt', monospace;
  }

  kefine-route-empty {
    display: block;
    padding: 2rem 0;
    text-align: center;
    color: var(--lefine-text-soft);
    font-size: 0.85rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .route-card,
    .metric-option {
      transition: none;
    }
  }
</style>
