<script lang="ts">
  import { onMount } from 'svelte';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import { defaultMetrics, defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import { solutionsStore } from '$lib/kefine/solutions-store';

  let {
    orderId,
    taskText = ''
  }: {
    orderId: string;
    taskText?: string;
  } = $props();

  let stored = $state<Solution[]>(solutionsStore.getAll());

  onMount(() => {
    if (stored.length === 0) {
      solutionsStore.set([...defaultSolutions]);
    }

    return solutionsStore.subscribe((value) => {
      stored = value;
    });
  });

  function solutionIdsForTask(value: string): string[] | null {
    const normalized = value.trim().toLowerCase();
    if (normalized.includes('мини прокси') && normalized.includes('go')) {
      return ['5', '6', '7'];
    }
    if (normalized.includes('hello world') && normalized.includes('rust')) {
      return ['1', '2', '3', '4'];
    }
    return null;
  }

  function mergeCanonicalSolution(solution: Solution): Solution {
    const canonical = defaultSolutions.find((candidate) => candidate.id === solution.id);
    if (!canonical) {
      return solution;
    }

    return {
      ...canonical,
      ...solution,
      project: solution.project ?? canonical.project,
      slug: solution.slug ?? canonical.slug
    };
  }

  const allSolutions = $derived.by<Solution[]>(() => {
    const source = stored.length > 0 ? stored : defaultSolutions;
    return source.map(mergeCanonicalSolution);
  });

  const displayedSolutions = $derived.by<Solution[]>(() => {
    const ids = solutionIdsForTask(taskText);
    if (!ids) {
      return allSolutions;
    }

    const filtered = allSolutions.filter((solution) => ids.includes(solution.id));
    return filtered.length > 0 ? filtered : allSolutions;
  });

  const activeSolution = $derived(displayedSolutions[0] ?? null);
  const repositoryLabel = $derived(activeSolution?.project ?? 'kefine/task');
  const authorLabel = $derived(activeSolution?.solver ?? 'Solver cohort');
  const taskLabel = $derived(taskText.trim() || activeSolution?.description || 'Task');

  function toggleApplied(solutionId: string) {
    solutionsStore.update((current) => {
      const source = current.length > 0 ? current : defaultSolutions;
      return source.map((solution) => {
        if (solution.id !== solutionId) {
          return mergeCanonicalSolution(solution);
        }

        return {
          ...mergeCanonicalSolution(solution),
          rated: !solution.rated
        };
      });
    });
  }
</script>

<svelte:head>
  <title>{repositoryLabel} solutions | Lefine</title>
</svelte:head>

<lef-solutions-page data-testid="solution-list-page">
  <lef-solutions-shell>
    <header class="solutions-page-header">
      <a class="solutions-back-link" href="/" aria-label="Back to task input" title="Back to task input">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
      </a>
      <lef-solutions-title>
        <strong>{repositoryLabel}</strong>
        <lefine-text>{authorLabel}</lefine-text>
      </lef-solutions-title>
      <lef-progress-circle data-complete="true" aria-label="Solutions ready">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5"></path>
        </svg>
      </lef-progress-circle>
    </header>

    <lef-solutions-layout>
      <aside class="solutions-task-column" aria-label="Tasks">
        <button
          type="button"
          class="solutions-task-entry"
          data-testid="solution-list-task-label"
          title={taskLabel}
        >
          <strong>{repositoryLabel}</strong>
          <lefine-text>{authorLabel}</lefine-text>
          <p>{taskLabel}</p>
        </button>
      </aside>

      <section class="solutions-list" aria-label="Solutions">
        {#each displayedSolutions as solution, index (solution.id)}
          <article class="solution-card" style="--solution-i: {index}">
            <header class="solution-card-header">
              <lef-solver-avatar aria-hidden="true">{solution.solver.slice(0, 1)}</lef-solver-avatar>
              <lef-solution-copy>
                <strong>{solution.title}</strong>
                <lefine-text>{solution.solver}</lefine-text>
              </lef-solution-copy>
            </header>

            <p class="solution-description">{solution.description}</p>

            <lef-file-list aria-label="Changed files">
              {#each solution.diffs as diff}
                <lef-file-row>
                  <lef-file-name>{diff.file}</lef-file-name>
                  <lef-file-changes>
                    <lef-file-added>+{diff.added}</lef-file-added>
                    {#if diff.removed > 0}
                      <lef-file-removed>-{diff.removed}</lef-file-removed>
                    {/if}
                  </lef-file-changes>
                </lef-file-row>
              {/each}
            </lef-file-list>

            <lef-card-actions>
              <a class="view-solution-link" href={`/order/${encodeURIComponent(orderId)}/solver/${solution.id}`} aria-label={`View ${solution.title} source`}>
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                <lefine-text>View code</lefine-text>
              </a>
              <button
                type="button"
                class="solution-apply"
                class:solution-apply--applied={solution.rated}
                onclick={() => toggleApplied(solution.id)}
                aria-label={solution.rated ? 'Applied solution' : 'Apply solution'}
                title={solution.rated ? 'Applied solution' : 'Apply solution'}
              >
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5"></path>
                </svg>
                <lefine-text>{solution.rated ? 'Applied' : 'Apply'}</lefine-text>
              </button>
            </lef-card-actions>
          </article>
        {/each}
      </section>

      <aside class="solutions-detail-column" aria-label="Task description and metrics">
        <section class="task-description-panel">
          <strong>Task Description</strong>
          <p>{taskLabel}</p>
        </section>
        <SolutionMetricsMini
          metrics={defaultMetrics}
          activeSolverId={activeSolution?.id ?? '5'}
          project={activeSolution?.project}
          slug={activeSolution?.slug}
        />
      </aside>
    </lef-solutions-layout>
  </lef-solutions-shell>
</lef-solutions-page>

<style>
  lef-solutions-page {
    display: block;
    min-height: 100vh;
    background: var(--kef-bg);
    color: var(--lefine-text);
  }

  lef-solutions-shell {
    display: grid;
    gap: 1rem;
    width: min(100%, calc(100vw - 3rem));
    max-width: 92rem;
    margin: 0 auto;
    padding: 1rem 0 1.5rem;
  }

  .solutions-page-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    min-height: 3rem;
  }

  .solutions-back-link,
  lef-progress-circle {
    display: inline-grid;
    place-items: center;
    width: 2.35rem;
    height: 2.35rem;
    border-radius: 999px;
    border: 1px solid var(--kef-line-soft);
    background: var(--kef-bg-card);
    color: var(--lefine-text-soft);
    text-decoration: none;
  }

  .solutions-back-link:hover {
    color: var(--lefine-text);
    border-color: var(--kef-line);
  }

  lef-progress-circle {
    color: var(--kef-success, #16a34a);
    border-color: color-mix(in oklab, currentColor 32%, var(--kef-line-soft));
    background: color-mix(in oklab, currentColor 10%, var(--kef-bg-card));
  }

  lef-solutions-title {
    display: grid;
    gap: 0.12rem;
    min-width: 0;
  }

  lef-solutions-title strong {
    overflow: hidden;
    color: var(--lefine-text);
    font-size: 1.1rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solutions-title lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
    line-height: 1.35;
  }

  lef-solutions-layout {
    display: grid;
    grid-template-columns: minmax(210px, 0.85fr) minmax(28rem, 38rem) minmax(260px, 320px);
    gap: 1rem;
    align-items: start;
  }

  .solutions-task-column,
  .solutions-detail-column {
    position: sticky;
    top: 1rem;
    display: grid;
    gap: 0.7rem;
    min-width: 0;
  }

  .solutions-task-entry {
    appearance: none;
    display: grid;
    gap: 0.18rem;
    width: 100%;
    min-height: 4.1rem;
    padding: 0.72rem 0.85rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    text-align: left;
    cursor: pointer;
  }

  .solutions-task-entry strong,
  .solutions-task-entry lefine-text,
  .solutions-task-entry p {
    min-width: 0;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solutions-task-entry strong {
    font-size: 0.92rem;
    line-height: 1.3;
  }

  .solutions-task-entry lefine-text {
    color: var(--kef-color-primary, var(--kef-primary));
    font-size: 0.78rem;
    font-weight: 650;
    line-height: 1.3;
  }

  .solutions-task-entry p {
    max-height: 0;
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
    line-height: 1.35;
    opacity: 0;
    transition:
      max-height var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease),
      opacity var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease);
  }

  .solutions-task-entry:hover p,
  .solutions-task-entry:focus-visible p {
    max-height: 2.2rem;
    opacity: 1;
  }

  .solutions-list {
    display: grid;
    gap: 0.75rem;
    min-width: 0;
  }

  .solution-card {
    --solution-i: 0;
    display: grid;
    gap: 0.65rem;
    padding: 0.85rem 0.95rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: var(--kef-bg-card);
    box-shadow: 0 1px 0 color-mix(in oklab, var(--kef-line) 60%, transparent);
    animation: solution-card-enter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--solution-i) * 60ms);
  }

  .solution-card-header {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.65rem;
    align-items: center;
  }

  lef-solver-avatar {
    display: inline-grid;
    place-items: center;
    width: 2.1rem;
    height: 2.1rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-color-primary, var(--kef-primary)) 15%, var(--kef-bg-card));
    color: var(--kef-color-primary, var(--kef-primary));
    font-weight: 800;
  }

  lef-solution-copy {
    display: grid;
    gap: 0.08rem;
    min-width: 0;
  }

  lef-solution-copy strong,
  lef-solution-copy lefine-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solution-copy strong {
    font-size: 0.95rem;
    line-height: 1.3;
  }

  lef-solution-copy lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.8rem;
  }

  .solution-description,
  .task-description-panel p {
    margin: 0;
    color: var(--lefine-text-soft);
    font-size: 0.86rem;
    line-height: 1.45;
  }

  lef-file-list {
    display: grid;
    gap: 0.35rem;
  }

  lef-file-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: center;
    min-height: 1.9rem;
    padding: 0.32rem 0.45rem;
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-soft) 60%, transparent);
  }

  lef-file-name {
    overflow: hidden;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.76rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-file-changes {
    display: inline-flex;
    gap: 0.45rem;
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.74rem;
    font-weight: 700;
  }

  lef-file-added {
    color: var(--kef-success, #16a34a);
  }

  lef-file-removed {
    color: var(--kef-error, #dc2626);
  }

  lef-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    align-items: center;
  }

  .view-solution-link,
  .solution-apply {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    min-height: 2rem;
    padding: 0.35rem 0.72rem;
    border-radius: 0.4rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font-size: 0.8rem;
    font-weight: 650;
    text-decoration: none;
    cursor: pointer;
  }

  .view-solution-link:hover,
  .solution-apply:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary, var(--kef-primary)) 35%, var(--kef-line));
  }

  .solution-apply {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 42%, var(--kef-line));
    color: var(--kef-success, #16a34a);
  }

  .solution-apply--applied {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 14%, var(--kef-bg-card));
  }

  .task-description-panel {
    display: grid;
    gap: 0.35rem;
    padding: 0.9rem 0.95rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: var(--kef-bg-card);
  }

  .task-description-panel strong {
    font-size: 0.76rem;
    font-weight: 760;
    letter-spacing: 0.06em;
    line-height: 1.3;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  @keyframes solution-card-enter {
    from {
      opacity: 0;
      transform: translateY(7px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 1180px) {
    lef-solutions-layout {
      grid-template-columns: minmax(210px, 0.85fr) minmax(0, 1.6fr);
    }

    .solutions-detail-column {
      grid-column: 1 / -1;
      position: static;
    }
  }

  @media (max-width: 760px) {
    lef-solutions-shell {
      width: min(100%, calc(100vw - 1.5rem));
      padding-top: 0.75rem;
    }

    lef-solutions-layout {
      grid-template-columns: minmax(0, 1fr);
    }

    .solutions-task-column,
    .solutions-detail-column {
      position: static;
    }

    lef-card-actions {
      justify-content: stretch;
    }

    .view-solution-link,
    .solution-apply {
      justify-content: center;
      flex: 1 1 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .solution-card {
      animation: none;
    }
  }
</style>
