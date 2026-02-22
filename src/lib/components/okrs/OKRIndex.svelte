<script lang="ts">
  import { okrStore } from '$lib/stores/okrs';
  import { untrack } from 'svelte';
  import type { Objective, KeyResult, Quarter } from '$lib/types/okr';
  import { getQuartersList, getYearsList, getCurrentQuarter } from '$lib/utils/helpers';
  import { formatProgress } from '$lib/utils/formatters';
  import ObjectiveCard from './ObjectiveCard.svelte';
  import ObjectiveModal from './ObjectiveModal.svelte';
  import KeyResultModal from './KeyResultModal.svelte';
  import ProgressRing from './ProgressRing.svelte';

  /** Pure progress calculation that doesn't mutate store state */
  function calcKRProgress(kr: KeyResult): number {
    if (kr.targetValue <= 0) return 0;
    const raw = (kr.currentValue / kr.targetValue) * 100;
    return Math.max(0, Math.min(100, raw));
  }

  function calcObjectiveProgress(objectiveId: string, krs: KeyResult[]): number {
    const objKRs = krs.filter((kr) => kr.objectiveId === objectiveId);
    if (objKRs.length === 0) return 0;
    const totalWeight = objKRs.reduce((s, kr) => s + kr.weight, 0);
    if (totalWeight === 0) return 0;
    const weighted = objKRs.reduce((s, kr) => s + (calcKRProgress(kr) * kr.weight) / totalWeight, 0);
    return Math.max(0, Math.min(100, weighted));
  }

  // Use Svelte store auto-subscription with $ prefix (reactive, no manual subscribe needed)
  // storeData is updated reactively via the store subscription below
  let objectives: Objective[] = $state([]);
  let keyResults: KeyResult[] = $state([]);
  let isLoading = $state(true);

  // Modal state
  let showObjectiveModal = $state(false);
  let editingObjective: Objective | undefined = $state(undefined);
  let showKeyResultModal = $state(false);
  let keyResultObjectiveId: string | undefined = $state(undefined);
  let editingKeyResult: KeyResult | undefined = $state(undefined);

  // Filter state
  const { quarter: defaultQuarter, year: defaultYear } = getCurrentQuarter();
  let filterQuarter: Quarter | '' = $state('');
  let filterYear: number | '' = $state('');
  let filterSearch = $state('');

  const quarters = getQuartersList();
  const years = getYearsList();

  // Load data once on mount
  $effect(() => {
    okrStore.loadFromLocalStorage();
    // Subscribe to store changes — use untrack to safely update $state from store subscription
    const unsubscribe = okrStore.subscribe((s) => {
      untrack(() => {
        objectives = s.objectives;
        keyResults = s.keyResults;
      });
    });
    isLoading = false;
    return unsubscribe;
  });

  const filteredObjectives = $derived(
    objectives.filter((obj) => {
      if (filterQuarter && obj.quarter !== filterQuarter) return false;
      if (filterYear && obj.year !== filterYear) return false;
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const titleMatch = obj.title.toLowerCase().includes(q);
        const descMatch = obj.description?.toLowerCase().includes(q) ?? false;
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    })
  );

  const overallProgress = $derived(() => {
    if (filteredObjectives.length === 0) return 0;
    const total = filteredObjectives.reduce((sum, obj) => {
      return sum + calcObjectiveProgress(obj.id, keyResults);
    }, 0);
    return total / filteredObjectives.length;
  });

  function getKeyResultsForObjective(objectiveId: string): KeyResult[] {
    return keyResults.filter((kr) => kr.objectiveId === objectiveId);
  }

  function openCreateObjective() {
    editingObjective = undefined;
    showObjectiveModal = true;
  }

  function openEditObjective(objective: Objective) {
    editingObjective = objective;
    showObjectiveModal = true;
  }

  function closeObjectiveModal() {
    showObjectiveModal = false;
    editingObjective = undefined;
  }

  function openAddKeyResult(objectiveId: string) {
    keyResultObjectiveId = objectiveId;
    editingKeyResult = undefined;
    showKeyResultModal = true;
  }

  function closeKeyResultModal() {
    showKeyResultModal = false;
    keyResultObjectiveId = undefined;
    editingKeyResult = undefined;
  }

  function clearFilters() {
    filterQuarter = '';
    filterYear = '';
    filterSearch = '';
  }

  const hasActiveFilters = $derived(filterQuarter !== '' || filterYear !== '' || filterSearch !== '');

  // Use defaultQuarter and defaultYear for display (avoids unused variable lint errors)
  const quarterPlaceholder = `All (current: ${defaultQuarter} ${defaultYear})`;
