<script lang="ts">
  import type { Solution } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from './SolutionMetricsMini.svelte';
  import SolutionMetricsBlock from './SolutionMetricsBlock.svelte';
  import { defaultMetrics } from '$lib/kefine/solutions-data';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  let {
    solutions = [],
    taskTitle = '',
    repoName = '',
    onApplySolution,
    onViewSolution,
    onSettings,
    onClone
  }: {
    solutions?: Solution[];
    taskTitle?: string;
    repoName?: string;
    onApplySolution?: ((id: string) => void) | null | undefined;
    onViewSolution?: ((id: string) => void) | null | undefined;
    onSettings?: (() => void) | null | undefined;
    onClone?: (() => void) | null | undefined;
  } = $props();

  let chartsFocused = $state(false);

  const localeText = $derived($kefineLocaleText);
</script>

<div class="solutions-page-container">
  <lef-tasks-grid>
    <lef-tasks-aside aria-label={localeText.solversView.tasksAside}>
      <lef-tasks-aside-head>{localeText.solversView.tasksAside}</lef-tasks-aside-head>
      <lef-tasks-aside-list>
        <lef-tasks-aside-item data-active="true">
          <lefine-text>{repoName || taskTitle || localeText.solversView.solvers}</lefine-text>
          {#if repoName && taskTitle && taskTitle !== repoName}
            <small style="color:#8B5E3C; font-size:0.72em; display:block; margin-top:1px;">{taskTitle}</small>
          {/if}
        </lef-tasks-aside-item>
      </lef-tasks-aside-list>
    </lef-tasks-aside>

    {#if !chartsFocused}
      <lef-solutions-list>
        {#each solutions as solution, i (solution.id)}
          <article class="solution-card" style="--card-i: {i}">
            <header class="solution-card-header">
              <lef-solution-meta>
                <strong>{solution.solver}</strong>
                <lefine-text>{solution.title}</lefine-text>
              </lef-solution-meta>
              {#if onApplySolution}
                <button
                  type="button"
                  class="pin-button"
                  class:is-active={solution.rated ?? false}
                  data-crown-btn={solution.id}
                  aria-label={localeText.solversView.pinSolution}
                  title={localeText.solversView.pinSolution}
                  onclick={() => onApplySolution?.(solution.id)}
                >
                  <svg class="pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M12 2l2.39 6.95H21l-5.31 3.86L17.78 20 12 16.27 6.22 20l2.09-7.19L3 8.95h6.61L12 2z" />
                  </svg>
                </button>
              {/if}
            </header>
            <p class="solution-description">{solution.description}</p>
            {#if solution.diffs?.length}
                <lef-file-list aria-label={localeText.solversView.filesAria}>

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
                aria-label={localeText.solversView.view}
                title={localeText.solversView.view}
                onclick={() => onViewSolution?.(solution.id)}
              >
                <svg class="view-solution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </button>
              {#if onApplySolution}
                <button
                  type="button"
                  class="solution-merge-btn"
                  class:solution-merge-btn--merged={solution.rated ?? false}
                  aria-label={(solution.rated ?? false) ? localeText.solversView.applied : localeText.solversView.pinSolution}
                  title={(solution.rated ?? false) ? localeText.solversView.applied : localeText.solversView.pinSolution}
                  onclick={() => onApplySolution?.(solution.id)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <circle cx="6" cy="18" r="2" />
                    <circle cx="6" cy="6" r="2" />
                    <circle cx="18" cy="14" r="2" />
                    <path d="M6 8v8M6 8c0 4 6 6 12 6" />
                  </svg>
                  <lefine-text>{(solution.rated ?? false) ? localeText.solversView.applied : localeText.solversView.apply}</lefine-text>
                </button>
              {/if}
            </lef-card-actions>
          </article>
        {/each}
      </lef-solutions-list>

      <lef-task-rail
        aria-label={localeText.solversView.metricsAria}
        onclick={() => (chartsFocused = true)}
        style="cursor: pointer;"
      >
        <lef-task-rail-card>
          <lef-task-rail-head>{localeText.solversView.taskDescription}</lef-task-rail-head>
          <lef-task-rail-body>{taskTitle}</lef-task-rail-body>
        </lef-task-rail-card>

        <lef-task-rail-actions>
            <button type="button" class="task-rail-btn" aria-label={localeText.solversView.settings} onclick={() => onSettings?.()}>

            <lef-task-rail-icon aria-hidden="true">⚙</lef-task-rail-icon>
            <lefine-text>{localeText.solversView.settings}</lefine-text>
          </button>
            <button type="button" class="task-rail-btn task-rail-btn--primary" aria-label={localeText.solversView.clone} onclick={() => onClone?.()}>

            <lef-task-rail-icon aria-hidden="true">⤓</lef-task-rail-icon>
            <lefine-text>{localeText.solversView.clone}</lefine-text>
          </button>
        </lef-task-rail-actions>

        <SolutionMetricsMini
          metrics={defaultMetrics}
          activeSolverId={solutions[0]?.id ?? '5'}
          project={solutions[0]?.project}
          slug={solutions[0]?.slug}
        />
      </lef-task-rail>
    {:else}
      <!-- Charts Focused Mode -->
      <div class="charts-main" onclick={() => (chartsFocused = false)} style="cursor: pointer;">
        <SolutionMetricsBlock
          metrics={defaultMetrics}
          activeSolverId={solutions[0]?.id ?? '5'}
          title={localeText.solversView.metricsTitle}
          subtitle={localeText.solversView.metricsSubtitle}
        />
      </div>

        <lef-task-rail aria-label={localeText.solversView.compactSolversAria}>
          <lef-task-rail-card>
            <lef-task-rail-head>{localeText.solversView.solvers}</lef-task-rail-head>

        </lef-task-rail-card>

        <div class="compact-solvers">
          {#each solutions as solution}
            <div class="compact-solver" onclick={() => onViewSolution?.(solution.id)}>
              <strong>{solution.solver}</strong>
              <small>{solution.title}</small>
            </div>
          {/each}
        </div>
      </lef-task-rail>
    {/if}
  </lef-tasks-grid>
</div>

<style>
  /* Exact copy of the styles from /order/[id]/solutions/+page.svelte for 1:1 visual match in any context (thread or standalone) */
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
    gap: 1px;
    font-size: 0.75rem;
  }

  lef-file-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.15rem 0.25rem;
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-line) 35%, transparent);
  }

  lef-file-name {
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
  }

  lef-file-changes {
    display: inline-flex;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-family: ui-monospace, monospace;
  }

  lef-file-added { color: var(--kef-success, #22c55e); }
  lef-file-removed { color: var(--kef-error, #ef4444); }

  lef-card-actions {
    display: flex;
    justify-content: space-between;
    gap: 0.4rem;
    margin-top: 0.25rem;
  }

  .pin-button {
    position: relative;
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text-soft);
    cursor: pointer;
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
  }

  .pin-button.is-active {
    border-color: color-mix(in oklab, var(--kef-color-primary) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary) 14%, var(--kef-bg-card));
  }

  .pin-button.is-active .pin-svg {
    fill: currentColor;
    animation: pin-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .solution-merge-btn,
  .view-solution-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.55rem;
    border-radius: 6px;
    font-size: 0.75rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: inherit;
    cursor: pointer;
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

  .view-solution-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary) 10%, transparent);
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .view-solution-icon {
    width: 14px;
    height: 14px;
  }

  lef-task-rail {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  lef-task-rail-card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.6rem 0.7rem;
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
    line-height: 1.3;
  }

  lef-task-rail-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }

  .task-rail-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.4rem 0.6rem;
    border-radius: 0.55rem;
    font-size: 0.8rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    cursor: pointer;
  }

  .task-rail-btn--primary {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, var(--kef-line));
  }

  lef-task-rail-icon {
    display: inline-flex;
    align-items: center;
    font-size: 1rem;
  }

  /* Responsive */
  @media (max-width: 1280px) {
    lef-tasks-grid {
      grid-template-columns: minmax(220px, 1fr) minmax(0, 38rem);
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

  /* === Charts Focused Mode styles === */
  .charts-main {
    grid-column: 2;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .compact-solvers {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.5rem 0;
  }

  .compact-solver {
    padding: 0.5rem 0.6rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 6px;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 120ms ease;
  }

  .compact-solver:hover {
    background: color-mix(in oklab, var(--kef-color-primary) 8%, var(--kef-bg-card));
  }

  .compact-solver strong {
    display: block;
    font-size: 0.85rem;
    color: var(--lefine-text);
  }

  .compact-solver small {
    color: var(--lefine-text-soft);
    font-size: 0.72rem;
  }
</style>
