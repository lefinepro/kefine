<script lang="ts">
  import { browser } from '$app/environment';
  import { defaultMetrics, type Solution, type SolutionMetric } from '$lib/kefine/solutions-data';
  import SolutionMetricsMini from './SolutionMetricsMini.svelte';
  import SolutionMetricsBlock from './SolutionMetricsBlock.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
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
    onApplySolution,
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
    onApplySolution?: ((id: string) => void) | null | undefined;
    onViewSolution?: ((id: string) => void) | null | undefined;
    onSettings?: (() => void) | null | undefined;
    onClone?: (() => void) | null | undefined;
    onApplySettings?: ((next: SolversSettingsState) => void) | null | undefined;
    onSelectHistoryTask?: ((id: string) => void) | null | undefined;
  } = $props();

  type QuickTestStatus = 'idle' | 'running' | 'passed' | 'failed';
  let quickTestStatus = $state<Record<string, QuickTestStatus>>({});

  function runQuickTest(solution: Solution) {
    const test = solution.quickTest;
    if (!test || quickTestStatus[solution.id] === 'running') return;
    quickTestStatus = { ...quickTestStatus, [solution.id]: 'running' };
    const passes = test.passes ?? true;
    setTimeout(() => {
      quickTestStatus = { ...quickTestStatus, [solution.id]: passes ? 'passed' : 'failed' };
    }, 650);
  }

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
</script>

