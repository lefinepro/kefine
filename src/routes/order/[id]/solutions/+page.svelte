<script lang="ts">
  import { page } from '$app/stores';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';

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
            data-crown-btn={solution.id}
            aria-label="Pin solution"
            title="Pin solution"
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
      </article>
    {/each}
  </lef-solutions-list>
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
