<script lang="ts">
  import { page } from '$app/stores';
  import { defaultSolutions, type Solution, defaultMetrics } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';

  const id = $page.params.id;
  const taskQuery = $page.url.searchParams.get('task') || '';

  const solutions: Solution[] = defaultSolutions.filter(
    (s) => s.project?.includes('go-proxy') || s.solver.includes('Proxy')
  );

  const repoName = 'kefine/go-proxy';
</script>

<svelte:head>
  <title>Solvers · {repoName}</title>
</svelte:head>

<lef-tasks-grid>
  <lef-tasks-aside aria-label="Tasks">
    <lef-tasks-aside-head>Tasks</lef-tasks-aside-head>
    <lef-tasks-aside-list>
      <lef-tasks-aside-item data-active="true">
        <lefine-text>{repoName}</lefine-text>
      </lef-tasks-aside-item>
    </lef-tasks-aside-list>
  </lef-tasks-aside>

  <lef-solutions-list>
    {#each solutions as solution, solutionIndex (solution.id)}
      <article class="solution-card" style="--card-i: {solutionIndex}">
        <header class="solution-card-header">
          <lef-solution-meta>
            <strong>{solution.solver}</strong>
            <lefine-text>{solution.title}</lefine-text>
          </lef-solution-meta>
          <button
            type="button"
            class="pin-button"
            class:is-active={solution.rated ?? false}
            data-crown-btn={solution.id}
            aria-label={solution.rated ? 'Selected solution' : 'Pin solution'}
            title={solution.rated ? 'Selected solution' : 'Pin solution'}
          >
            <svg class="pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 2l2.39 6.95H21l-5.31 3.86L17.78 20 12 16.27 6.22 20l2.09-7.19L3 8.95h6.61L12 2z"/>
            </svg>
          </button>
        </header>
        <p class="solution-description">{solution.description}</p>
        <lef-file-list aria-label="Files">
          {#each solution.diffs as diff}
            <lef-file-row>
              <lef-file-name>{diff.file}</lef-file-name>
              <lef-file-changes>
                <lef-file-added>+{diff.added}</lef-file-added>
                {#if (diff as any).removed > 0}
                  <lef-file-removed>-{(diff as any).removed}</lef-file-removed>
                {/if}
              </lef-file-changes>
            </lef-file-row>
          {/each}
        </lef-file-list>
        <lef-card-actions>
          <button type="button" class="view-solution-btn" aria-label="View code" title="View code">
            <svg class="view-solution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
          <button type="button" class="solution-merge-btn" class:solution-merge-btn--merged={solution.rated ?? false} aria-label={(solution.rated ?? false) ? 'Merged' : 'Merge solution'} title={(solution.rated ?? false) ? 'Merged' : 'Merge solution'}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="6" cy="18" r="2"></circle>
              <circle cx="6" cy="6" r="2"></circle>
              <circle cx="18" cy="14" r="2"></circle>
              <path d="M6 8v8M6 8c0 4 6 6 12 6"></path>
            </svg>
            <lefine-text>{(solution.rated ?? false) ? 'Merged' : 'Merge'}</lefine-text>
          </button>
        </lef-card-actions>
      </article>
    {/each}
  </lef-solutions-list>

  <lef-task-rail aria-label="Task description and actions">
    <lef-task-rail-card>
      <lef-task-rail-head>Task description</lef-task-rail-head>
      <lef-task-rail-body>{taskQuery || repoName}</lef-task-rail-body>
    </lef-task-rail-card>

    <lef-task-rail-actions>
      <button type="button" class="task-rail-btn" aria-label="Settings">
        <lef-task-rail-icon aria-hidden="true">⚙</lef-task-rail-icon>
        <lefine-text>Settings</lefine-text>
      </button>
      <button type="button" class="task-rail-btn task-rail-btn--primary" aria-label="Clone">
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

<style>
  /* reuse the same styles that were in KefineCreateStep for these elements */
  lef-tasks-grid {
    display: flex;
    gap: 20px;
  }
  lef-solutions-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .solution-card {
    border: 1px solid var(--kef-border, #2a2a2a);
    border-radius: 8px;
    padding: 12px 14px;
    background: var(--kef-bg, #1f1f1f);
  }
  .solution-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .pin-button {
    background: none;
    border: none;
    font-size: 16px;
    cursor: pointer;
    color: #c89a5a;
  }
</style>