<lefine-box class="solutions-page-container">
  <lef-tasks-grid>
    <lef-tasks-aside aria-label={localeText.solversView.tasksAside}>
      <lef-tasks-aside-head>{localeText.solversView.tasksAside}</lef-tasks-aside-head>
      <lef-tasks-aside-list>
        {#each displayedHistoryTasks as task (task.id)}
          {#if onSelectHistoryTask && !task.isActive}
            <button
              type="button"
              class="aside-item-btn"
              data-active="false"
              onclick={() => onSelectHistoryTask?.(task.id)}
            >
              <lefine-text>{task.title}</lefine-text>
              {#if task.description && task.description !== task.title}
                <small>{task.description}</small>
              {/if}
            </button>
          {:else}
            <lef-tasks-aside-item data-active={task.isActive ? 'true' : 'false'}>
              <lefine-text>{task.title}</lefine-text>
              {#if task.description && task.description !== task.title}
                <small>{task.description}</small>
              {/if}
            </lef-tasks-aside-item>
          {/if}
        {/each}
      </lef-tasks-aside-list>
    </lef-tasks-aside>

    {#if !chartsFocused}
      <lef-solutions-list>
        {#each solutions as solution, i (solution.id)}
          {@const metric = metricsById.get(solution.id)}
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
            {#if metric}
              <lef-price-row aria-label={localeText.solversView.priceFrom}>
                <lef-price-figure>
                  <lef-price-label>{localeText.solversView.priceFrom}</lef-price-label>
                  <lef-price-value>{formatPrice(metric.priceUsd)}</lef-price-value>
                </lef-price-figure>
                <lef-price-meta>
                  <lef-price-meta-row>
                    <lef-meta-dot data-kind="time" aria-hidden="true"></lef-meta-dot>
                    <lefine-text>{formatSeconds(metric.executionTimeSec)}</lefine-text>
                  </lef-price-meta-row>
                  <lef-price-meta-row>
                    <lef-meta-dot data-kind="success" aria-hidden="true"></lef-meta-dot>
                    <lefine-text>{formatPercent(metric.successRate)}</lefine-text>
                  </lef-price-meta-row>
                </lef-price-meta>
              </lef-price-row>
            {/if}
            {#if solution.quickTest}
              {@const status = quickTestStatus[solution.id] ?? 'idle'}
              <lef-quick-test data-state={status} aria-label={localeText.solversView.quickTestAria}>
                <lef-quick-test-head>
                  <strong>{localeText.solversView.quickTest}</strong>
                  <lef-quick-test-cmd>{solution.quickTest.command}</lef-quick-test-cmd>
                </lef-quick-test-head>
                <lef-quick-test-title>{solution.quickTest.title}</lef-quick-test-title>
                <lef-quick-test-expect>
                  <lefine-text>{localeText.solversView.quickTestExpect}</lefine-text>
                  <strong>{solution.quickTest.expected}</strong>
                </lef-quick-test-expect>
                {#if status === 'passed' || status === 'failed'}
                  <lef-quick-test-result data-state={status}>
                    <strong>
                      {status === 'passed'
                        ? localeText.solversView.quickTestPass
                        : localeText.solversView.quickTestFail}
                    </strong>
                    {#if status === 'failed'}
                      <lefine-text>{localeText.solversView.quickTestGot}</lefine-text>
                      <code>{solution.quickTest.actual ?? '—'}</code>
                    {/if}
                  </lef-quick-test-result>
                {/if}
                <button
                  type="button"
                  class="quick-test-run"
                  disabled={status === 'running'}
                  aria-label={localeText.solversView.quickTestRun}
                  onclick={() => runQuickTest(solution)}
                >
                  {status === 'running'
                    ? localeText.solversView.quickTestRunning
                    : localeText.solversView.quickTestRun}
                </button>
              </lef-quick-test>
            {:else if solution.diffs?.length}
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
            </lef-card-actions>
          </article>
        {/each}
      </lef-solutions-list>

      <lef-task-rail aria-label={localeText.solversView.metricsAria}>
        <lef-task-rail-card>
          <lef-task-rail-head>{localeText.solversView.taskDescription}</lef-task-rail-head>
          <lef-task-rail-body>{taskTitle}</lef-task-rail-body>
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

  lef-tasks-aside-item lefine-text,
  .aside-item-btn lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    white-space: normal;
    line-height: 1.3;
    color: var(--lefine-text);
  }

  lef-tasks-aside-item,
  .aside-item-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.15rem;
  }

  lef-tasks-aside-item small,
  .aside-item-btn small {
    color: var(--lefine-text-soft);
    font-size: 0.72em;
    line-height: 1.25;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  .aside-item-btn {
    width: 100%;
    text-align: left;
    cursor: pointer;
    font: inherit;
    border: 0;
    padding: 0.5rem 0.6rem;
    border-radius: 0.55rem;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 6%, var(--kef-bg-card));
    color: var(--lefine-text);
    font-size: 0.85rem;
    transition: background 140ms ease, transform 140ms ease;
  }

  .aside-item-btn:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 12%, var(--kef-bg-card));
  }

  .aside-item-btn:active {
    transform: scale(0.98);
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

  lef-price-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.65rem;
    padding: 0.55rem 0.7rem;
    border-radius: 0.6rem;
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 7%, var(--kef-bg-card));
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 22%, var(--kef-line));
  }

  lef-price-figure {
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
    min-width: 0;
  }

  lef-price-label {
    font-size: 0.66rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-price-value {
    font-size: 1.15rem;
    font-weight: 700;
    color: var(--lefine-text);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  lef-price-meta {
    display: grid;
    gap: 0.15rem;
    justify-items: end;
    min-width: 0;
  }

  lef-price-meta-row {
    display: inline-flex;
    align-items: center;
    gap: 0.32rem;
    font-size: 0.75rem;
    color: var(--lefine-text-soft);
    font-variant-numeric: tabular-nums;
  }

  lef-meta-dot {
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
  }

  lef-meta-dot[data-kind='time'] {
    background: var(--kef-color-primary, #c89a5a);
  }

  lef-meta-dot[data-kind='success'] {
    background: var(--kef-success, #22c55e);
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

  lef-quick-test {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    padding: 0.4rem 0.5rem;
    border-radius: 0.4rem;
    /* Neutral by default — only a run colours the block (green pass / red fail). */
    border: 1px solid var(--kef-line);
    background: color-mix(in oklab, var(--kef-line) 22%, transparent);
    transition: background 160ms ease, border-color 160ms ease;
  }

  lef-quick-test[data-state='passed'] {
    border-color: color-mix(in oklab, var(--kef-success, #22c55e) 40%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #22c55e) 12%, transparent);
  }

  lef-quick-test[data-state='failed'] {
    border-color: color-mix(in oklab, var(--kef-error, #ef4444) 40%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-error, #ef4444) 12%, transparent);
  }

  lef-quick-test-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  lef-quick-test-head strong {
    font-size: 0.66rem;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: var(--lefine-text-soft);
    font-weight: 700;
  }

  lef-quick-test-cmd {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ui-monospace, monospace;
    font-size: 0.72rem;
    color: var(--lefine-text);
  }

  lef-quick-test-title {
    font-size: 0.78rem;
    color: var(--lefine-text);
    line-height: 1.35;
  }

  lef-quick-test-expect {
    display: inline-flex;
    align-items: baseline;
    gap: 0.35rem;
    font-size: 0.72rem;
    color: var(--lefine-text-soft);
  }

  lef-quick-test-expect strong {
    font-family: ui-monospace, monospace;
    font-weight: 700;
    color: var(--lefine-text);
  }

  lef-quick-test-result {
    display: inline-flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.35rem;
    font-size: 0.72rem;
  }

  lef-quick-test-result strong {
    font-weight: 700;
  }

  lef-quick-test-result[data-state='passed'] strong {
    color: var(--kef-success, #16a34a);
  }

  lef-quick-test-result[data-state='failed'] strong {
    color: var(--kef-error, #ef4444);
  }

  lef-quick-test-result lefine-text {
    color: var(--lefine-text-soft);
  }

  lef-quick-test-result code {
    font-family: ui-monospace, monospace;
    color: var(--kef-error, #ef4444);
  }

  .quick-test-run {
    align-self: flex-end;
    margin-top: 0.1rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.3rem 0.7rem;
    border-radius: 0.4rem;
    font-size: 0.72rem;
    font-weight: 700;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 14%, var(--kef-bg-card));
    color: var(--lefine-text);
    cursor: pointer;
    transition: background 140ms ease, transform 140ms ease;
  }

  .quick-test-run:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 22%, var(--kef-bg-card));
  }

  .quick-test-run:active {
    transform: scale(0.97);
  }

  .quick-test-run:disabled {
    opacity: 0.6;
    cursor: progress;
  }

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
