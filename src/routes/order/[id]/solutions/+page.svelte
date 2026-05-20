<script lang="ts">
  import { page } from '$app/stores';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import { defaultMetrics } from '$lib/kefine/solutions-data';

  const id = $page.params.id;
  const taskQuery = $page.url.searchParams.get('task') || '';

  // For the demo "go-proxy" show the relevant solutions (Go Proxy ones)
  const solutions: Solution[] = defaultSolutions.filter(
    (s) => s.project?.includes('go-proxy') || s.solver.includes('Proxy') || s.title.includes('Proxy')
  );

  const repoName = 'kefine/go-proxy';
</script>

<svelte:head>
  <title>Solvers · {repoName}</title>
</svelte:head>

<div class="solvers-page">
  <div class="tasks-aside">
    <h2>Tasks</h2>
    <div class="task-item active">
      {repoName}
    </div>
  </div>

  <div class="solutions-list">
    {#each solutions as solution, i}
      <article class="solution-card" style="--card-i: {i}">
        <header class="solution-card-header">
          <div class="solution-meta">
            <strong>{solution.solver}</strong>
            <span class="title">{solution.title}</span>
          </div>
          <button class="pin-button" aria-label="Pin solution">
            <!-- pin icon simplified -->
            ★
          </button>
        </header>

        <p class="description">{solution.description}</p>

        <div class="file-list">
          {#each solution.diffs as diff}
            <div class="file-row">
              <span class="file-name">{diff.file}</span>
              <span class="changes">+{diff.added}</span>
            </div>
          {/each}
        </div>

        <div class="metrics">
          <SolutionMetricsMini
            metrics={defaultMetrics}
            activeSolverId={solution.id}
            project={solution.project}
            slug={solution.slug}
          />
        </div>
      </article>
    {/each}

    {#if solutions.length === 0}
      <p>No solvers found for this task yet.</p>
    {/if}
  </div>
</div>

<style>
  .solvers-page {
    display: flex;
    gap: 24px;
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }

  .tasks-aside {
    width: 220px;
    flex-shrink: 0;
  }

  .task-item {
    padding: 8px 12px;
    border-radius: 6px;
    background: var(--kef-bg-subtle, #f8f8f8);
  }
  .task-item.active {
    background: var(--kef-accent, #d3a45c);
    color: white;
  }

  .solutions-list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .solution-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 16px;
    background: white;
  }

  .solution-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .solution-meta strong {
    display: block;
    font-size: 15px;
  }

  .file-list {
    margin: 12px 0;
    font-size: 13px;
  }

  .file-row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
  }

  .changes {
    color: #2a9d5c;
    font-weight: 600;
  }

  .pin-button {
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
  }

  .metrics {
    margin-top: 12px;
  }
</style>
