<script lang="ts">
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';

  type SolverNoteKey = 'routeScout' | 'infraForge' | 'rollbackKeeper' | 'pricingOracle';

  type SolverDirectoryItem = {
    id: string;
    name: string;
    handle: string;
    cohorts: string[];
    noteKey: SolverNoteKey;
    rate: string;
  };

  const SOLVER_DIRECTORY: SolverDirectoryItem[] = [
    {
      id: 'route-scout',
      name: 'Route Scout',
      handle: '@route-scout',
      cohorts: ['vpn', 'wireguard', 'network'],
      noteKey: 'routeScout',
      rate: '$12',
    },
    {
      id: 'infra-forge',
      name: 'Infra Forge',
      handle: '@infra-forge',
      cohorts: ['vpn', 'devops', 'infra'],
      noteKey: 'infraForge',
      rate: '$18',
    },
    {
      id: 'rollback-keeper',
      name: 'Rollback Keeper',
      handle: '@rollback-keeper',
      cohorts: ['ci', 'devops', 'kubernetes'],
      noteKey: 'rollbackKeeper',
      rate: '$9',
    },
    {
      id: 'pricing-oracle',
      name: 'Pricing Oracle',
      handle: '@pricing-oracle',
      cohorts: ['vpn', 'market', 'pricing'],
      noteKey: 'pricingOracle',
      rate: '$7',
    }
  ];

  let {
    open,
    onClose,
    closeLabel,
    title,
    description,
    searchLabel,
    searchPlaceholder,
    applyLabel,
    cohortQuery = '',
    selectedSolverIds = [],
    onApply
  }: {
    open: boolean;
    onClose: () => void;
    closeLabel?: string;
    title?: string;
    description?: string;
    searchLabel?: string;
    searchPlaceholder?: string;
    applyLabel?: string;
    cohortQuery?: string;
    selectedSolverIds?: string[];
    onApply: (payload: { cohortQuery: string; solverIds: string[] }) => void;
  } = $props();

  const localeText = $derived($kefineLocaleText);
  const cohortText = $derived(localeText.solversView.cohortDialog);
  const resolvedTitle = $derived(title ?? cohortText.title);
  const resolvedDescription = $derived(description ?? cohortText.description);
  const resolvedSearchLabel = $derived(searchLabel ?? cohortText.searchLabel);
  const resolvedSearchPlaceholder = $derived(searchPlaceholder ?? cohortText.searchPlaceholder);
  const resolvedApplyLabel = $derived(applyLabel ?? localeText.buttons.apply);
  const resolvedCloseLabel = $derived(closeLabel ?? localeText.buttons.closeDialog);

  let localQuery = $state('');
  let localSelectedSolverIds = $state<string[]>([]);

  $effect(() => {
    if (!open) {
      return;
    }

    localQuery = cohortQuery;
    localSelectedSolverIds = [...selectedSolverIds];
  });

  const filteredSolvers = $derived.by(() => {
    const query = localQuery.trim().toLowerCase();
    if (!query) {
      return SOLVER_DIRECTORY;
    }

    return SOLVER_DIRECTORY.filter((solver) =>
      [solver.name, solver.handle, cohortText.solverNotes[solver.noteKey], ...solver.cohorts].some((value) => value.toLowerCase().includes(query))
    );
  });

  function toggleSolver(solverId: string) {
    localSelectedSolverIds = localSelectedSolverIds.includes(solverId)
      ? localSelectedSolverIds.filter((id) => id !== solverId)
      : [...localSelectedSolverIds, solverId];
  }

  function applySelection() {
    onApply({
      cohortQuery: localQuery.trim().toLowerCase(),
      solverIds: localSelectedSolverIds
    });
  }
</script>

