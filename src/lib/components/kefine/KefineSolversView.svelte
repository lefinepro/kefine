<script lang="ts">
  import { browser } from '$app/environment';
  import { defaultMetrics, type Solution } from '$lib/kefine/solutions-data';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    buildSolverAvatars,
    solverAvatarColor,
    solverInitials
  } from '$lib/kefine/solver-avatars';
  import type { SolverHistoryTask } from '$lib/components/kefine/kefine-solver-history';
  import type { OrgReadme, OrgTodo } from '$lib/kefine/repo-docs';

  export type SolversHistoryTask = SolverHistoryTask;

  let {
    solutions = [],
    taskTitle = '',
    repoName = '',
    readme = null,
    todos = [],
    historyTasks = [],
    cloneUrl = '',
    onViewSolution,
    onSelectHistoryTask
  }: {
    solutions?: Solution[];
    taskTitle?: string;
    repoName?: string;
    readme?: OrgReadme | null;
    todos?: OrgTodo[];
    historyTasks?: SolversHistoryTask[];
    cloneUrl?: string;
    onViewSolution?: ((id: string) => void) | null | undefined;
    onSelectHistoryTask?: ((id: string) => void) | null | undefined;
  } = $props();

  // README sections other than the Brief, which is surfaced separately above.
  const readmeDetailSections = $derived(
    (readme?.sections ?? []).filter((section) => section.id !== 'brief')
  );

  let cloneTestPending = $state(false);
  let cloneTestResult = $state<{ ok: boolean; message: string } | null>(null);
  let copyFlash = $state(false);

  const resolvedCloneUrl = $derived.by(() => {
    if (cloneUrl) return cloneUrl;
    const slug = repoName ? repoName.replace(/^\/+/, '').replace(/\.git$/i, '') : 'kefine/go-proxy';
    return `git clone https://kefine.pro/${slug}.git`;
  });

  async function copyClone() {
    if (!browser) return;
    try {
      await navigator.clipboard.writeText(resolvedCloneUrl);
      copyFlash = true;
      setTimeout(() => (copyFlash = false), 1400);
    } catch {
      copyFlash = false;
    }
  }

  async function testCloneIntegration() {
    cloneTestPending = true;
    cloneTestResult = null;
    if (!browser) return;
    try {
      const url = resolvedCloneUrl.replace(/^git clone\s+/, '');
      const probe = new URL(url.replace(/\.git$/, ''));
      const response = await fetch(`${probe.origin}${probe.pathname}/info/refs?service=git-upload-pack`, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store'
      });
      cloneTestResult = response
        ? { ok: true, message: localeText.solversView.cloneTestOk }
        : { ok: false, message: localeText.solversView.cloneTestFail };
    } catch {
      cloneTestResult = { ok: false, message: localeText.solversView.cloneTestFail };
    } finally {
      cloneTestPending = false;
    }
  }

  const localeText = $derived($kefineLocaleText);

  const metricsById = $derived(
    new Map(defaultMetrics.map((metric) => [metric.solverId, metric]))
  );

  function formatPrice(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) return '—';
    if (value <= 0) return localeText.solversView.priceFree;
    if (value < 1) return `$${value.toFixed(2)}`;
    return `$${value.toFixed(2)}`;
  }

  function formatSeconds(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) return '—';
    return `${value.toFixed(1)}s`;
  }

  function formatPercent(value: number | undefined): string {
    if (value === undefined || Number.isNaN(value)) return '—';
    return `${value.toFixed(0)}%`;
  }

  const fallbackHistoryTasks = $derived<SolversHistoryTask[]>([
    {
      id: 'current',
      title: repoName || localeText.solversView.solvers,
      description: taskTitle,
      isActive: true
    }
  ]);

  const displayedHistoryTasks = $derived(
    historyTasks.length > 0 ? historyTasks : fallbackHistoryTasks
  );

  // Stacked solver avatars shown next to the active task; the solvers in
  // `solutions` are the choosable variants for that task.
  const taskSolverAvatars = $derived(buildSolverAvatars(solutions, 4));

  // Which task row is expanded. The active task starts expanded so the solver
  // variants are visible right away; clicking any row toggles it.
  let expandedTaskId = $state<string | null>(null);
  let expandedInitialized = $state(false);

  $effect(() => {
    if (expandedInitialized) return;
    const active = displayedHistoryTasks.find((task) => task.isActive);
    expandedTaskId = active?.id ?? displayedHistoryTasks[0]?.id ?? null;
    expandedInitialized = true;
  });

  function toggleTask(id: string) {
    expandedTaskId = expandedTaskId === id ? null : id;
  }
