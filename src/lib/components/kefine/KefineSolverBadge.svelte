<script lang="ts">
  /**
   * Small pill shown on a solver card, mirroring the "Best Route" / "-0.25%"
   * badges of a swap route picker. The best solver gets a green "Best" pill;
   * weaker solvers get a red pill with how far behind they are on the ranked
   * metric (e.g. `-6.7%`). Ranking math lives in `solver-badges.ts`; this
   * component is purely presentational.
   */
  import type { SolverBadge } from '$lib/kefine/solver-badges';
  import { formatSolverDelta } from '$lib/kefine/solver-badges';

  let {
    badge,
    bestLabel,
    bestTitle,
    deltaTitle,
    size = 'default'
  }: {
    badge: SolverBadge | undefined;
    bestLabel: string;
    bestTitle?: string;
    deltaTitle?: string;
    size?: 'default' | 'compact';
  } = $props();

  const deltaText = $derived(badge ? formatSolverDelta(badge.delta) : '');
  // Hide the pill when there is nothing meaningful to show (no badge, or a
  // weaker solver whose delta can't be expressed — e.g. a free best price).
  const visible = $derived(Boolean(badge) && (badge!.isBest || deltaText !== ''));
  const titleText = $derived(badge?.isBest ? bestTitle : deltaTitle);
</script>

{#if visible && badge}
  <kefine-solver-badge
    data-tone={badge.isBest ? 'best' : 'delta'}
    data-size={size}
    title={titleText}
  >
    {badge.isBest ? bestLabel : deltaText}
  </kefine-solver-badge>
{/if}

<style>
  kefine-solver-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.2rem;
    padding: 0.08rem 0.42rem;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.5;
    letter-spacing: 0.01em;
    white-space: nowrap;
    border: 1px solid transparent;
  }

  kefine-solver-badge[data-size='compact'] {
    font-size: 0.62rem;
    padding: 0.04rem 0.34rem;
  }

  kefine-solver-badge[data-tone='best'] {
    color: var(--kef-success, #16a34a);
    background: color-mix(in oklab, var(--kef-success, #16a34a) 16%, transparent);
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 36%, transparent);
  }

  kefine-solver-badge[data-tone='delta'] {
    color: var(--kef-error, #dc2626);
    background: color-mix(in oklab, var(--kef-error, #dc2626) 14%, transparent);
    border-color: color-mix(in oklab, var(--kef-error, #dc2626) 32%, transparent);
  }
</style>
