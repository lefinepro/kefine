<script lang="ts">
  import type { Solution } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from './SolutionMetricsMini.svelte';
  import { defaultMetrics } from '$lib/kefine/solutions-data';

  let {
    solutions = [],
    taskTitle = '',
    onApplySolution,
    onViewSolution,
    onSettings,
    onClone
  }: {
    solutions?: Solution[];
    taskTitle?: string;
    onApplySolution?: (id: string) => void;
    onViewSolution?: (id: string) => void;
    onSettings?: () => void;
    onClone?: () => void;
  } = $props();
</script>

<div class="solutions-page-container">
  <lef-tasks-grid>
    <lef-tasks-aside aria-label="Tasks">
      <lef-tasks-aside-head>Tasks</lef-tasks-aside-head>
      <lef-tasks-aside-list>
        <lef-tasks-aside-item data-active="true">
          <lefine-text>{taskTitle || 'Solvers'}</lefine-text>
        </lef-tasks-aside-item>
      </lef-tasks-aside-list>
    </lef-tasks-aside>

    <lef-solutions-list>
      {#each solutions as solution, i (solution.id)}
        <article class="solution-card" style="--card-i: {i}">
          <header class="solution-card-header">
            <lef-solution-meta>
              <strong>{solution.solver}</strong>
              <lefine-text>{solution.title}</lefine-text>
            </lef-solution-meta>
            <button
              type="button"
              class="pin-button"
              data-crown-btn={solution.id}
              aria-label="Pin solution"
              title="Pin solution"
              onclick={() => onApplySolution?.(solution.id)}
            >
              <svg class="pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 2l2.39 6.95H21l-5.31 3.86L17.78 20 12 16.27 6.22 20l2.09-7.19L3 8.95h6.61L12 2z" />
              </svg>
            </button>
          </header>
          <p class="solution-description">{solution.description}</p>
          {#if solution.diffs?.length}
            <lef-file-list aria-label="Files">
              {#each solution.diffs as diff}
                <lef-file-row>
                  <lef-file-name>{diff.file}</lef-file-name>
                  <lef-file-changes>
                    <lef-file-added>+{diff.added}</lef-file-added>
                    {#if (diff as any).removed}
                      <lef-file-removed>-{(diff as any).removed}</lef-file-removed>
                    {/if}
                  </lef-file-changes>
                </lef-file-row>
              {/each}
            </lef-file-list>
          {/if}
          <lef-card-actions>
            <button
              type="button"
              class="view-solution-btn"
              aria-label="View"
              title="View"
              onclick={() => onViewSolution?.(solution.id)}
            >
              <svg class="view-solution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>
            <button
              type="button"
              class="solution-merge-btn"
              class:solution-merge-btn--merged={solution.rated ?? false}
              aria-label={(solution.rated ?? false) ? 'Applied' : 'Apply solution'}
              title={(solution.rated ?? false) ? 'Applied' : 'Apply solution'}
              onclick={() => onApplySolution?.(solution.id)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="6" cy="18" r="2" />
                <circle cx="6" cy="6" r="2" />
                <circle cx="18" cy="14" r="2" />
                <path d="M6 8v8M6 8c0 4 6 6 12 6" />
              </svg>
              <lefine-text>{(solution.rated ?? false) ? 'Applied' : 'Apply'}</lefine-text>
            </button>
          </lef-card-actions>
        </article>
      {/each}
    </lef-solutions-list>

    <lef-task-rail aria-label="Task description and actions">
      <lef-task-rail-card>
        <lef-task-rail-head>Task description</lef-task-rail-head>
        <lef-task-rail-body>{taskTitle}</lef-task-rail-body>
      </lef-task-rail-card>

      <lef-task-rail-actions>
        <button type="button" class="task-rail-btn" aria-label="Settings" onclick={onSettings}>
          <lef-task-rail-icon aria-hidden="true">⚙</lef-task-rail-icon>
          <lefine-text>Settings</lefine-text>
        </button>
        <button type="button" class="task-rail-btn task-rail-btn--primary" aria-label="Clone" onclick={onClone}>
          <lef-task-rail-icon aria-hidden="true">⤓</lef-task-rail-icon>
          <lefine-text>Clone</lefine-text>
        </button>
      </lef-task-rail-actions>

      <SolutionMetricsMini
        metrics={defaultMetrics}
        activeSolverId={solutions[0]?.id ?? '5'}
        project={solutions[0]?.project}
        slug={solutions[0]?.slug}
      />
    </lef-task-rail>
  </lef-tasks-grid>
</div>

<style>
  /* Styles copied from the reference standalone solutions page to make it look identical */
  .solutions-page-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 8px;
  }

  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(160px, 200px) minmax(0, 1fr) 260px;
    gap: 1rem;
    align-items: start;
  }

  lef-tasks-aside {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  lef-tasks-aside-head {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--apkt-tokens-theme-textSecondary);
    padding: 0 0.5rem;
  }

  lef-tasks-aside-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  lef-tasks-aside-item {
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
  }

  lef-tasks-aside-item[data-active="true"] {
    background: var(--apkt-tokens-theme-foregroundSecondary);
  }

  lef-solutions-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .solution-card {
    background: var(--apkt-tokens-theme-foregroundPrimary);
    border: 1px solid var(--apkt-tokens-theme-borderPrimary);
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .solution-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-solution-meta {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .solution-description {
    margin: 0;
    font-size: 0.9rem;
    color: var(--apkt-tokens-theme-textSecondary);
  }

  lef-file-list {
    display: flex;
    flex-direction: column;
    gap: 1px;
    font-size: 0.75rem;
  }

  lef-card-actions {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .pin-button {
    background: none;
    border: none;
    padding: 0.2rem;
    color: var(--apkt-tokens-theme-iconDefault);
    cursor: pointer;
    opacity: 0.7;
  }

  .pin-button:hover {
    opacity: 1;
  }

  .solution-merge-btn,
  .view-solution-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.55rem;
    border-radius: 6px;
    font-size: 0.75rem;
    border: 1px solid var(--apkt-tokens-theme-borderPrimary);
    background: var(--apkt-tokens-theme-foregroundSecondary);
    color: inherit;
    cursor: pointer;
  }

  lef-task-rail {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  lef-task-rail-actions {
    display: flex;
    gap: 0.4rem;
  }

  .task-rail-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.35rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    border: 1px solid var(--apkt-tokens-theme-borderPrimary);
    background: var(--apkt-tokens-theme-foregroundSecondary);
    color: inherit;
    cursor: pointer;
  }

  .task-rail-btn--primary {
    background: var(--apkt-tokens-core-backgroundAccentPrimary);
    color: white;
    border-color: transparent;
  }
</style>
