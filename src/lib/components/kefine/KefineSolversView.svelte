<script lang="ts">
  import { browser } from '$app/environment';
  import { defaultMetrics, type Solution, type SolutionMetric } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from './SolutionMetricsMini.svelte';
  import SolutionMetricsBlock from './SolutionMetricsBlock.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    buildSolverAvatars,
    solverAvatarColor,
    solverInitials
  } from '$lib/kefine/solver-avatars';
  import type { SolverHistoryTask } from '$lib/components/kefine/kefine-solver-history';

  export type SolversHistoryTask = SolverHistoryTask;

  export type SolversSettingsState = {
    isPublic: boolean;
    vcsEnabled: boolean;
    defaultBranch: string;
  };

  let {
    solutions = [],
    taskTitle = '',
    repoName = '',
    historyTasks = [],
    cloneUrl = '',
    settingsState = { isPublic: true, vcsEnabled: true, defaultBranch: 'main' },
    onViewSolution,
    onSettings,
    onClone,
    onApplySettings,
    onSelectHistoryTask
  }: {
    solutions?: Solution[];
    taskTitle?: string;
    repoName?: string;
    historyTasks?: SolversHistoryTask[];
    cloneUrl?: string;
    settingsState?: SolversSettingsState;
    onViewSolution?: ((id: string) => void) | null | undefined;
    onSettings?: (() => void) | null | undefined;
    onClone?: (() => void) | null | undefined;
    onApplySettings?: ((next: SolversSettingsState) => void) | null | undefined;
    onSelectHistoryTask?: ((id: string) => void) | null | undefined;
  } = $props();

  let chartsFocused = $state(false);
  let clonePanelOpen = $state(false);
  let settingsPanelOpen = $state(false);
  let cloneTestPending = $state(false);
  let cloneTestResult = $state<{ ok: boolean; message: string } | null>(null);
  let copyFlash = $state(false);
  let isPublicDraft = $state(true);
  let vcsEnabledDraft = $state(true);
  let branchDraft = $state('main');

  $effect(() => {
    isPublicDraft = settingsState.isPublic;
    vcsEnabledDraft = settingsState.vcsEnabled;
    branchDraft = settingsState.defaultBranch;
  });

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

  function openClone() {
    settingsPanelOpen = false;
    clonePanelOpen = !clonePanelOpen;
    onClone?.();
  }

  function openSettings() {
    clonePanelOpen = false;
    settingsPanelOpen = !settingsPanelOpen;
    onSettings?.();
  }

  function applySettings() {
    onApplySettings?.({
      isPublic: isPublicDraft,
      vcsEnabled: vcsEnabledDraft,
      defaultBranch: branchDraft.trim() || 'main'
    });
    settingsPanelOpen = false;
  }

  function setChartsFocusedFromKeyboard(event: KeyboardEvent, focused: boolean) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    chartsFocused = focused;
  }

  const localeText = $derived($kefineLocaleText);

  const metricsById = $derived(
    new Map(defaultMetrics.map((metric) => [metric.solverId, metric]))
  );

  const visibleMetrics = $derived.by<SolutionMetric[]>(() => {
    const metrics = solutions
      .map((solution) => metricsById.get(solution.id))
      .filter((metric): metric is SolutionMetric => Boolean(metric));

    return metrics.length > 0 ? metrics : defaultMetrics;
  });

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
    {#if !chartsFocused}
      <lef-main-tasks aria-label={localeText.solversView.tasksAside} data-testid="solver-task-list">
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
      </lef-main-tasks>

      <lef-task-rail aria-label={localeText.solversView.metricsAria}>
        <lef-task-rail-card>
          <lef-task-rail-head>{localeText.solversView.taskDescription}</lef-task-rail-head>
          <lef-task-rail-body data-testid="solution-list-task-label">{repoName || taskTitle}</lef-task-rail-body>
          {#if repoName && taskTitle}
            <small>{taskTitle}</small>
          {/if}
        </lef-task-rail-card>

        <lef-task-rail-actions>
          <button
            type="button"
            class="task-rail-btn"
            aria-expanded={settingsPanelOpen}
            aria-label={localeText.solversView.settings}
            onclick={openSettings}
          >
            <lef-task-rail-icon aria-hidden="true">⚙</lef-task-rail-icon>
            <lefine-text>{localeText.solversView.settings}</lefine-text>
          </button>
          <button
            type="button"
            class="task-rail-btn task-rail-btn--primary"
            aria-expanded={clonePanelOpen}
            aria-label={localeText.solversView.clone}
            onclick={openClone}
          >
            <lef-task-rail-icon aria-hidden="true">⤓</lef-task-rail-icon>
            <lefine-text>{localeText.solversView.clone}</lefine-text>
          </button>
        </lef-task-rail-actions>

        {#if clonePanelOpen}
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
        {/if}

        {#if settingsPanelOpen}
          <lef-task-rail-panel data-kind="settings">
            <lef-task-rail-head>{localeText.solversView.settingsHeading}</lef-task-rail-head>
            <label class="settings-row">
              <input type="checkbox" bind:checked={isPublicDraft} />
              <lefine-text>{localeText.solversView.settingsPublic}</lefine-text>
            </label>
            <label class="settings-row">
              <input type="checkbox" bind:checked={vcsEnabledDraft} />
              <lefine-text>{localeText.solversView.settingsVcs}</lefine-text>
            </label>
            <label class="settings-row settings-row--input">
              <lefine-text>{localeText.solversView.settingsBranch}</lefine-text>
              <input type="text" bind:value={branchDraft} maxlength="40" />
            </label>
            <button type="button" class="task-rail-btn task-rail-btn--primary" onclick={applySettings}>
              <lefine-text>{localeText.solversView.settingsApply}</lefine-text>
            </button>
          </lef-task-rail-panel>
        {/if}

        <!-- Clicking anywhere inside the metrics area expands the detailed charts.
             Buttons above are safe because they have their own handlers and stop propagation implicitly by being separate. -->
        <lefine-box
          role="button"
          tabindex="0"
          aria-label={localeText.solversView.metricsAria}
          onclick={() => (chartsFocused = true)}
          onkeydown={(event: KeyboardEvent) => setChartsFocusedFromKeyboard(event, true)}
          style="cursor: pointer;"
        >
          <SolutionMetricsMini
            metrics={visibleMetrics}
            activeSolverId={solutions[0]?.id ?? visibleMetrics[0]?.solverId ?? '5'}
            project={solutions[0]?.project}
            slug={solutions[0]?.slug}
          />
        </lefine-box>
      </lef-task-rail>
    {:else}
      <!-- Charts Focused Mode -->
      <lefine-box
        class="charts-main"
        role="button"
        tabindex="0"
        aria-label={localeText.solversView.metricsAria}
        onclick={() => (chartsFocused = false)}
        onkeydown={(event: KeyboardEvent) => setChartsFocusedFromKeyboard(event, false)}
        style="cursor: pointer;"
      >
        <SolutionMetricsBlock
          metrics={visibleMetrics}
          activeSolverId={solutions[0]?.id ?? visibleMetrics[0]?.solverId ?? '5'}
          title={localeText.solversView.metricsTitle}
          subtitle={localeText.solversView.metricsSubtitle}
        />
      </lefine-box>

        <lef-task-rail aria-label={localeText.solversView.compactSolversAria}>
          <lef-task-rail-card>
            <lef-task-rail-head>{localeText.solversView.solvers}</lef-task-rail-head>

        </lef-task-rail-card>

        <lefine-box class="compact-solvers">
          {#each solutions as solution}
            <button type="button" class="compact-solver" onclick={() => onViewSolution?.(solution.id)}>
              <strong>{solution.solver}</strong>
              <small>{solution.title}</small>
            </button>
          {/each}
        </lefine-box>
      </lef-task-rail>
    {/if}
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

  .settings-row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    font-size: 0.85rem;
    color: var(--lefine-text);
    cursor: pointer;
  }

  .settings-row input[type='checkbox'] {
    accent-color: var(--kef-color-primary, #c89a5a);
    width: 16px;
    height: 16px;
  }

  .settings-row--input {
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    cursor: default;
  }

  .settings-row--input lefine-text {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  .settings-row--input input[type='text'] {
    width: 100%;
    padding: 0.4rem 0.55rem;
    border-radius: 0.5rem;
    border: 1px solid var(--kef-line);
    background: var(--kef-bg-card);
    color: var(--lefine-text);
    font: inherit;
    font-size: 0.85rem;
  }

  .settings-row--input input[type='text']:focus-visible {
    outline: 2px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 50%, transparent);
    outline-offset: 1px;
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

  /* === Charts Focused Mode styles === */
  .charts-main {
    grid-column: auto;
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
