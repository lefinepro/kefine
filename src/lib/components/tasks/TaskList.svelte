<script lang="ts">
  import { taskStore } from '$lib/stores/tasks';
  import { okrStore } from '$lib/stores/okrs';
  import { untrack } from 'svelte';
  import type { Task, Objective, KeyResult, OKRLink, TaskStatus, Priority } from '$lib/types/okr';
  import { getPriorityColor } from '$lib/utils/colors';
  import OKRBadge from '$lib/components/shared/OKRBadge.svelte';
  import TaskModal from './TaskModal.svelte';

  // Store state
  let tasks: Task[] = $state([]);
  let objectives: Objective[] = $state([]);
  let keyResults: KeyResult[] = $state([]);

  // Filter state
  let filterStatus: TaskStatus | '' = $state('');
  let filterPriority: Priority | '' = $state('');
  let filterOKR: string = $state(''); // objectiveId or keyResultId
  let filterSearch = $state('');

  // Modal state
  let showTaskModal = $state(false);
  let editingTask: Task | undefined = $state(undefined);

  // Load data on mount
  $effect(() => {
    taskStore.loadFromLocalStorage();
    okrStore.loadFromLocalStorage();

    const unsubTask = taskStore.subscribe((s) => {
      untrack(() => {
        tasks = s.tasks;
      });
    });
    const unsubOKR = okrStore.subscribe((s) => {
      untrack(() => {
        objectives = s.objectives;
        keyResults = s.keyResults;
      });
    });

    return () => {
      unsubTask();
      unsubOKR();
    };
  });

  function getObjective(id?: string): Objective | undefined {
    if (!id) return undefined;
    return objectives.find((o) => o.id === id);
  }

  function getKeyResult(id?: string): KeyResult | undefined {
    if (!id) return undefined;
    return keyResults.find((kr) => kr.id === id);
  }

  // Build OKR filter options from all linked OKRs across all tasks
  const okrFilterOptions = $derived(() => {
    const seen = new Set<string>();
    const options: { id: string; label: string }[] = [];
    for (const task of tasks) {
      for (const link of task.okrLinks) {
        const key = link.objectiveId ?? link.keyResultId ?? '';
        if (key && !seen.has(key)) {
          seen.add(key);
          if (link.linkType === 'objective') {
            const obj = getObjective(link.objectiveId);
            options.push({ id: key, label: obj ? `OKR: ${obj.title}` : `OKR: ${key}` });
          } else {
            const kr = getKeyResult(link.keyResultId);
            const obj = getObjective(link.objectiveId);
            const label = kr ? `KR: ${kr.title}` : `KR: ${key}`;
            options.push({ id: key, label: obj ? `${label} (${obj.title})` : label });
          }
        }
      }
    }
    return options;
  });

  const filteredTasks = $derived(
    tasks.filter((task) => {
      if (filterStatus && task.status !== filterStatus) return false;
      if (filterPriority && task.priority !== filterPriority) return false;
      if (filterOKR) {
        const linked = task.okrLinks.some(
          (l) => l.objectiveId === filterOKR || l.keyResultId === filterOKR
        );
        if (!linked) return false;
      }
      if (filterSearch) {
        const q = filterSearch.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(q);
        const descMatch = task.description?.toLowerCase().includes(q) ?? false;
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    })
  );

  const hasActiveFilters = $derived(
    filterStatus !== '' || filterPriority !== '' || filterOKR !== '' || filterSearch !== ''
  );

  function clearFilters() {
    filterStatus = '';
    filterPriority = '';
    filterOKR = '';
    filterSearch = '';
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

  function deleteTask(task: Task) {
    if (confirm(`Delete task "${task.title}"?`)) {
      taskStore.deleteTask(task.id);
      taskStore.saveToLocalStorage();
    }
  }

  function toggleTaskStatus(task: Task) {
    const next: TaskStatus =
      task.status === 'pending' ? 'in_progress'
      : task.status === 'in_progress' ? 'completed'
      : 'pending';
    taskStore.updateTask(task.id, { status: next });
    taskStore.saveToLocalStorage();
  }

  function getStatusLabel(status: TaskStatus): string {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return status;
    }
  }

  function handleBadgeClick(link: OKRLink) {
    // Filter the task list to show only tasks linked to this OKR/KR
    const id = link.objectiveId ?? link.keyResultId ?? '';
    filterOKR = filterOKR === id ? '' : id;
  }
</script>

<section class="task-list-section" aria-label="Task List">
  <!-- Toolbar -->
  <nav class="task-toolbar" aria-label="Task controls">
    <fieldset class="task-filters" aria-label="Filter tasks">
      <select bind:value={filterStatus} aria-label="Filter by status">
        <option value="">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select bind:value={filterPriority} aria-label="Filter by priority">
        <option value="">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {#if okrFilterOptions().length > 0}
        <select bind:value={filterOKR} aria-label="Filter by OKR">
          <option value="">All OKRs</option>
          {#each okrFilterOptions() as opt (opt.id)}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      {/if}

      <input
        type="search"
        bind:value={filterSearch}
        placeholder="Search tasks..."
        aria-label="Search tasks"
      />

      {#if hasActiveFilters}
        <button type="button" data-variant="muted" onclick={clearFilters}>Clear filters</button>
      {/if}
    </fieldset>

    <button type="button" data-variant="primary" onclick={openCreateTask}>
      + New Task
    </button>
  </nav>

  <!-- Empty state -->
  {#if tasks.length === 0}
    <section class="task-empty" aria-live="polite">
      <h2>No tasks yet</h2>
      <p>Create your first task to start tracking your work.</p>
      <button type="button" data-variant="primary" data-size="lg" onclick={openCreateTask}>
        Create Task
      </button>
    </section>

  {:else if filteredTasks.length === 0}
    <section class="task-empty" aria-live="polite">
      <h2>No tasks match your filters</h2>
      <p>Try adjusting your filters or <button type="button" data-variant="link" onclick={clearFilters}>clear them</button>.</p>
    </section>

  {:else}
    <!-- Task Table -->
    <ul class="task-table" aria-label="Task list">
      {#each filteredTasks as task (task.id)}
        <li class="task-row" data-status={task.status} data-priority={task.priority}>
          <!-- Status toggle button -->
          <button
            type="button"
            class="task-status-btn"
            data-status={task.status}
            onclick={() => toggleTaskStatus(task)}
            aria-label="Status: {getStatusLabel(task.status)}. Click to advance."
            title="{getStatusLabel(task.status)}"
          >
            {#if task.status === 'completed'}✓{:else if task.status === 'in_progress'}◐{:else}○{/if}
          </button>

          <!-- Task content -->
          <task-content>
            <task-title class={task.status === 'completed' ? 'completed' : ''}>{task.title}</task-title>

            {#if task.description}
              <task-desc>{task.description}</task-desc>
            {/if}

            <!-- OKR Badges -->
            {#if task.okrLinks.length > 0}
              <task-badges>
                {#each task.okrLinks as link (link.id)}
                  <OKRBadge
                    {link}
                    objective={getObjective(link.objectiveId)}
                    keyResult={getKeyResult(link.keyResultId)}
                    onclick={handleBadgeClick}
                  />
                {/each}
              </task-badges>
            {/if}
          </task-content>

          <!-- Priority badge -->
          <task-priority style="color: {getPriorityColor(task.priority)}" aria-label="Priority: {task.priority}">
            {task.priority}
          </task-priority>

          <!-- Actions -->
          <task-actions>
            <button
              type="button"
              data-variant="action"
              onclick={() => openEditTask(task)}
              aria-label="Edit task"
            >
              Edit
            </button>
            <button
              type="button"
              data-variant="action"
              data-danger
              onclick={() => deleteTask(task)}
              aria-label="Delete task"
            >
              Delete
            </button>
          </task-actions>
        </li>
      {/each}
    </ul>

    <task-count aria-live="polite">
      {filteredTasks.length} of {tasks.length} task{tasks.length !== 1 ? 's' : ''}
      · {filteredTasks.filter((t) => t.status === 'completed').length} completed
    </task-count>
  {/if}
</section>

<!-- Task Modal -->
{#if showTaskModal}
  <TaskModal
    task={editingTask}
    {objectives}
    {keyResults}
    onClose={closeTaskModal}
  />
{/if}

<style>
  .task-list-section {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-4);
  }

  .task-toolbar {
    display: flex;
    align-items: center;
    gap: var(--okr-space-3);
    flex-wrap: wrap;
  }

  @media (max-width: 767px) {
    .task-toolbar {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .task-filters {
    display: flex;
    align-items: center;
    gap: var(--okr-space-2);
    flex: 1;
    flex-wrap: wrap;
    min-width: 0;
    border: none;
    padding: 0;
  }

  .task-empty {
    display: block;
    text-align: center;
    padding: var(--okr-space-8) var(--okr-space-4);
    background: var(--okr-color-bg-card);
    border-radius: var(--okr-radius-xl);
    box-shadow: var(--okr-shadow-sm);
  }

  .task-empty h2 {
    font-size: var(--okr-font-size-xl);
    font-weight: 700;
    color: var(--okr-color-text);
    margin-bottom: var(--okr-space-2);
  }

  .task-empty p {
    color: var(--okr-color-muted);
    margin-bottom: var(--okr-space-4);
  }

  .task-table {
    display: flex;
    flex-direction: column;
    gap: 0;
    list-style: none;
    background: var(--okr-color-bg-card);
    border-radius: var(--okr-radius-xl);
    box-shadow: var(--okr-shadow-sm);
    overflow: hidden;
  }

  .task-row {
    display: flex;
    align-items: flex-start;
    gap: var(--okr-space-3);
    padding: var(--okr-space-3) var(--okr-space-4);
    border-bottom: 1px solid var(--okr-color-border-light);
    transition: background 150ms;
  }

  .task-row:last-child {
    border-bottom: none;
  }

  .task-row:hover {
    background: var(--okr-color-bg);
  }

  .task-row[data-status="completed"] {
    opacity: 0.7;
  }

  .task-status-btn {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid var(--okr-color-border);
    background: none;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 150ms, background 150ms, color 150ms;
    margin-top: 0.1rem;
    padding: 0;
    line-height: 1;
  }

  .task-status-btn[data-status="in_progress"] {
    border-color: var(--okr-color-warning);
    color: var(--okr-color-warning);
  }

  .task-status-btn[data-status="completed"] {
    border-color: var(--okr-color-success);
    background: var(--okr-color-success);
    color: #ffffff;
  }

  .task-status-btn:hover {
    border-color: var(--okr-color-primary);
    color: var(--okr-color-primary);
  }

  task-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 0;
  }

  task-title {
    display: block;
    font-size: var(--okr-font-size-sm);
    font-weight: 600;
    color: var(--okr-color-text);
    word-break: break-word;
  }

  task-title.completed {
    text-decoration: line-through;
    color: var(--okr-color-muted);
  }

  task-desc {
    display: block;
    font-size: var(--okr-font-size-xs);
    color: var(--okr-color-muted);
    word-break: break-word;
  }

  task-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.15rem;
  }

  task-priority {
    display: inline-block;
    font-size: var(--okr-font-size-xs);
    font-weight: 600;
    text-transform: capitalize;
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  task-actions {
    display: flex;
    gap: var(--okr-space-1);
    flex-shrink: 0;
    align-items: center;
  }

  task-count {
    display: block;
    font-size: var(--okr-font-size-xs);
    color: var(--okr-color-muted);
    text-align: right;
    padding-right: var(--okr-space-2);
  }
</style>