</script>

<lefine-box class="solutions-page-container" data-testid="solution-list-page">
  <lef-tasks-grid>
      <lef-main-tasks aria-label={localeText.solversView.tasksAside} data-testid="solver-task-list">
        {#if readme}
          <lef-repo-readme aria-label={localeText.solversView.readmeAria} data-testid="repo-readme">
            <lef-repo-readme-head>{localeText.solversView.readmeHeading}</lef-repo-readme-head>
            {#if readme.brief}
              <lef-repo-brief data-testid="repo-brief">
                <small>{localeText.solversView.briefHeading}</small>
                <p>{readme.brief}</p>
              </lef-repo-brief>
            {/if}
            {#each readmeDetailSections as section (section.id)}
              <lef-repo-section data-section={section.id}>
                <h3>{section.title}</h3>
                {#each section.text as line (line)}
                  <p>{line}</p>
                {/each}
                {#if section.settings.length > 0}
                  <dl>
                    {#each section.settings as setting (setting.key)}
                      <lef-repo-kv>
                        <dt>{setting.key}</dt>
                        <dd>{setting.value}</dd>
                      </lef-repo-kv>
                    {/each}
                  </dl>
                {/if}
                {#if section.links.length > 0}
                  <lef-repo-links>
                    {#each section.links as link (link.url)}
                      <a href={link.url} target="_blank" rel="noopener noreferrer">{link.label}</a>
                    {/each}
                  </lef-repo-links>
                {:else if section.items.length > 0}
                  <ul>
                    {#each section.items as item (item)}
                      <li>{item}</li>
                    {/each}
                  </ul>
                {/if}
              </lef-repo-section>
            {/each}
          </lef-repo-readme>
        {/if}

        <lef-main-task-list>
          {#each displayedHistoryTasks as task (task.id)}
            {@const isExpanded = expandedTaskId === task.id}
            {@const showVariants = task.isActive && solutions.length > 0}
            <lef-task-card
              data-testid="solver-task-row"
              data-active={task.isActive ? 'true' : 'false'}
              data-expanded={showVariants && isExpanded ? 'true' : 'false'}
            >
              {#if showVariants}
                <button
                  type="button"
                  class="task-toggle main-task-toggle"
                  data-testid="task-toggle-active"
                  aria-expanded={isExpanded}
                  aria-label={isExpanded
                    ? localeText.solversView.collapseTask
                    : localeText.solversView.expandTask}
                  onclick={() => toggleTask(task.id)}
                >
                  <lef-main-task-check aria-hidden="true"></lef-main-task-check>
                  <lef-task-toggle-main>
                    <lefine-text>{task.title}</lefine-text>
                    {#if task.description && task.description !== task.title}
                      <small>{task.description}</small>
                    {/if}
                  </lef-task-toggle-main>
                  <lef-solver-avatars
                    aria-label={localeText.solversView.solversCount(solutions.length)}
                  >
                    {#each taskSolverAvatars.avatars as avatar (avatar.id)}
                      <lef-solver-avatar
                        style="--avatar-color: {avatar.color}"
                        title={avatar.name}
                        aria-hidden="true"
                      >{avatar.initials}</lef-solver-avatar>
                    {/each}
                    {#if taskSolverAvatars.overflow > 0}
                      <lef-solver-avatar data-overflow="true" aria-hidden="true"
                        >+{taskSolverAvatars.overflow}</lef-solver-avatar
                      >
                    {/if}
                  </lef-solver-avatars>
                  <lef-task-chevron
                    data-expanded={isExpanded ? 'true' : 'false'}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </lef-task-chevron>
                </button>

                {#if isExpanded}
                  <lef-task-variants
                    data-testid="task-solver-variants"
                    aria-label={localeText.solversView.solverVariants}
                  >
                    {#each solutions as solution (solution.id)}
                      {@const variantMetric = metricsById.get(solution.id)}
                      <button
                        type="button"
                        class="task-variant"
                        data-variant={solution.id}
                        onclick={() => onViewSolution?.(solution.id)}
                      >
                        <lef-solver-avatar
                          style="--avatar-color: {solverAvatarColor(solution.solver)}"
                          aria-hidden="true"
                        >{solverInitials(solution.solver)}</lef-solver-avatar>
                        <lef-task-variant-meta>
                          <strong>{solution.solver}</strong>
                          <small>{solution.title}</small>
                        </lef-task-variant-meta>
                        {#if variantMetric}
                          <lef-task-variant-stats>
                            <strong>{formatPrice(variantMetric.priceUsd)}</strong>
                            <small>
                              {formatSeconds(variantMetric.executionTimeSec)}
                              / {formatPercent(variantMetric.successRate)}
                            </small>
                          </lef-task-variant-stats>
                        {/if}
                      </button>
                    {/each}
                  </lef-task-variants>
                {/if}
              {:else if onSelectHistoryTask && !task.isActive}
                <button
                  type="button"
                  class="task-toggle main-task-toggle task-toggle--link"
                  onclick={() => onSelectHistoryTask?.(task.id)}
                >
                  <lef-main-task-check aria-hidden="true"></lef-main-task-check>
                  <lef-task-toggle-main>
                    <lefine-text>{task.title}</lefine-text>
                    {#if task.description && task.description !== task.title}
                      <small>{task.description}</small>
                    {/if}
                  </lef-task-toggle-main>
                </button>
              {:else}
                <lef-task-static class="main-task-toggle">
                  <lef-main-task-check aria-hidden="true"></lef-main-task-check>
                  <lef-task-toggle-main>
                    <lefine-text>{task.title}</lefine-text>
                    {#if task.description && task.description !== task.title}
                      <small>{task.description}</small>
                    {/if}
                  </lef-task-toggle-main>
                </lef-task-static>
              {/if}
            </lef-task-card>
          {/each}
        </lef-main-task-list>

        {#if todos.length > 0}
          <lef-repo-todo aria-label={localeText.solversView.todoAria} data-testid="repo-todo">
            <lef-repo-todo-head>
              <lefine-text>{localeText.solversView.todoHeading}</lefine-text>
              <small>{localeText.solversView.todoCount(todos.length)}</small>
            </lef-repo-todo-head>
            <lef-repo-todo-list>
              {#each todos as todo (todo.id)}
                <lef-repo-todo-item data-done={todo.done ? 'true' : 'false'} data-testid="repo-todo-item">
                  <lef-repo-todo-check data-done={todo.done ? 'true' : 'false'} aria-hidden="true">
                    {#if todo.done}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    {/if}
                  </lef-repo-todo-check>
                  <lefine-text>{todo.title}</lefine-text>
                  {#if todo.done}
                    <lef-repo-todo-state>{localeText.solversView.todoDone}</lef-repo-todo-state>
                  {/if}
                </lef-repo-todo-item>
              {/each}
            </lef-repo-todo-list>
          </lef-repo-todo>
        {/if}
      </lef-main-tasks>

      <lef-task-rail aria-label={localeText.solversView.cloneHeading} data-testid="solver-clone-rail">
        <lef-task-rail-panel data-kind="clone">
          <lef-task-rail-head>{localeText.solversView.cloneHeading}</lef-task-rail-head>
          <lef-task-rail-clone>
            <code>{resolvedCloneUrl}</code>
            <button type="button" class="task-rail-btn" onclick={copyClone}>
              <lefine-text>
                {copyFlash ? localeText.solversView.copied : localeText.solversView.copy}
              </lefine-text>
            </button>
          </lef-task-rail-clone>
          <button
            type="button"
            class="task-rail-btn task-rail-btn--primary"
            disabled={cloneTestPending}
            onclick={testCloneIntegration}
          >
            <lefine-text>
              {cloneTestPending
                ? localeText.solversView.cloneTestRunning
                : localeText.solversView.cloneTestRun}
            </lefine-text>
          </button>
          {#if cloneTestResult}
            <lef-task-rail-status data-state={cloneTestResult.ok ? 'ok' : 'fail'}>
              {cloneTestResult.message}
            </lef-task-rail-status>
          {/if}
        </lef-task-rail-panel>
      </lef-task-rail>
  </lef-tasks-grid>
</lefine-box>

<style>
  .solutions-page-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 8px;
  }

  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 280px;
    gap: 1rem;
    align-items: start;
  }

  lef-main-tasks {
    display: block;
    min-width: 0;
  }

  lef-repo-readme {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 0.9rem 1rem 1rem;
    margin-bottom: 0.6rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
    background: var(--kef-bg-card);
  }

  lef-repo-readme-head {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-repo-brief {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.65rem 0.75rem;
    border-radius: 0.6rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 28%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, transparent);
  }

  lef-repo-brief small {
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 75%, var(--lefine-text));
  }

  lef-repo-brief p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    color: var(--lefine-text);
  }

  lef-repo-section {
    display: block;
  }

  lef-repo-section h3 {
    margin: 0 0 0.35rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  lef-repo-section p {
    margin: 0 0 0.3rem;
    font-size: 0.85rem;
    line-height: 1.4;
    color: var(--lefine-text-soft);
  }

  lef-repo-section dl {
    display: grid;
    grid-template-columns: minmax(7rem, max-content) minmax(0, 1fr);
    gap: 0.2rem 0.75rem;
    margin: 0;
  }

  lef-repo-section dl lef-repo-kv {
    display: contents;
  }

  lef-repo-section dt {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--lefine-text);
  }

  lef-repo-section dd {
    margin: 0;
    font-size: 0.8rem;
    color: var(--lefine-text-soft);
    font-family: ui-monospace, monospace;
    overflow-wrap: anywhere;
  }

  lef-repo-section ul {
    margin: 0;
    padding-left: 1.1rem;
  }

  lef-repo-section li {
    font-size: 0.82rem;
    color: var(--lefine-text-soft);
  }

  lef-repo-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  lef-repo-links a {
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.6rem;
    border-radius: 0.5rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 30%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, var(--kef-bg-card));
    color: var(--lefine-text);
    font-size: 0.8rem;
    text-decoration: none;
  }

  lef-repo-links a:hover {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 55%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 16%, var(--kef-bg-card));
  }

  lef-repo-todo {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    margin-top: 0.7rem;
    padding-top: 0.6rem;
    border-top: 1px solid var(--kef-line);
  }

  lef-repo-todo-head {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-repo-todo-head small {
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: none;
    color: var(--lefine-text-soft);
  }

  lef-repo-todo-list {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  lef-repo-todo-item {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.65rem;
    padding: 0.45rem 0.7rem;
    border-radius: 8px;
  }

  lef-repo-todo-item:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 6%, transparent);
  }

  lef-repo-todo-item[data-done='true'] lefine-text {
    color: var(--lefine-text-soft);
    text-decoration: line-through;
  }

  lef-repo-todo-item lefine-text {
    min-width: 0;
    font-size: 0.9rem;
    line-height: 1.3;
    color: var(--lefine-text);
    overflow-wrap: anywhere;
  }

  lef-repo-todo-check {
    display: inline-grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1.5px solid color-mix(in oklab, var(--kef-line) 82%, var(--lefine-text-soft));
    background: color-mix(in oklab, var(--kef-bg-card) 88%, transparent);
    color: #fff;
  }

  lef-repo-todo-check[data-done='true'] {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 70%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 80%, transparent);
  }

  lef-repo-todo-check svg {
    width: 11px;
    height: 11px;
  }

  lef-repo-todo-state {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--kef-success, #16a34a);
  }

  lef-main-task-list {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    padding: 0.1rem 0;
  }

  lef-task-card {
    display: flex;
    flex-direction: column;
    border-radius: 8px;
    border: 1px solid transparent;
    background: transparent;
    overflow: hidden;
    transition: background 140ms ease, border-color 140ms ease;
  }

  lef-task-card[data-active='true'] {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, transparent);
  }

  lef-task-card[data-expanded='true'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 24%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 6%, var(--kef-bg-card));
  }

  .task-toggle {
    cursor: pointer;
    font: inherit;
    border: 0;
    background: transparent;
    color: var(--lefine-text);
  }

  .main-task-toggle {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 0.65rem;
    width: 100%;
    min-height: 3rem;
    padding: 0.55rem 0.7rem;
    text-align: left;
    box-sizing: border-box;
  }

  .task-toggle:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 8%, transparent);
  }

  .task-toggle:active {
    transform: scale(0.99);
  }

  .main-task-toggle.task-toggle--link,
  lef-task-static.main-task-toggle {
    grid-template-columns: 18px minmax(0, 1fr);
  }

  lef-task-static {
    display: grid;
    color: var(--lefine-text);
  }

  lef-main-task-check {
    display: inline-block;
    width: 14px;
    height: 14px;
    border-radius: 4px;
    border: 1.5px solid color-mix(in oklab, var(--kef-line) 82%, var(--lefine-text-soft));
    background: color-mix(in oklab, var(--kef-bg-card) 88%, transparent);
  }

  lef-task-card[data-active='true'] lef-main-task-check {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 75%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 16%, transparent);
  }

  lef-task-toggle-main {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.12rem;
    min-width: 0;
  }

  lef-task-toggle-main lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.3;
    font-size: 0.95rem;
    color: var(--lefine-text);
  }

  lef-task-toggle-main small {
    color: var(--lefine-text-soft);
    font-size: 0.8rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  lef-solver-avatars {
    display: inline-flex;
    flex-direction: row-reverse;
    align-items: center;
    padding-left: 0.32rem;
  }

  lef-solver-avatar {
    display: inline-grid;
    place-items: center;
    width: 1.45rem;
    height: 1.45rem;
    border-radius: 999px;
    background: var(--avatar-color, color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, var(--kef-bg-card)));
    color: #fff;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
    box-shadow: 0 0 0 2px var(--kef-bg-card);
    text-transform: uppercase;
  }

  lef-solver-avatars lef-solver-avatar {
    margin-left: -0.45rem;
  }

  lef-solver-avatars lef-solver-avatar:first-child {
    margin-left: 0;
  }

  lef-solver-avatar[data-overflow='true'] {
    background: color-mix(in oklab, var(--kef-line) 70%, var(--kef-bg-card));
    color: var(--lefine-text-soft);
    font-size: 0.58rem;
  }

  lef-task-chevron {
    display: inline-flex;
    align-items: center;
    color: var(--lefine-text-soft);
    transition: transform 160ms ease;
  }

  lef-task-chevron svg {
    width: 14px;
    height: 14px;
  }

  lef-task-chevron[data-expanded='true'] {
    transform: rotate(180deg);
  }

  lef-task-variants {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding: 0.1rem 0.7rem 0.65rem 2.95rem;
    animation: task-variants-appear 200ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  @keyframes task-variants-appear {
    from { opacity: 0; transform: translateY(-3px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (prefers-reduced-motion: reduce) {
    lef-task-variants {
      animation: none;
    }
  }

  .task-variant {
    display: grid;
    grid-template-columns: 1.45rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    padding: 0.45rem 0.55rem;
    text-align: left;
    cursor: pointer;
    font: inherit;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
  }

  .task-variant:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 10%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 32%, var(--kef-line));
  }

  .task-variant:active {
    transform: scale(0.98);
  }

  lef-task-variant-meta {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  lef-task-variant-meta strong {
    font-size: 0.78rem;
    font-weight: 600;
    line-height: 1.25;
    color: var(--lefine-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-task-variant-stats {
    display: grid;
    gap: 0.05rem;
    justify-items: end;
    color: var(--lefine-text);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  lef-task-variant-stats strong {
    font-size: 0.82rem;
    font-weight: 700;
    line-height: 1.2;
  }

  lef-task-variant-stats small {
    font-size: 0.68rem;
    line-height: 1.2;
    color: var(--lefine-text-soft);
  }

  lef-task-variant-meta small {
    font-size: 0.68rem;
    line-height: 1.2;
    color: var(--lefine-text-soft);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-task-rail {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: sticky;
    top: 1rem;
  }

  lef-task-rail-head {
    display: block;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
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

  lef-task-rail-panel {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    padding: 0.7rem 0.75rem 0.8rem;
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.7rem;
    animation: task-rail-panel-appear 220ms cubic-bezier(0.22, 1, 0.36, 1) both;
    transform-origin: top center;
  }

  @keyframes task-rail-panel-appear {
    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  lef-task-rail-clone {
    display: flex;
    align-items: stretch;
    gap: 0.4rem;
    min-width: 0;
  }

  lef-task-rail-clone code {
    flex: 1 1 auto;
    min-width: 0;
    padding: 0.4rem 0.55rem;
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--kef-line) 30%, transparent);
    color: var(--lefine-text);
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-task-rail-status {
    display: block;
    padding: 0.4rem 0.55rem;
    border-radius: 0.5rem;
    font-size: 0.78rem;
    border: 1px solid transparent;
  }

  lef-task-rail-status[data-state='ok'] {
    background: color-mix(in oklab, var(--kef-success, #16a34a) 14%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 35%, var(--kef-line));
    color: var(--kef-success, #16a34a);
  }

  lef-task-rail-status[data-state='fail'] {
    background: color-mix(in oklab, var(--kef-error, #ef4444) 12%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-error, #ef4444) 35%, var(--kef-line));
    color: var(--kef-error, #ef4444);
  }

  .task-rail-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 980px) {
    lef-tasks-grid {
      grid-template-columns: minmax(0, 1fr);
    }

    lef-task-rail {
      position: static;
    }
  }

  @media (max-width: 760px) {
    .main-task-toggle {
      grid-template-columns: 18px minmax(0, 1fr) auto;
    }

    lef-solver-avatars {
      grid-column: 2;
      justify-self: start;
      padding-left: 0;
    }

    lef-task-chevron {
      grid-column: 3;
      grid-row: 1;
    }

    lef-task-variants {
      padding-left: 2.35rem;
    }

    .task-variant {
      grid-template-columns: 1.45rem minmax(0, 1fr);
    }

    lef-task-variant-stats {
      grid-column: 2;
      justify-items: start;
    }
  }
</style>
