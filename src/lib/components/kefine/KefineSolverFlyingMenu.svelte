<script lang="ts">
  import { onMount } from 'svelte';
  import { solverAvatarColor, solverInitials } from '$lib/kefine/solver-avatars';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  type SolverOption = {
    id: string;
    solver: string;
    title: string;
  };

  let {
    solvers,
    activeId,
    onSelect
  }: {
    solvers: ReadonlyArray<SolverOption>;
    activeId: string;
    onSelect: (id: string) => void;
  } = $props();

  // The flying-menu web component is a Lit custom element that touches `window`
  // and `customElements` at import time, so it must only load in the browser.
  // Until it is registered we keep the markup out of the DOM to avoid a flash of
  // unstyled, unprojected slot content during SSR/hydration.
  let ready = $state(false);

  const labels = $derived($kefineLocaleText.solutionView.flyingMenu);

  onMount(() => {
    let cancelled = false;
    void import('@igor-ganov/flying-menu').then(() => {
      if (!cancelled) {
        ready = true;
      }
    });

    return () => {
      cancelled = true;
    };
  });

  function handleSelect(menu: EventTarget | null, id: string) {
    onSelect(id);
    // `closeMenu` exists on the upgraded custom element; guard for safety.
    const element = menu as { closeMenu?: () => void } | null;
    element?.closeMenu?.();
  }
</script>

{#if ready && solvers.length > 0}
  <flying-menu corner="bottom-right" storage-key="kefine-solver-flying-menu">
    <button slot="trigger" type="button" class="lef-fm-trigger" aria-label={labels.trigger} title={labels.trigger}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2 2 7l10 5 10-5-10-5Z"></path>
        <path d="m2 17 10 5 10-5"></path>
        <path d="m2 12 10 5 10-5"></path>
      </svg>
      <lef-fm-count aria-hidden="true">{solvers.length}</lef-fm-count>
    </button>

    <lef-fm-menu slot="menu" role="menu" aria-label={labels.listAria} data-testid="solver-flying-menu">
      <lef-fm-title>{labels.title}</lef-fm-title>
      {#each solvers as candidate (candidate.id)}
        <button
          type="button"
          role="menuitem"
          class="lef-fm-option"
          data-solver-id={candidate.id}
          data-active={candidate.id === activeId ? 'true' : 'false'}
          aria-current={candidate.id === activeId ? 'true' : undefined}
          onclick={(event) => handleSelect(event.currentTarget.closest('flying-menu'), candidate.id)}
        >
          <lef-solver-avatar style="--avatar-color: {solverAvatarColor(candidate.solver)}" aria-hidden="true">
            {solverInitials(candidate.solver)}
          </lef-solver-avatar>
          <lef-fm-option-copy>
            <strong>{candidate.solver}</strong>
            <small>{candidate.title}</small>
          </lef-fm-option-copy>
        </button>
      {/each}
    </lef-fm-menu>
  </flying-menu>
{/if}

<style>
  flying-menu::part(menu) {
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.75rem;
    box-shadow: 0 18px 40px -22px rgba(15, 23, 42, 0.55);
    overflow: hidden;
  }

  .lef-fm-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.55rem 0.7rem;
    border-radius: 999px;
    border: 1px solid var(--kef-line-soft);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    cursor: pointer;
    box-shadow: 0 14px 30px -18px rgba(15, 23, 42, 0.6);
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .lef-fm-trigger:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 42%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  lef-fm-count {
    display: inline-grid;
    place-items: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 0.3rem;
    border-radius: 999px;
    background: var(--kef-color-primary, #3a7afe);
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
  }

  lef-fm-menu {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem;
    width: min(18rem, 80vw);
    max-height: min(60vh, 26rem);
    overflow: auto;
  }

  lef-fm-title {
    display: block;
    padding: 0.15rem 0.4rem 0.35rem;
    color: var(--lefine-text-soft);
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .lef-fm-option {
    display: grid;
    grid-template-columns: 1.75rem minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.5rem 0.6rem;
    border: 1px solid transparent;
    border-radius: 0.5rem;
    background: transparent;
    color: var(--lefine-text);
    text-align: left;
    cursor: pointer;
  }

  .lef-fm-option:hover,
  .lef-fm-option[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 42%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  lef-solver-avatar {
    display: inline-grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 8px;
    background: var(--avatar-color, var(--kef-color-primary, #3a7afe));
    color: #fff;
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
  }

  lef-fm-option-copy {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  lef-fm-option-copy strong,
  lef-fm-option-copy small {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-fm-option-copy strong {
    font-size: 0.82rem;
    line-height: 1.25;
  }

  lef-fm-option-copy small {
    color: var(--lefine-text-soft);
    font-size: 0.74rem;
    line-height: 1.25;
  }
</style>
