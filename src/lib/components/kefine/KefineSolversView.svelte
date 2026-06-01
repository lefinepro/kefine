<script lang="ts">
  import type { Solution } from '$lib/kefine/solutions-data';
  import { defaultMetrics } from '$lib/kefine/solutions-data';

  let {
    solutions = [],
    taskTitle = '',
    repoLabel = '',
    onApplySolution,
    onViewSolution,
    onSettings,
    onClone
  }: {
    solutions?: Solution[];
    taskTitle?: string;
    repoLabel?: string;
    onApplySolution?: ((id: string) => void) | null | undefined;
    onViewSolution?: ((id: string) => void) | null | undefined;
    onSettings?: (() => void) | null | undefined;
    onClone?: (() => void) | null | undefined;
  } = $props();

  const resolvedRepoLabel = $derived(repoLabel || '@example/proxy-on-go/release');
  const activeSolution = $derived(solutions[0] ?? null);
</script>

<lef-solutions-page data-testid="solution-list-page">
  <header class="repo-shell-header">
    <a class="repo-brand" href="/" aria-label="Lefine home">Lefine</a>
    <label class="repo-url-control">
      <lefine-text>Repository</lefine-text>
      <input value={resolvedRepoLabel} readonly />
    </label>
    <button type="button" class="repo-clone-button" onclick={() => onClone?.()}>clone</button>
    <button type="button" class="repo-login-button">login</button>
  </header>

  <nav class="repo-tabs" aria-label="Repository views">
    <button type="button" data-active="true">Overview</button>
    <button type="button">Checkpoints</button>
    <button type="button">Source</button>
    <button type="button" class="repo-apply" onclick={() => activeSolution && onApplySolution?.(activeSolution.id)}>Apply</button>
  </nav>

  <section class="repo-solver-layout">
    <aside class="repo-task-list" aria-label="Tasks">
      <strong>Tasks</strong>
      <button type="button" data-active="true" data-testid="solution-list-task-label">
        <lefine-text>{resolvedRepoLabel}</lefine-text>
        <lefine-meta>{taskTitle || activeSolution?.title || 'Make a go Proxy'}</lefine-meta>
      </button>
      <button type="button">
        <lefine-text>another repo#Another task</lefine-text>
        <lefine-meta>25m status</lefine-meta>
      </button>
    </aside>

    <section class="repo-test-stage" aria-label="Solver test stage">
      <header>
        <strong>Test</strong>
        <lefine-text>{taskTitle || 'Make a go Proxy'}</lefine-text>
      </header>

      <section class="repo-dragon-list" aria-label="Solver candidates">
        {#each solutions as solution, index (solution.id)}
          <article class="repo-dragon-card" data-active={index === 0}>
            <header>
              <strong>{index === 0 ? 'Dragon A' : index === 1 ? 'Dragon B' : 'Dragon C'}</strong>
              <lefine-text>{solution.title}</lefine-text>
            </header>
            <p>{solution.description}</p>
            <section class="repo-file-list" aria-label="Changed files">
              {#each solution.diffs as diff}
                <lefine-text>{diff.file} +{diff.added}</lefine-text>
              {/each}
            </section>
            <footer>
              <button type="button" aria-label="View" title="View" onclick={() => onViewSolution?.(solution.id)}>
                Source
              </button>
              <button
                type="button"
                class="solution-merge-btn"
                class:solution-merge-btn--merged={solution.rated ?? false}
                aria-label={(solution.rated ?? false) ? 'Applied' : 'Apply solution'}
                title={(solution.rated ?? false) ? 'Applied' : 'Apply solution'}
                onclick={() => onApplySolution?.(solution.id)}
              >
                {(solution.rated ?? false) ? 'Applied' : 'Apply'}
              </button>
            </footer>
          </article>
        {/each}
      </section>
    </section>

    <aside class="repo-metrics" aria-label="Metrics">
      <strong>Metrics</strong>
      <section class="repo-metric-tabs" aria-label="Metric filters">
        <button type="button" data-active="true">Speed</button>
        <button type="button">Price</button>
      </section>
      <ol>
        {#each defaultMetrics as metric, index (`metric-${metric.solverId}`)}
          <li data-active={index === 0}>
            <strong>#{index + 1}</strong>
            <lefine-text>{index === 0 ? 'Dragon A' : index === 1 ? 'Dragon B' : 'Dragon C'}</lefine-text>
            <lefine-value>{metric.executionTimeSec.toFixed(1)}s</lefine-value>
          </li>
        {/each}
      </ol>
      <section class="repo-plot" aria-label="Plot">
        <lefine-text>Plot</lefine-text>
      </section>
      <section class="repo-rail-actions" aria-label="Repository actions">
        <button type="button" onclick={() => onSettings?.()}>Settings</button>
        <button type="button" onclick={() => onClone?.()}>Clone</button>
      </section>
    </aside>
  </section>
</lef-solutions-page>

<style>
  lef-solutions-page {
    display: grid;
    gap: 0.85rem;
    width: min(100%, calc(100vw - 3rem));
    max-width: 76rem;
    margin: 1rem auto 2rem;
    color: var(--lefine-text);
  }

  .repo-shell-header,
  .repo-tabs,
  .repo-solver-layout,
  .repo-task-list,
  .repo-test-stage,
  .repo-metrics,
  .repo-dragon-card {
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--kef-bg-card) 92%, var(--kef-bg));
    box-shadow: none;
  }

  .repo-shell-header {
    display: grid;
    grid-template-columns: auto minmax(12rem, 1fr) auto auto;
    gap: 0.8rem;
    align-items: center;
    min-height: 3rem;
    padding: 0.55rem 0.7rem;
  }

  .repo-brand {
    color: var(--lefine-text);
    font-family: var(--kef-font-family-brand);
    font-size: 1.2rem;
    font-weight: 700;
    text-decoration: none;
  }

  .repo-url-control {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-width: 0;
  }

  .repo-url-control lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
  }

  .repo-url-control input {
    width: 100%;
    min-height: 2rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    color: var(--lefine-text);
    padding: 0.35rem 0.55rem;
    font: inherit;
  }

  button {
    min-height: 2rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg-soft));
    color: var(--lefine-text);
    padding: 0.35rem 0.7rem;
    font: inherit;
    font-size: 0.86rem;
  }

  .repo-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
    gap: 0.45rem;
    padding: 0.45rem;
  }

  .repo-tabs button[data-active='true'],
  .repo-apply,
  .repo-metric-tabs button[data-active='true'],
  .solution-merge-btn {
    border-color: color-mix(in oklab, var(--kef-success) 34%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success) 12%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-success) 82%, var(--lefine-text));
    font-weight: 650;
  }

  .repo-solver-layout {
    display: grid;
    grid-template-columns: minmax(10rem, 15rem) minmax(0, 1fr) minmax(16rem, 19rem);
    gap: 1rem;
    align-items: start;
    padding: 1rem;
  }

  .repo-task-list,
  .repo-test-stage,
  .repo-metrics {
    display: grid;
    gap: 0.65rem;
    padding: 0.85rem;
  }

  .repo-task-list button {
    display: grid;
    gap: 0.2rem;
    min-height: 3rem;
    text-align: left;
  }

  .repo-task-list button[data-active='true'] {
    background: color-mix(in oklab, var(--kef-success) 10%, var(--kef-bg-card));
  }

  .repo-task-list lefine-text,
  .repo-test-stage header lefine-text,
  .repo-dragon-card p,
  .repo-file-list lefine-text,
  .repo-metrics lefine-text,
  .repo-task-list lefine-meta {
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
  }

  .repo-test-stage {
    min-height: 22rem;
  }

  .repo-test-stage > header,
  .repo-dragon-card header,
  .repo-dragon-card footer,
  .repo-metric-tabs,
  .repo-rail-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: space-between;
  }

  .repo-dragon-list {
    display: grid;
    gap: 0.65rem;
  }

  .repo-dragon-card {
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .repo-dragon-card[data-active='false'] {
    opacity: 0.56;
  }

  .repo-dragon-card p {
    margin: 0;
  }

  .repo-file-list {
    display: grid;
    gap: 0.25rem;
  }

  .repo-metrics ol {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .repo-metrics li {
    display: grid;
    grid-template-columns: 2rem minmax(0, 1fr) auto;
    gap: 0.4rem;
    align-items: center;
    min-height: 2rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    padding: 0.35rem 0.5rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
  }

  .repo-metrics li[data-active='true'] {
    background: color-mix(in oklab, var(--kef-success) 12%, var(--kef-bg-card));
  }

  .repo-plot {
    display: grid;
    place-items: center;
    min-height: 8rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background:
      linear-gradient(color-mix(in oklab, var(--kef-line) 34%, transparent) 1px, transparent 1px),
      linear-gradient(90deg, color-mix(in oklab, var(--kef-line) 34%, transparent) 1px, transparent 1px),
      color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    background-size: 1.25rem 1.25rem;
  }

  @media (max-width: 980px) {
    .repo-solver-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 760px) {
    lef-solutions-page {
      width: min(100%, calc(100vw - 1rem));
    }

    .repo-shell-header,
    .repo-tabs,
    .repo-url-control {
      grid-template-columns: 1fr;
    }
  }
</style>
