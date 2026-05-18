<script lang="ts">
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import { defaultMetrics, defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import { solutionsStore } from '$lib/kefine/solutions-store';
  import {
    deriveSolutionTaskRepositoryLabel,
    resolveSolutionTask
  } from '$lib/kefine/solution-task';

  let {
    taskText,
    authorLabel = 'you',
    onOpenSolution,
    onOpenTask
  }: {
    taskText: string;
    authorLabel?: string;
    onOpenSolution?: (solutionId: string) => void;
    onOpenTask?: () => void;
  } = $props();

  const taskPreset = $derived(resolveSolutionTask(taskText));
  const taskRepoLabel = $derived(deriveSolutionTaskRepositoryLabel(taskText));
  const taskDisplayLabel = $derived(`${taskRepoLabel}: ${authorLabel || 'you'}`);
  const displayedSolutions = $derived.by(() => {
    const availableSolutions = $solutionsStore.length > 0 ? $solutionsStore : defaultSolutions;
    const ids = taskPreset?.solutionIds;
    if (!ids) {
      return availableSolutions;
    }

    return ids
      .map(
        (id) =>
          availableSolutions.find((solution) => solution.id === id) ??
          defaultSolutions.find((solution) => solution.id === id)
      )
      .filter((solution): solution is Solution => Boolean(solution));
  });
  const activeSolverId = $derived(displayedSolutions[0]?.id ?? taskPreset?.solutionIds[0] ?? '5');

  $effect(() => {
    const current = solutionsStore.getAll();
    const missingSolutions = defaultSolutions.filter((solution) => !current.some((item) => item.id === solution.id));
    if (missingSolutions.length > 0) {
      solutionsStore.set([...current, ...missingSolutions]);
    }
  });

  function handleOpenTaskKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onOpenTask?.();
  }

  function handleCrownClick(solutionId: string) {
    const index = $solutionsStore.findIndex((solution) => solution.id === solutionId);
    if (index === -1) {
      return;
    }

    solutionsStore.update((list) => {
      const nextSolutions = [...list];
      const solution = nextSolutions[index];
      if (solution) {
        nextSolutions[index] = { ...solution, rated: !solution.rated };
      }
      return nextSolutions;
    });
  }
</script>