<KefineModal open={open} onClose={onClose} closeLabel={resolvedCloseLabel} width="wide" tone="dark">
  <section class="kefine-solver-cohort-dialog">
    <header class="kefine-solver-cohort-dialog__header">
      <lefine-box>
        <h2>{resolvedTitle}</h2>
        <p>{resolvedDescription}</p>
      </lefine-box>
    </header>

    <label class="kefine-solver-cohort-dialog__search">
      <lefine-text>{resolvedSearchLabel}</lefine-text>
      <input bind:value={localQuery} placeholder={resolvedSearchPlaceholder} />
    </label>

    <kefine-solver-list class="kefine-solver-cohort-dialog__list">
      {#each filteredSolvers as solver (solver.id)}
        <button
          type="button"
          class="kefine-solver-cohort-dialog__solver"
          data-selected={localSelectedSolverIds.includes(solver.id)}
          onclick={() => toggleSolver(solver.id)}
        >
          <kefine-solver-avatar class="kefine-solver-cohort-dialog__avatar" aria-hidden="true">
            {solver.name.slice(0, 1)}
          </kefine-solver-avatar>
          <kefine-solver-copy class="kefine-solver-cohort-dialog__copy">
            <strong>{solver.name}</strong>
            <lefine-text>{solver.handle}</lefine-text>
            <p>{cohortText.solverNotes[solver.noteKey]}</p>
            <kefine-solver-badges class="kefine-solver-cohort-dialog__badges">
              {#each solver.cohorts as cohort}
                <lefine-text>{cohort}</lefine-text>
              {/each}
            </kefine-solver-badges>
          </kefine-solver-copy>
          <lefine-text>{solver.rate}</lefine-text>
        </button>
      {/each}
    </kefine-solver-list>

    <footer class="kefine-solver-cohort-dialog__actions">
      <button type="button" data-variant="ghost" onclick={onClose}>{resolvedCloseLabel}</button>
      <button type="button" data-variant="primary" onclick={applySelection}>{resolvedApplyLabel}</button>
    </footer>
  </section>
</KefineModal>

<style>
  .kefine-solver-cohort-dialog {
    display: grid;
    gap: 1rem;
    color: color-mix(in oklab, #ead7b3 84%, white 16%);
  }

  .kefine-solver-cohort-dialog__header h2,
  .kefine-solver-cohort-dialog__header p,
  .kefine-solver-cohort-dialog__copy strong,
  .kefine-solver-cohort-dialog__copy p {
    margin: 0;
  }

  .kefine-solver-cohort-dialog__header p,
  .kefine-solver-cohort-dialog__copy p,
  .kefine-solver-cohort-dialog__copy lefine-text {
    color: color-mix(in oklab, #ead7b3 56%, transparent);
  }

  .kefine-solver-cohort-dialog__search {
    display: grid;
    gap: 0.35rem;
  }

  .kefine-solver-cohort-dialog__search lefine-text {
    color: color-mix(in oklab, #ead7b3 62%, transparent);
  }

  .kefine-solver-cohort-dialog__search input {
    background: color-mix(in oklab, #120d09 88%, black 12%);
    color: color-mix(in oklab, #ead7b3 88%, white 12%);
    border: 1px solid color-mix(in oklab, #ead7b3 14%, transparent);
    box-shadow: none;
  }

  .kefine-solver-cohort-dialog__search input::placeholder {
    color: color-mix(in oklab, #ead7b3 34%, transparent);
  }

  .kefine-solver-cohort-dialog__list {
    display: grid;
    gap: 0.7rem;
    max-height: 24rem;
    overflow: auto;
  }

  .kefine-solver-cohort-dialog__solver {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.9rem;
    align-items: start;
    padding: 0.9rem;
    border-radius: 1rem;
    border: 1px solid color-mix(in oklab, #ead7b3 12%, transparent);
    background: color-mix(in oklab, #1a120d 92%, black 8%);
    color: color-mix(in oklab, #ead7b3 84%, white 16%);
    text-align: left;
  }

  .kefine-solver-cohort-dialog__solver[data-selected='true'] {
    border-color: color-mix(in oklab, #d7a14a 44%, transparent);
    background: color-mix(in oklab, #2a1a10 92%, black 8%);
  }

  .kefine-solver-cohort-dialog__avatar {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 999px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #2846a6, #5f2d91);
    color: white;
    font-weight: 700;
  }

  .kefine-solver-cohort-dialog__copy {
    display: grid;
    gap: 0.2rem;
  }

  .kefine-solver-cohort-dialog__copy strong {
    color: color-mix(in oklab, #ead7b3 92%, white 8%);
  }

  .kefine-solver-cohort-dialog__badges {
    display: flex;
    gap: 0.45rem;
    flex-wrap: wrap;
    margin-top: 0.3rem;
  }

  .kefine-solver-cohort-dialog__badges {
    color: color-mix(in oklab, #ead7b3 62%, transparent);
    font-size: 0.82rem;
  }

  .kefine-solver-cohort-dialog__badges lefine-text {
    display: inline-flex;
    min-height: 1.8rem;
    align-items: center;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    background: color-mix(in oklab, #24170f 90%, black 10%);
  }

  .kefine-solver-cohort-dialog__actions {
    display: flex;
    gap: 0.75rem;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
</style>
