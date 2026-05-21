<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
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

<div class="solutions-page-container">
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
          <button 
            type="button" 
            class="view-solution-btn" 
            aria-label="View" 
            title="View"
            onclick={() => goto(`/order/${id}/solver/${solution.id}`)}
          >
            <svg class="view-solution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
          </button>
          <button type="button" class="solution-merge-btn" class:solution-merge-btn--merged={solution.rated ?? false}                     aria-label={(solution.rated ?? false) ? 'Applied' : 'Apply solution'} title={(solution.rated ?? false) ? 'Applied' : 'Apply solution'}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="6" cy="18" r="2"></circle>
              <circle cx="6" cy="6" r="2"></circle>
              <circle cx="18" cy="14" r="2"></circle>
              <path d="M6 8v8M6 8c0 4 6 6 12 6"></path>
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
</div>

<style>
  /* === Full styles copied from KefineCreateStep.svelte for exact visual match === */
  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(160px, 200px) minmax(0, 1fr) 260px;
    gap: 1rem;
    align-items: start;
  }

  .solutions-page-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 8px;
  }

  lef-tasks-aside {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem 0.85rem 0.95rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
    position: sticky;
    top: 1rem;
  }

  lef-tasks-aside-head {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
    padding: 0.1rem 0.25rem 0.4rem;
  }

  lef-tasks-aside-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  lef-tasks-aside-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.6rem;
    border-radius: 0.55rem;
    border: 0;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, var(--kef-bg-card));
    color: var(--lefine-text);
    font-size: 0.85rem;
  }

  lef-tasks-aside-item[data-active='true'] {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
  }

  lef-tasks-aside-item lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.3;
    color: var(--lefine-text);
  }

  lef-solutions-list {
    display: grid;
    gap: 0.7rem;
    width: 100%;
  }

  .solution-card {
    --card-i: 0;
    display: grid;
    gap: 0.5rem;
    padding: 0.75rem 0.9rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-ui, 0.75rem);
    box-shadow: 0 1px 0 color-mix(in oklab, var(--kef-line) 60%, transparent);
    box-sizing: border-box;
    animation: solution-card-appear 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--card-i) * 70ms);
    transform-origin: top center;
    will-change: opacity, transform;
  }

  @keyframes solution-card-appear {
    0% {
      opacity: 0;
      transform: translateY(8px) scale(0.97);
      filter: blur(2px);
    }
    60% {
      filter: blur(0);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      filter: blur(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .solution-card {
      animation: none;
    }
  }

  .solution-card-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
  }

  lef-solution-meta {
    display: grid;
    gap: 0.1rem;
    min-width: 0;
  }

  lef-solution-meta strong {
    color: var(--lefine-text);
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solution-meta lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.875rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solution-description {
    margin: 0;
    color: var(--lefine-text-soft);
    font-size: 0.92rem;
    line-height: 1.45;
  }

  lef-file-list {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    font-family: 'Fira Code', 'Cascadia Code', ui-monospace, monospace;
    font-size: 0.78rem;
  }

  lef-file-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-width: 0;
  }

  lef-file-name {
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    flex: 1 1 auto;
  }

  lef-file-changes {
    display: inline-flex;
    gap: 0.4rem;
    font-weight: 600;
    font-size: 0.78rem;
    flex: 0 0 auto;
  }

  lef-file-added { color: var(--kef-success, #22c55e); }
  lef-file-removed { color: var(--kef-error, #ef4444); }

  lef-card-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .pin-button {
    position: relative;
    width: 28px;
    height: 28px;
    background: transparent;
    border: 1px solid var(--kef-line);
    border-radius: 0.4rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color 200ms ease,
      background-color 200ms ease,
      color 200ms ease;
    padding: 0;
    outline: none;
    flex-shrink: 0;
    color: var(--lefine-text-soft);
    -webkit-tap-highlight-color: transparent;
  }

  .pin-button:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .pin-button:active {
    transform: scale(0.96);
  }

  .pin-svg {
    width: 16px;
    height: 16px;
    transition: fill 200ms ease, stroke 200ms ease;
  }

  .pin-button.is-active {
    border-color: color-mix(in oklab, var(--kef-color-primary) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary) 14%, var(--kef-bg-card));
    color: var(--kef-color-primary);
  }

  .pin-button.is-active .pin-svg {
    fill: currentColor;
    animation: pin-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes pin-pop {
    0% { transform: scale(1); }
    50% { transform: scale(1.18); }
    100% { transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .pin-button.is-active .pin-svg { animation: none; }
  }

  /* Task rail + buttons styles (from original) */
  lef-task-rail {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    position: sticky;
    top: 1rem;
  }

  lef-task-rail-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.85rem 0.95rem 1rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
  }

  lef-task-rail-head {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-task-rail-body {
    display: block;
    font-size: 0.95rem;
    color: var(--lefine-text);
    line-height: 1.4;
    word-break: break-word;
  }

  lef-task-rail-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
  }

  .task-rail-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.55rem 0.75rem;
    border-radius: 0.55rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 160ms ease, border-color 160ms ease;
  }

  .task-rail-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 30%, var(--kef-line));
  }

  .task-rail-btn--primary {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, var(--kef-line));
  }

  lef-task-rail-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.05rem;
    height: 1.05rem;
    font-size: 0.95rem;
    line-height: 1;
    color: var(--lefine-text);
  }

  /* Responsive */
  @media (max-width: 1280px) {
    lef-tasks-grid {
      grid-template-columns: minmax(220px, 1fr) minmax(0, 38rem);
    }
    lef-task-rail {
      grid-column: 1 / -1;
      position: static;
    }
  }

  @media (max-width: 760px) {
    lef-tasks-grid {
      grid-template-columns: minmax(0, 1fr);
    }
    lef-tasks-aside,
    lef-task-rail {
      position: static;
    }
  }

  /* Merge button (was missing) */
  .solution-merge-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.28rem 0.6rem;
    border-radius: 0.4rem;
    border: 1px solid color-mix(in oklab, var(--kef-success, #16a34a) 35%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 10%, var(--kef-bg-card));
    color: var(--kef-success, #16a34a);
    font-size: 0.74rem;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      transform 120ms ease;
  }

  .solution-merge-btn:hover {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 18%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  .solution-merge-btn:active {
    transform: scale(0.97);
  }

  .solution-merge-btn--merged {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 22%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

  /* View code button styles (was incomplete) */
  .view-solution-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 28px;
    padding: 0;
    background: transparent;
    color: var(--lefine-text-soft);
    border: 1px solid var(--kef-line);
    border-radius: 0.4rem;
    cursor: pointer;
    transition:
      background-color 160ms ease,
      border-color 160ms ease,
      color 160ms ease,
      transform 120ms ease;
  }

  .view-solution-icon {
    width: 14px;
    height: 14px;
  }

  .view-solution-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary) 10%, transparent);
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .view-solution-btn:active {
    transform: scale(0.97);
  }
</style>
