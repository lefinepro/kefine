<script lang="ts">
  type SolutionView = 'source' | 'testing';

  let {
    active,
    onSelect
  }: {
    active: SolutionView;
    onSelect: (next: SolutionView) => void;
  } = $props();

  const items: Array<{ id: SolutionView; label: string; hint: string }> = [
    { id: 'testing', label: 'Testing', hint: 'Send a sample request to the solver' },
    { id: 'source', label: 'Source', hint: 'View the modified files' }
  ];
</script>

<lef-view-tabs role="tablist" aria-label="Solver view">
  {#each items as item (item.id)}
    <button
      type="button"
      role="tab"
      aria-selected={active === item.id}
      class="lef-view-tab"
      class:lef-view-tab--active={active === item.id}
      title={item.hint}
      onclick={() => onSelect(item.id)}
    >
      {#if item.id === 'source'}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M5 12l5 5 9-9"></path>
          <path d="M14 5l5 5"></path>
        </svg>
      {/if}
      <lefine-text>{item.label}</lefine-text>
    </button>
  {/each}
</lef-view-tabs>

<style>
  lef-view-tabs {
    display: inline-flex;
    gap: 0.25rem;
    padding: 0.2rem;
    background: var(--kef-bg-soft);
    border: 1px solid var(--kef-line-soft);
    border-radius: 0.55rem;
    width: max-content;
    min-height: 2.1rem;
    align-items: stretch;
  }

  .lef-view-tab {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    appearance: none;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.4rem;
    padding: 0.35rem 0.75rem;
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
    font-weight: 600;
    line-height: 1.4;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      border-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease);
  }

  .lef-view-tab:hover {
    color: var(--lefine-text);
  }

  .lef-view-tab--active {
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    border-color: var(--kef-line);
  }
</style>