<kefine-solver-results>
  <section data-part="tasks-list">
    <kefine-solver-search-row aria-live="polite" title={taskText}>
      <lefine-text>{taskDisplayLabel}</lefine-text>
      <kefine-solver-search-indicator aria-label="Matching solvers" title="Matching solvers">
        <kefine-solver-search-dot aria-hidden="true"></kefine-solver-search-dot>
      </kefine-solver-search-indicator>
    </kefine-solver-search-row>

    <lef-tasks-grid>
      <lef-tasks-aside aria-label="Tasks">
        <lef-tasks-aside-head>Tasks</lef-tasks-aside-head>
        <lef-tasks-aside-list>
          <lef-tasks-aside-item
            data-active="true"
            title={taskText}
            role="button"
            tabindex="0"
            onclick={() => onOpenTask?.()}
            onkeydown={handleOpenTaskKeydown}
          >
            <lef-tasks-aside-default><lefine-text>{taskDisplayLabel}</lefine-text></lef-tasks-aside-default>
            <lef-tasks-aside-hover><lefine-text>Your task</lefine-text></lef-tasks-aside-hover>
            <kefine-solver-search-indicator aria-label="Matching solvers" title="Matching solvers">
              <kefine-solver-search-dot aria-hidden="true"></kefine-solver-search-dot>
            </kefine-solver-search-indicator>
          </lef-tasks-aside-item>
        </lef-tasks-aside-list>
      </lef-tasks-aside>

      <lef-solutions-list>
        {#each displayedSolutions as solution, solutionIndex (solution.id)}
          <article class="solution-card" style="--card-i: {solutionIndex}">
            <header class="solution-card-header">
              <lef-solution-meta>
                <strong>{solution.solver}</strong>
                <lefine-text>{solution.title}</lefine-text>
              </lef-solution-meta>
              <button
                type="button"
                class="pin-button"
                class:is-active={solution.rated}
                onclick={() => handleCrownClick(solution.id)}
                aria-label={solution.rated ? 'Selected solution' : 'Pin solution'}
                title={solution.rated ? 'Selected solution' : 'Pin solution'}
              >
                <svg class="pin-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 2l2.39 6.95H21l-5.31 3.86L17.78 20 12 16.27 6.22 20l2.09-7.19L3 8.95h6.61L12 2z"></path>
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
                    {#if diff.removed > 0}
                      <lef-file-removed>-{diff.removed}</lef-file-removed>
                    {/if}
                  </lef-file-changes>
                </lef-file-row>
              {/each}
            </lef-file-list>

            <lef-card-actions>
              <button
                type="button"
                class="view-solution-btn"
                onclick={() => onOpenSolution?.(solution.id)}
                aria-label="View code"
                title="View code"
              >
                <svg class="view-solution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
              </button>
              <button
                type="button"
                class="solution-merge-btn"
                class:solution-merge-btn--merged={solution.rated}
                onclick={() => handleCrownClick(solution.id)}
                aria-label={solution.rated ? 'Applied' : 'Apply solution'}
                title={solution.rated ? 'Applied' : 'Apply solution'}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5"></path>
                </svg>
                <lefine-text>{solution.rated ? 'Applied' : 'Apply'}</lefine-text>
              </button>
            </lef-card-actions>
          </article>
        {/each}
      </lef-solutions-list>

      <lef-task-rail aria-label="Repository and actions">
        <lef-task-rail-card>
          <lef-task-rail-head>Repository</lef-task-rail-head>
          <lef-task-rail-body>{taskRepoLabel}</lef-task-rail-body>
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
          activeSolverId={activeSolverId}
          project={displayedSolutions[0]?.project}
          slug={displayedSolutions[0]?.slug}
        />
      </lef-task-rail>
    </lef-tasks-grid>
  </section>
</kefine-solver-results>

<style>
  kefine-solver-results {
    display: block;
    width: min(100%, calc(100vw - 7rem));
    max-width: 92rem;
    margin-inline: auto;
  }

  section[data-part='tasks-list'] {
    display: grid;
    gap: 1rem;
  }

  kefine-solver-search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.72rem;
    min-height: 2.85rem;
    padding: 0.42rem 0.5rem 0.42rem 0.78rem;
    border-radius: 0.38rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
  }

  kefine-solver-search-row lefine-text {
    min-width: 0;
    overflow: hidden;
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
    font-size: 0.92rem;
    font-weight: 650;
    line-height: 1.1;
    padding-block: 0.15rem 0;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  kefine-solver-search-indicator {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    color: color-mix(in oklab, var(--kef-primary) 88%, #5a4636);
    background: color-mix(in oklab, var(--kef-primary) 9%, var(--kef-bg-card));
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, currentColor 18%, transparent),
      0 0 0 0 color-mix(in oklab, currentColor 22%, transparent);
    animation: kefine-solver-search-pulse 1.65s var(--kef-ease-soft) infinite;
    flex: 0 0 auto;
  }

  kefine-solver-search-indicator::before {
    content: '';
    position: absolute;
    inset: 0.28rem;
    border: 2px solid color-mix(in oklab, currentColor 18%, transparent);
    border-top-color: currentColor;
    border-radius: inherit;
    animation: kefine-solver-search-spin 0.9s linear infinite;
  }

  kefine-solver-search-dot {
    display: block;
    width: 0.42rem;
    height: 0.42rem;
    border-radius: 999px;
    background: currentColor;
  }

  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(220px, 1fr) 38rem 320px;
    gap: 1rem;
    align-items: start;
  }

  lef-tasks-aside,
  lef-task-rail-card,
  .solution-card {
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
  }

  lef-tasks-aside {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    padding: 0.85rem 0.85rem 0.95rem;
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
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
    color: var(--lefine-text);
    font-size: 0.85rem;
    cursor: pointer;
    transition: background-color var(--kef-motion-fast, 160ms) var(--kef-ease-soft, ease);
  }

  lef-tasks-aside-item:hover,
  lef-tasks-aside-item:focus-visible {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 22%, var(--kef-bg-card));
    outline: none;
  }

  lef-tasks-aside-default,
  lef-tasks-aside-hover {
    display: block;
    min-width: 0;
    flex: 1;
  }

  lef-tasks-aside-hover {
    display: none;
  }

  lef-tasks-aside-item:hover lef-tasks-aside-default,
  lef-tasks-aside-item:focus-visible lef-tasks-aside-default {
    display: none;
  }

  lef-tasks-aside-item:hover lef-tasks-aside-hover,
  lef-tasks-aside-item:focus-visible lef-tasks-aside-hover {
    display: block;
  }

  lef-tasks-aside-item lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.3;
    color: var(--lefine-text);
  }

  lef-tasks-aside-item kefine-solver-search-indicator {
    width: 1.35rem;
    height: 1.35rem;
  }

  lef-tasks-aside-item kefine-solver-search-indicator::before {
    inset: 0.19rem;
    border-width: 1.5px;
  }

  lef-tasks-aside-item kefine-solver-search-dot {
    width: 0.3rem;
    height: 0.3rem;
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
    border-radius: var(--kef-radius-ui, 0.75rem);
    box-shadow: 0 1px 0 color-mix(in oklab, var(--kef-line) 60%, transparent);
    box-sizing: border-box;
    animation: solution-card-appear 480ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: calc(var(--card-i) * 70ms);
    transform-origin: top center;
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

  lef-solution-meta lefine-text,
  .solution-description,
  lef-file-name {
    color: var(--lefine-text-soft);
  }

  lef-solution-meta lefine-text {
    font-size: 0.875rem;
    line-height: 1.3;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .solution-description {
    margin: 0;
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

  .pin-button,
  .view-solution-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
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

  .pin-button {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .view-solution-btn {
    width: 30px;
    height: 28px;
  }

  .pin-svg {
    width: 16px;
    height: 16px;
  }

  .view-solution-icon {
    width: 14px;
    height: 14px;
  }

  .pin-button:hover,
  .view-solution-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary) 10%, transparent);
    border-color: color-mix(in oklab, var(--kef-color-primary) 40%, var(--kef-line));
    color: var(--kef-color-primary);
  }

  .pin-button:active,
  .view-solution-btn:active,
  .solution-merge-btn:active,
  .task-rail-btn:active {
    transform: scale(0.97);
  }

  .pin-button.is-active {
    border-color: color-mix(in oklab, var(--kef-color-primary) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary) 14%, var(--kef-bg-card));
    color: var(--kef-color-primary);
  }

  .pin-button.is-active .pin-svg {
    fill: currentColor;
  }

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

  .solution-merge-btn:hover,
  .solution-merge-btn--merged {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 18%, var(--kef-bg-card));
    border-color: var(--kef-success, #16a34a);
  }

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
    transition:
      background 160ms ease,
      border-color 160ms ease,
      transform 120ms ease;
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

  @keyframes kefine-solver-search-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes kefine-solver-search-pulse {
    50% {
      box-shadow:
        inset 0 0 0 1px color-mix(in oklab, currentColor 18%, transparent),
        0 0 0 0.42rem color-mix(in oklab, currentColor 0%, transparent);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .solution-card,
    kefine-solver-search-indicator,
    kefine-solver-search-indicator::before {
      animation: none;
    }
  }

  @media (max-width: 1280px) {
    lef-tasks-grid {
      grid-template-columns: minmax(220px, 1fr) minmax(0, 38rem);
    }

    lef-task-rail {
      grid-column: 1 / -1;
      position: static;
    }
  }

  @media (max-width: 1180px) {
    lef-tasks-grid {
      grid-template-columns: minmax(200px, 1fr) minmax(0, 38rem);
    }
  }

  @media (max-width: 760px) {
    kefine-solver-results {
      width: min(100%, calc(100vw - 2rem));
    }

    lef-tasks-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    lef-tasks-aside,
    lef-task-rail {
      position: static;
    }

    lef-task-rail-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
