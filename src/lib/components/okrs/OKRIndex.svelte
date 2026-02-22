<script lang="ts">
  import { okrStore } from '$lib/stores/okrs';
  import type { OKRState } from '$lib/stores/okrs';
  import type { Objective, KeyResult, Quarter } from '$lib/types/okr';
  import { getQuartersList, getYearsList, getCurrentQuarter } from '$lib/utils/helpers';
  import { formatProgress } from '$lib/utils/formatters';
  import ObjectiveCard from './ObjectiveCard.svelte';
  import ObjectiveModal from './ObjectiveModal.svelte';
  import KeyResultModal from './KeyResultModal.svelte';
  import ProgressRing from './ProgressRing.svelte';

  const emptyState: OKRState = { objectives: [], keyResults: [], okrLinks: [], filters: { quarter: null, year: null, status: null, search: '' } };

  let storeData: OKRState = $state(emptyState);
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

  // Subscribe to store
  $effect(() => {
    const unsubscribe = okrStore.subscribe((s) => {
      storeData = s;
    });
    return unsubscribe;
  });

  $effect(() => {
    okrStore.loadFromLocalStorage();
    isLoading = false;
  });

  $effect(() => {
    okrStore.setFilters({
      quarter: filterQuarter ? filterQuarter : null,
      year: filterYear ? filterYear : null,
      search: filterSearch
    });
  });

  const filteredObjectives = $derived(
    storeData.objectives.filter((obj) => {
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
      return sum + okrStore.calculateObjectiveProgress(obj.id);
    }, 0);
    return total / filteredObjectives.length;
  });

  function getKeyResultsForObjective(objectiveId: string): KeyResult[] {
    return storeData.keyResults.filter((kr) => kr.objectiveId === objectiveId);
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
  <div class="okr-index__toolbar">
    <div class="okr-index__filters" role="group" aria-label="Filter objectives">
      <select
        class="filter-select"
        bind:value={filterQuarter}
        aria-label="Filter by quarter"
      >
        <option value="">{quarterPlaceholder}</option>
        {#each quarters as q (q.value)}
          <option value={q.value}>{q.label}</option>
        {/each}
      </select>

      <select
        class="filter-select"
        bind:value={filterYear}
        aria-label="Filter by year"
      >
        <option value="">All Years</option>
        {#each years as y (y)}
          <option value={y}>{y}</option>
        {/each}
      </select>

      <input
        type="search"
        class="filter-search"
        bind:value={filterSearch}
        placeholder="Search objectives..."
        aria-label="Search objectives"
      />

      {#if hasActiveFilters}
        <button type="button" class="btn-clear" onclick={clearFilters}>Clear filters</button>
      {/if}
    </div>

    <button type="button" class="btn-create" onclick={openCreateObjective}>
      + New Objective
    </button>
  </div>

  <!-- Summary -->
  {#if filteredObjectives.length > 0}
    <div class="okr-index__summary">
      <ProgressRing progress={overallProgress()} size="lg" />
      <div class="okr-summary__text">
        <span class="okr-summary__label">Overall Progress</span>
        <span class="okr-summary__value">{formatProgress(overallProgress())}</span>
        <span class="okr-summary__count">{filteredObjectives.length} objective{filteredObjectives.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <div class="okr-index__grid" aria-busy="true" aria-label="Loading...">
      {#each [1, 2, 3] as n (n)}
        <div class="skeleton-card" aria-hidden="true">
          <div class="skeleton-line skeleton-line--title"></div>
          <div class="skeleton-line skeleton-line--body"></div>
          <div class="skeleton-line skeleton-line--body" style="width: 70%"></div>
        </div>
      {/each}
    </div>

  <!-- Empty state -->
  {:else if filteredObjectives.length === 0}
    <section class="okr-index__empty" aria-live="polite">
      {#if hasActiveFilters}
        <h2>No objectives match your filters</h2>
        <p>Try adjusting your filters or <button type="button" class="btn-link" onclick={clearFilters}>clear them</button>.</p>
      {:else}
        <h2>No objectives yet</h2>
        <p>Create your first objective to start tracking your goals.</p>
        <button type="button" class="btn-primary" onclick={openCreateObjective}>
          Create Objective
        </button>
      {/if}
    </section>

  <!-- Grid -->
  {:else}
    <div class="okr-index__grid">
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
    objectives={storeData.objectives}
    onClose={closeKeyResultModal}
  />
{/if}

<style>
  .okr-index {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .okr-index__toolbar {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
    flex-wrap: wrap;
  }

  .okr-index__filters {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex: 1;
    flex-wrap: wrap;
    min-width: 0;
  }

  .filter-select,
  .filter-search {
    padding: var(--spacing-2) var(--spacing-3);
    border: 1px solid #d1d5db;
    border-radius: var(--radius-md);
    font-size: var(--font-size-sm);
    font-family: inherit;
    background: white;
    color: #111827;
  }

  .filter-search {
    flex: 1;
    min-width: 160px;
  }

  .btn-clear {
    background: none;
    border: none;
    font-size: var(--font-size-xs);
    color: var(--color-muted);
    cursor: pointer;
    font-family: inherit;
    text-decoration: underline;
  }

  .btn-create {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-2) var(--spacing-4);
    font-size: var(--font-size-sm);
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 150ms;
  }

  .btn-create:hover {
    background: var(--color-primary-hover);
  }

  .okr-index__summary {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
    background: white;
    border-radius: var(--radius-lg);
    padding: var(--spacing-4) var(--spacing-6);
    box-shadow: var(--shadow-sm);
  }

  .okr-summary__text {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .okr-summary__label {
    font-size: var(--font-size-sm);
    color: var(--color-muted);
  }

  .okr-summary__value {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: #111827;
  }

  .okr-summary__count {
    font-size: var(--font-size-xs);
    color: var(--color-muted);
  }

  .okr-index__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-4);
  }

  @media (max-width: 1199px) {
    .okr-index__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 767px) {
    .okr-index__grid {
      grid-template-columns: 1fr;
    }

    .okr-index__toolbar {
      flex-direction: column;
      align-items: stretch;
    }

    .btn-create {
      text-align: center;
    }
  }

  .okr-index__empty {
    text-align: center;
    padding: var(--spacing-8) var(--spacing-4);
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-sm);
  }

  .okr-index__empty h2 {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: #111827;
    margin-bottom: var(--spacing-2);
  }

  .okr-index__empty p {
    color: var(--color-muted);
    margin-bottom: var(--spacing-4);
  }

  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    padding: var(--spacing-2) var(--spacing-6);
    font-size: var(--font-size-base);
    font-family: inherit;
    font-weight: 600;
    cursor: pointer;
    transition: background 150ms;
  }

  .btn-primary:hover {
    background: var(--color-primary-hover);
  }

  .btn-link {
    background: none;
    border: none;
    color: var(--color-primary);
    font-family: inherit;
    font-size: inherit;
    cursor: pointer;
    text-decoration: underline;
    padding: 0;
  }

  /* Skeleton loading */
  .skeleton-card {
    background: white;
    border-radius: var(--radius-xl);
    padding: var(--spacing-6);
    box-shadow: var(--shadow-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .skeleton-line {
    height: 1rem;
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    border-radius: var(--radius-sm);
    animation: skeleton-pulse 1.5s infinite;
  }

  .skeleton-line--title {
    height: 1.25rem;
    width: 60%;
  }

  .skeleton-line--body {
    width: 100%;
  }

  @keyframes skeleton-pulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
</style>