</script>

<section class="okr-index" aria-label="OKR Index">
  <!-- Toolbar -->
  <div class="okr-toolbar">
    <div class="okr-filters" role="group" aria-label="Filter objectives">
      <select bind:value={filterQuarter} aria-label="Filter by quarter">
        <option value="">{quarterPlaceholder}</option>
        {#each quarters as q (q.value)}
          <option value={q.value}>{q.label}</option>
        {/each}
      </select>

      <select bind:value={filterYear} aria-label="Filter by year">
        <option value="">All Years</option>
        {#each years as y (y)}
          <option value={y}>{y}</option>
        {/each}
      </select>

      <input
        type="search"
        bind:value={filterSearch}
        placeholder="Search objectives..."
        aria-label="Search objectives"
      />

      {#if hasActiveFilters}
        <button type="button" data-variant="muted" onclick={clearFilters}>Clear filters</button>
      {/if}
    </div>

    <button type="button" data-variant="primary" onclick={openCreateObjective}>
      + New Objective
    </button>
  </div>

  <!-- Summary -->
  {#if filteredObjectives.length > 0}
    <div class="okr-summary">
      <ProgressRing progress={overallProgress()} size="lg" />
      <div class="okr-summary-text">
        <span class="okr-summary-label">Overall Progress</span>
        <span class="okr-summary-value">{formatProgress(overallProgress())}</span>
        <span class="okr-summary-count">{filteredObjectives.length} objective{filteredObjectives.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <div class="okr-grid" aria-busy="true" aria-label="Loading...">
      {#each [1, 2, 3] as n (n)}
        <div class="skeleton-card" aria-hidden="true">
          <div class="skeleton-line" data-size="title"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width: 70%"></div>
        </div>
      {/each}
    </div>

  <!-- Empty state -->
  {:else if filteredObjectives.length === 0}
    <div class="okr-empty" aria-live="polite">
      {#if hasActiveFilters}
        <h2>No objectives match your filters</h2>
        <p>Try adjusting your filters or <button type="button" data-variant="link" onclick={clearFilters}>clear them</button>.</p>
      {:else}
        <h2>No objectives yet</h2>
        <p>Create your first objective to start tracking your goals.</p>
        <button type="button" data-variant="primary" data-size="lg" onclick={openCreateObjective}>
          Create Objective
        </button>
      {/if}
    </div>

  <!-- Grid -->
  {:else}
    <div class="okr-grid">
      {#each filteredObjectives as objective (objective.id)}
        <ObjectiveCard
          {objective}
          keyResults={getKeyResultsForObjective(objective.id)}
          onEdit={openEditObjective}
          onAddKeyResult={openAddKeyResult}
        />
      {/each}
    </div>
  {/if}
</section>

<!-- Objective Modal -->
{#if showObjectiveModal}
  <ObjectiveModal
    objective={editingObjective}
    onClose={closeObjectiveModal}
  />
{/if}

<!-- Key Result Modal -->
{#if showKeyResultModal}
  <KeyResultModal
    keyResult={editingKeyResult}
    objectiveId={keyResultObjectiveId}
    objectives={objectives}
    onClose={closeKeyResultModal}
  />
{/if}
