<script lang="ts">
  import { okrStore } from '$lib/stores/okrs';
  import { taskStore } from '$lib/stores/tasks';
  import { untrack } from 'svelte';
  import type { Objective, KeyResult, Task, Quarter } from '$lib/types/okr';
  import { getQuartersList, getYearsList, getCurrentQuarter } from '$lib/utils/helpers';
  import { formatProgress } from '$lib/utils/formatters';
  import ObjectiveCard from '../objective-card/objective-card.svelte';
  import ObjectiveModal from '../objective-modal/objective-modal.svelte';
  import KeyResultModal from '../key-result-modal/key-result-modal.svelte';
  import ProgressRing from '../progress-ring/progress-ring.svelte';
  import AdvancedTaskModal from '$lib/components/tasks/advanced-task-modal/advanced-task-modal.svelte';

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
  let tasks: Task[] = $state([]);
  let isLoading = $state(true);

  // Modal state
  let showObjectiveModal = $state(false);
  let editingObjective: Objective | undefined = $state(undefined);
  let showKeyResultModal = $state(false);
  let keyResultObjectiveId: string | undefined = $state(undefined);
  let editingKeyResult: KeyResult | undefined = $state(undefined);
  let showTaskModal = $state(false);
  let editingTask: Task | undefined = $state(undefined);

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
    taskStore.loadFromLocalStorage();
    // Subscribe to store changes — use untrack to safely update $state from store subscription
    const unsubscribeOKR = okrStore.subscribe((s) => {
      untrack(() => {
        objectives = s.objectives;
        keyResults = s.keyResults;
      });
    });
    const unsubscribeTasks = taskStore.subscribe((s) => {
      untrack(() => {
        tasks = s.tasks;
      });
    });
    isLoading = false;
    return () => {
      unsubscribeOKR();
      unsubscribeTasks();
    };
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

  function openEditKeyResult(keyResult: KeyResult) {
    editingKeyResult = keyResult;
    keyResultObjectiveId = keyResult.objectiveId;
    showKeyResultModal = true;
  }

  function handleDeleteKeyResult(keyResult: KeyResult) {
    if (confirm(`Delete key result "${keyResult.title}"?`)) {
      okrStore.deleteKeyResult(keyResult.id);
      okrStore.saveToLocalStorage();
    }
  }

  function closeKeyResultModal() {
    showKeyResultModal = false;
    keyResultObjectiveId = undefined;
    editingKeyResult = undefined;
  }

  function openCreateTask() {
    editingTask = undefined;
    showTaskModal = true;
  }

  function openEditTask(task: Task) {
    editingTask = task;
    showTaskModal = true;
  }

  function closeTaskModal() {
    showTaskModal = false;
    editingTask = undefined;
  }

  function handleDeleteTask(task: Task) {
    if (confirm(`Delete task "${task.title}"?`)) {
      taskStore.deleteTask(task.id);
      taskStore.saveToLocalStorage();
    }
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
  <nav class="okr-toolbar" aria-label="OKR controls">
    <fieldset class="okr-filters" aria-label="Filter objectives">
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
    </fieldset>

    <button type="button" data-variant="ghost" onclick={openCreateTask}>
      + New Task
    </button>

    <button type="button" data-variant="primary" onclick={openCreateObjective}>
      + New Objective
    </button>
  </nav>

  <!-- Summary -->
  {#if filteredObjectives.length > 0}
    <okr-summary>
      <ProgressRing progress={overallProgress()} size="lg" />
      <okr-summary-text>
        <okr-summary-label>Overall Progress</okr-summary-label>
        <okr-summary-value>{formatProgress(overallProgress())}</okr-summary-value>
        <okr-summary-count>{filteredObjectives.length} objective{filteredObjectives.length !== 1 ? 's' : ''}</okr-summary-count>
      </okr-summary-text>
    </okr-summary>
  {/if}

  <!-- Loading state -->
  {#if isLoading}
    <ul class="okr-grid" aria-busy="true" aria-label="Loading...">
      {#each [1, 2, 3] as n (n)}
        <li class="skeleton-card" aria-hidden="true">
          <skeleton-line data-size="title"></skeleton-line>
          <skeleton-line></skeleton-line>
          <skeleton-line style="width: 70%"></skeleton-line>
        </li>
      {/each}
    </ul>

  <!-- Empty state -->
  {:else if filteredObjectives.length === 0}
    <section class="okr-empty" aria-live="polite">
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
    </section>

  <!-- Grid -->
  {:else}
    <ul class="okr-grid">
      {#each filteredObjectives as objective (objective.id)}
        <li>
          <ObjectiveCard
            {objective}
            keyResults={getKeyResultsForObjective(objective.id)}
            onEdit={openEditObjective}
            onAddKeyResult={openAddKeyResult}
            onEditKeyResult={openEditKeyResult}
            onDeleteKeyResult={handleDeleteKeyResult}
          />
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Tasks Section -->
  {#if tasks.length > 0}
    <section class="task-section" aria-label="Tasks">
      <header class="task-section-header">
        <h2 class="task-section-title">Tasks</h2>
        <task-count>{tasks.length} task{tasks.length !== 1 ? 's' : ''}</task-count>
      </header>
      <ul class="task-list" aria-label="Task list">
        {#each tasks as task (task.id)}
          <li class="task-item" data-status={task.status}>
            <task-item-content>
              <task-item-meta>
                <task-priority-dot style="background: var(--priority-{task.priority})" aria-label="Priority: {task.priority}"></task-priority-dot>
                <task-item-title>{task.title}</task-item-title>
                <task-status-badge data-status={task.status}>{task.status.replace('_', ' ')}</task-status-badge>
              </task-item-meta>
              {#if task.dueDate}
                <task-due-date>Due: {task.dueDate}{task.dueTime ? ` at ${task.dueTime}` : ''}</task-due-date>
              {/if}
              {#if task.okrLinks.length > 0}
                <task-okr-count>{task.okrLinks.length} OKR link{task.okrLinks.length !== 1 ? 's' : ''}</task-okr-count>
              {/if}
              {#if task.repositoryLinks.length > 0}
                <task-repo-count>{task.repositoryLinks.length} repo link{task.repositoryLinks.length !== 1 ? 's' : ''}</task-repo-count>
              {/if}
            </task-item-content>
            <task-item-actions>
              <button
                type="button"
                data-variant="action"
                onclick={() => openEditTask(task)}
                aria-label="Edit task"
              >Edit</button>
              <button
                type="button"
                data-variant="action"
                data-danger
                onclick={() => handleDeleteTask(task)}
                aria-label="Delete task"
              >Delete</button>
            </task-item-actions>
          </li>
        {/each}
      </ul>
    </section>
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

<!-- Advanced Task Modal -->
{#if showTaskModal}
  <AdvancedTaskModal
    task={editingTask}
    {objectives}
    {keyResults}
    onClose={closeTaskModal}
  />
{/if}

<style>
  @import './okr-index.css';
</style>
