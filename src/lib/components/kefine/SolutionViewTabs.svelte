<script lang="ts">
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  type SolutionView = 'overview' | 'source' | 'checkpoints';

  let {
    active,
    onSelect
  }: {
    active: SolutionView;
    onSelect: (next: SolutionView) => void;
  } = $props();

  const localeText = $derived($kefineLocaleText);

  const items = $derived.by(() => [
    {
      id: 'overview' as const,
      icon: 'lucide:layout-dashboard',
      label: localeText.solutionView.tabs.overview.label,
      hint: localeText.solutionView.tabs.overview.hint
    },
    {
      id: 'checkpoints' as const,
      icon: 'lucide:git-branch',
      label: localeText.solutionView.tabs.checkpoints.label,
      hint: localeText.solutionView.tabs.checkpoints.hint
    },
    {
      id: 'source' as const,
      icon: 'lucide:code-2',
      label: localeText.solutionView.tabs.source.label,
      hint: localeText.solutionView.tabs.source.hint
    }
  ]);
</script>

<lef-view-tabs role="tablist" aria-label={localeText.solutionView.ariaLabel}>
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
      <Icon icon={item.icon} width="14" height="14" aria-hidden="true" />
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
