<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Icon from '@iconify/svelte';
  import { defaultMetrics, type Solution, type SolutionMetric } from '$lib/kefine/solutions-data';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import KefineSolverBadge from '$lib/components/kefine/KefineSolverBadge.svelte';
  import KefineSolversModal from '$lib/components/kefine/KefineSolversModal.svelte';
  import {
    rankSolvers,
    badgeForSolver,
    type SolverRankingMetric
  } from '$lib/kefine/solver-badges';
  import {
    buildSolverAvatars,
    solverAvatarColor,
    solverInitials
  } from '$lib/kefine/solver-avatars';
  import {
    requestTopbarSearch,
    topbarSearchActions,
    topbarSearchItems,
    type TopbarSearchAction,
    type TopbarSearchItem
  } from '$lib/kefine/topbar-search-context';
  import type { SolverHistoryTask } from '$lib/components/kefine/kefine-solver-history';
  import type { OrgReadme, OrgTodo, OrgTodoState } from '$lib/kefine/repo-docs';

  export type SolversHistoryTask = SolverHistoryTask;

  type RepoContentView = 'readme' | 'settings' | 'clone';

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

  const readmeSettingsSection = $derived(
    (readme?.sections ?? []).find((section) => section.id === 'settings') ?? null
  );

  // README sections visible in the main flow. Settings move to a URL-backed
  // page, while Folder layout and Demonstration are intentionally omitted per
  // review feedback.
  const readmeVisibleSections = $derived(
    (readme?.sections ?? []).filter(
      (section) => !['brief', 'settings', 'folder-layout', 'demonstration'].includes(section.id)
    )
  );
  const hasRepoDocs = $derived(Boolean(readme) || todos.length > 0);

  function normalizeProjectPath(value: string): string {
    return value.trim().replace(/^@+/, '').replace(/^\/+/, '').replace(/\.git$/i, '');
  }

  function displayProjectPath(value: string): string {
    const normalized = normalizeProjectPath(value);
    return normalized ? `@${normalized}` : '';
  }

  const displayRepoName = $derived(displayProjectPath(readme?.title || repoName || 'kefine/go-proxy'));

  let copyFlash = $state(false);

  const repoContentView = $derived.by((): RepoContentView => {
    const view = page.url.searchParams.get('view');
    if (view === 'settings' && readmeSettingsSection) return 'settings';
    if (view === 'clone') return 'clone';
    return 'readme';
  });

  const resolvedCloneTarget = $derived.by(() => {
    if (cloneUrl) return cloneUrl.trim().replace(/^git\s+clone\s+/i, '');
    const slug = repoName ? normalizeProjectPath(repoName) : 'kefine/go-proxy';
    return `https://kefine.pro/${slug}.git`;
  });

  const resolvedCloneCommand = $derived(`git clone ${resolvedCloneTarget}`);

  function repoViewHref(view: RepoContentView): string {
    const url = new URL(page.url);
    if (view === 'readme') {
      url.searchParams.delete('view');
    } else {
      url.searchParams.set('view', view);
    }
    return `${url.pathname}${url.search}${url.hash}`;
  }

  function openRepoView(view: RepoContentView) {
    void goto(repoViewHref(view), { keepFocus: true });
  }

  async function copyClone() {
    if (!browser) return;
    try {
      await navigator.clipboard.writeText(resolvedCloneCommand);
      copyFlash = true;
      setTimeout(() => (copyFlash = false), 1400);
    } catch {
      copyFlash = false;
    }
  }

  const localeText = $derived($kefineLocaleText);

  $effect(() => {
    const actions: TopbarSearchAction[] = [
      {
        id: 'repo-clone',
        label: copyFlash
          ? localeText.solversView.copied
          : localeText.solversView.openRepositoryClone,
        icon: 'download' as const,
        testId: 'repo-clone-trigger',
        onClick: () => openRepoView('clone')
      }
    ];

    if (readmeSettingsSection) {
      actions.push({
        id: 'repo-settings',
        label: localeText.solversView.openRepositorySettings,
        icon: 'settings' as const,
        testId: 'repo-settings-trigger',
        onClick: () => openRepoView('settings')
      });
    }

    topbarSearchActions.set(actions);
    return () => topbarSearchActions.set([]);
  });

  function createTaskHref(query: string) {
    const task = query.trim();
    const params = new URLSearchParams();
    if (task) {
      params.set('task', task);
    }

    const project = normalizeProjectPath(displayRepoName || repoName);
    if (project) {
      params.set('project', project);
    }

    const search = params.toString();
    return search ? `/?${search}` : '/';
  }

  $effect(() => {
    const items: TopbarSearchItem[] = [
      {
        id: 'create-task',
        title: localeText.solversView.createTaskSearchTitle,
        category: localeText.solversView.tasksAside,
        actionLabel: localeText.solversView.createTaskSearchAction,
        icon: 'project' as const,
        keywords: [
          localeText.solversView.createTaskSearchTitle,
          localeText.solversView.newTaskPlaceholder,
          displayRepoName,
          'create task',
          'new task'
        ],
        hideWhenEmpty: true,
        showForQuery: (query) => query.trim().length > 0,
        subtitleFromQuery: (query) => query.trim() || displayRepoName,
        hrefFromQuery: createTaskHref
      }
    ];

    topbarSearchItems.set(items);
    return () => topbarSearchItems.set([]);
  });

  const metricsById = $derived(
    new Map(defaultMetrics.map((metric) => [metric.solverId, metric]))
  );

  // Metrics for the solvers currently offered, kept in card order. Drives both
  // the inline "Best / -x%" badges and the comparison modal.
  const solverMetrics = $derived(
    solutions
      .map((solution) => metricsById.get(solution.id))
      .filter((metric): metric is SolutionMetric => Boolean(metric))
  );

  // Default ranking mirrors the swap "best route" idea: the highest success
  // rate wins. The comparison modal can switch this to price, speed or value.
  let rankingMetric = $state<SolverRankingMetric>('success');
  const solverBadges = $derived(rankSolvers(solverMetrics, rankingMetric));
  let solversModalOpen = $state(false);

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

  type TodoStatusKind = 'todo' | 'in-progress' | 'done';

  function todoStatusKind(state: OrgTodoState): TodoStatusKind {
    if (state === 'DONE') return 'done';
    if (state === 'IN PROGRESS') return 'in-progress';
    return 'todo';
  }

  function todoStatusLabel(state: OrgTodoState): string {
    if (state === 'DONE') return localeText.solversView.todoDone;
    if (state === 'IN PROGRESS') return localeText.solversView.todoInProgress;
    return localeText.solversView.todoOpen;
  }

  const fallbackHistoryTasks = $derived<SolversHistoryTask[]>([
    {
      id: 'current',
      title: displayRepoName || localeText.solversView.solvers,
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
  let expandedTodoSolverId = $state<string | null>(null);
  let selectedTodoSolvers = $state<Record<string, string>>({});
  let newTaskText = $state('');

  $effect(() => {
    if (expandedInitialized) return;
    const active = displayedHistoryTasks.find((task) => task.isActive);
    expandedTaskId = active?.id ?? displayedHistoryTasks[0]?.id ?? null;
    expandedInitialized = true;
  });

  function toggleTask(id: string) {
    expandedTaskId = expandedTaskId === id ? null : id;
  }

  function selectedSolutionForTodo(todo: OrgTodo, index: number): Solution | undefined {
    if (solutions.length === 0) return undefined;
    const selectedId = selectedTodoSolvers[todo.id] ?? solutions[index % solutions.length]?.id;
    return solutions.find((solution) => solution.id === selectedId) ?? solutions[0];
  }

  function toggleTodoSolver(id: string) {
    expandedTodoSolverId = expandedTodoSolverId === id ? null : id;
  }

  function chooseTodoSolver(todoId: string, solutionId: string) {
    selectedTodoSolvers = { ...selectedTodoSolvers, [todoId]: solutionId };
    expandedTodoSolverId = null;
    onViewSolution?.(solutionId);
  }

  function updateNewTask(event: Event) {
    newTaskText = (event.currentTarget as HTMLInputElement).value;
  }

  function openNewTaskSearch() {
    const query = newTaskText.trim();
    if (!query) {
      return;
    }

    requestTopbarSearch({ query });
  }

  function handleNewTaskKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    event.preventDefault();
    openNewTaskSearch();
  }

</script>

<lefine-box class="solutions-page-container" data-testid="solution-list-page">
  <lef-tasks-grid>
      <lef-main-tasks aria-label={localeText.solversView.tasksAside} data-testid="solver-task-list">
        {#if repoContentView === 'settings' && readmeSettingsSection}
          <lef-repo-page data-testid="repo-settings-page">
            <lef-repo-page-head>
              <lef-repo-page-title>
                <h2>{localeText.solversView.repositorySettingsHeading}</h2>
                <p>{displayRepoName}</p>
              </lef-repo-page-title>
              <a class="repo-page-back" href={repoViewHref('readme')}>
                <Icon icon="lucide:arrow-left" width="14" height="14" aria-hidden="true" />
                <lefine-text>{localeText.solversView.backToRepository}</lefine-text>
              </a>
            </lef-repo-page-head>
            <dl class="repo-settings-list">
              {#each readmeSettingsSection.settings as setting (setting.key)}
                <lef-repo-settings-kv>
                  <dt>{setting.key}</dt>
                  <dd>{setting.value}</dd>
                </lef-repo-settings-kv>
              {/each}
            </dl>
          </lef-repo-page>
        {:else if repoContentView === 'clone'}
          <lef-repo-page data-testid="repo-clone-page">
            <lef-repo-page-head>
              <lef-repo-page-title>
                <h2>{localeText.solversView.cloneHeading}</h2>
                <p>{displayRepoName}</p>
              </lef-repo-page-title>
              <a class="repo-page-back" href={repoViewHref('readme')}>
                <Icon icon="lucide:arrow-left" width="14" height="14" aria-hidden="true" />
                <lefine-text>{localeText.solversView.backToRepository}</lefine-text>
              </a>
            </lef-repo-page-head>
            <lef-repo-clone-hint>{localeText.solversView.cloneCommandHint}</lef-repo-clone-hint>
            <lef-repo-clone-command>
              <code>{resolvedCloneCommand}</code>
              <button
                type="button"
                class="repo-page-copy"
                data-testid="repo-clone-copy"
                aria-label={localeText.solversView.copyGitCloneCommand}
                onclick={copyClone}
              >
                <Icon icon={copyFlash ? 'lucide:check' : 'lucide:copy'} width="14" height="14" aria-hidden="true" />
                <lefine-text>{copyFlash ? localeText.solversView.copied : localeText.solversView.copy}</lefine-text>
              </button>
            </lef-repo-clone-command>
            <lef-repo-clone-link>
              <lefine-text>{localeText.solversView.repositoryLink}</lefine-text>
              <code>{resolvedCloneTarget}</code>
            </lef-repo-clone-link>
          </lef-repo-page>
        {:else}
        {#if readme}
          <lef-repo-readme aria-label={localeText.solversView.readmeAria} data-testid="repo-readme">
            <lef-repo-readme-head>
              <h2 data-testid="repo-readme-title">{displayRepoName}</h2>
            </lef-repo-readme-head>
            {#if readme.brief}
              <lef-repo-brief data-testid="repo-brief">
                <p>{readme.brief}</p>
              </lef-repo-brief>
            {/if}
            {#each readmeVisibleSections as section (section.id)}
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

        {#if todos.length > 0}
          <lef-repo-checklist
            aria-label={localeText.solversView.checklistAria}
            data-testid="repo-checklist"
          >
            {#each todos as todo, todoIndex (todo.id)}
              {@const statusKind = todoStatusKind(todo.state)}
              {@const selectedSolution = selectedSolutionForTodo(todo, todoIndex)}
              {@const solverExpanded = expandedTodoSolverId === todo.id}
              <lef-repo-checklist-item
                data-state={statusKind}
                data-testid="repo-checklist-item"
              >
                <lef-repo-todo-check
                  data-state={statusKind}
                  data-testid="repo-checklist-status"
                  role="img"
                  aria-label={todoStatusLabel(todo.state)}
                  title={todoStatusLabel(todo.state)}
                >
                  {#if todo.state === 'DONE'}
                    <Icon icon="lucide:check" width="12" height="12" aria-hidden="true" />
                  {:else if todo.state === 'IN PROGRESS'}
                    <Icon icon="lucide:minus" width="12" height="12" aria-hidden="true" />
                  {/if}
                </lef-repo-todo-check>
                <lefine-text>{todo.title}</lefine-text>
                {#if selectedSolution}
                  <lef-todo-solver-cell>
                    <button
                      type="button"
                      class="todo-solver-select"
                      data-testid="todo-solver-select"
                      aria-expanded={solverExpanded}
                      aria-label={`${localeText.solversView.solverVariants}: ${todo.title}`}
                      onclick={() => toggleTodoSolver(todo.id)}
                    >
                      <lef-solver-avatar
                        style="--avatar-color: {solverAvatarColor(selectedSolution.solver)}"
                        aria-hidden="true"
                      >{solverInitials(selectedSolution.solver)}</lef-solver-avatar>
                    </button>
                  </lef-todo-solver-cell>
                {/if}
                {#if solverExpanded && solutions.length > 0}
                  <lef-task-variants
                    class="todo-solver-variants"
                    data-testid="task-solver-variants"
                    aria-label={localeText.solversView.solverVariants}
                  >
                    {#each solutions as solution (solution.id)}
                      {@const variantMetric = metricsById.get(solution.id)}
                      <button
                        type="button"
                        class="task-variant"
                        data-variant={solution.id}
                        data-selected={selectedSolution?.id === solution.id ? 'true' : 'false'}
                        onclick={() => chooseTodoSolver(todo.id, solution.id)}
                      >
                        <lef-solver-avatar
                          style="--avatar-color: {solverAvatarColor(solution.solver)}"
                          aria-hidden="true"
                        >{solverInitials(solution.solver)}</lef-solver-avatar>
                        <lef-task-variant-meta>
                          <lef-task-variant-name>
                            <strong>{solution.solver}</strong>
                            <KefineSolverBadge
                              badge={badgeForSolver(solverBadges, solution.id)}
                              bestLabel={localeText.solversView.badges.best}
                              bestTitle={localeText.solversView.badges.bestTitle}
                              deltaTitle={localeText.solversView.badges.deltaTitle}
                              size="compact"
                            />
                          </lef-task-variant-name>
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
                  <lef-compare-row>
                    <button
                      type="button"
                      class="compare-solvers"
                      data-testid="open-solvers-compare"
                      onclick={() => (solversModalOpen = true)}
                    >
                      <Icon icon="lucide:bar-chart-3" width="14" height="14" aria-hidden="true" />
                      <lefine-text>{localeText.solversView.solversModal.open}</lefine-text>
                    </button>
                  </lef-compare-row>
                {/if}
              </lef-repo-checklist-item>
            {/each}
            <lef-repo-checklist-item data-state="create" data-testid="repo-new-task-row">
              <lef-repo-todo-check data-state="create" aria-hidden="true">
                <Icon icon="lucide:plus" width="12" height="12" aria-hidden="true" />
              </lef-repo-todo-check>
              <input
                data-testid="repo-new-task-input"
                aria-label={localeText.solversView.newTaskAria}
                placeholder={localeText.solversView.newTaskPlaceholder}
                value={newTaskText}
                autocomplete="off"
                spellcheck="false"
                oninput={updateNewTask}
                onkeydown={handleNewTaskKeydown}
              />
              <lef-todo-solver-cell>
                <button
                  type="button"
                  class="todo-solver-select create-task-search"
                  data-testid="repo-new-task-search"
                  aria-label={localeText.solversView.openCreateTaskSearch}
                  title={localeText.solversView.openCreateTaskSearch}
                  disabled={newTaskText.trim().length === 0}
                  onclick={openNewTaskSearch}
                >
                  <Icon icon="lucide:search" width="14" height="14" aria-hidden="true" />
                </button>
              </lef-todo-solver-cell>
            </lef-repo-checklist-item>
          </lef-repo-checklist>
        {/if}

        {#if !hasRepoDocs}
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
                          <lef-task-variant-name>
                            <strong>{solution.solver}</strong>
                            <KefineSolverBadge
                              badge={badgeForSolver(solverBadges, solution.id)}
                              bestLabel={localeText.solversView.badges.best}
                              bestTitle={localeText.solversView.badges.bestTitle}
                              deltaTitle={localeText.solversView.badges.deltaTitle}
                              size="compact"
                            />
                          </lef-task-variant-name>
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
                  <lef-compare-row>
                    <button
                      type="button"
                      class="compare-solvers"
                      data-testid="open-solvers-compare"
                      onclick={() => (solversModalOpen = true)}
                    >
                      <Icon icon="lucide:bar-chart-3" width="14" height="14" aria-hidden="true" />
                      <lefine-text>{localeText.solversView.solversModal.open}</lefine-text>
                    </button>
                  </lef-compare-row>
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
        {/if}
        {/if}
      </lef-main-tasks>

  </lef-tasks-grid>
</lefine-box>

<KefineSolversModal
  open={solversModalOpen}
  onClose={() => (solversModalOpen = false)}
  {solutions}
  metrics={solverMetrics}
  bind:ranking={rankingMetric}
  {onViewSolution}
/>

<style>
  .solutions-page-container {
    max-width: 920px;
    margin: 0 auto;
    padding: 0 12px 2rem;
  }

  lef-tasks-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
    gap: 0.75rem;
    padding: 0.9rem 1rem 1rem;
    margin-bottom: 0.6rem;
    border: 1px solid var(--kef-line);
    border-radius: 8px;
    background: var(--kef-bg-card);
  }

  lef-repo-readme-head {
    display: block;
  }

  lef-repo-readme-head h2 {
    margin: 0;
    font-size: 1.08rem;
    line-height: 1.25;
    font-weight: 700;
    color: var(--lefine-text);
  }

  lef-repo-brief {
    display: block;
  }

  lef-repo-brief p {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.45;
    color: var(--lefine-text-soft);
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

  lef-repo-checklist {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    margin: 0.7rem 0 0;
  }

  lef-repo-todo-check {
    display: inline-grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border-radius: 4px;
    border: 1.5px solid color-mix(in oklab, var(--lefine-text-soft) 70%, var(--kef-line));
    background: color-mix(in oklab, var(--lefine-text-soft) 70%, var(--kef-bg-card));
    color: #fff;
  }

  lef-repo-todo-check[data-state='in-progress'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 80%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 80%, var(--kef-bg-card));
  }

  lef-repo-todo-check[data-state='done'] {
    border-color: color-mix(in oklab, var(--kef-success, #16a34a) 70%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, #16a34a) 80%, transparent);
  }

  lef-repo-todo-check[data-state='create'] {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 58%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 11%, transparent);
    color: var(--kef-color-primary, #c89a5a);
  }

  lef-repo-checklist-item {
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    min-height: 2.7rem;
    padding: 0.5rem 0.65rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 55%, transparent);
    border-radius: 8px;
    background: color-mix(in oklab, var(--kef-bg-card) 82%, transparent);
    color: var(--lefine-text);
  }

  lef-repo-checklist-item[data-state='create'] {
    border-style: dashed;
    background: color-mix(in oklab, var(--kef-bg-card) 66%, transparent);
  }

  lef-repo-checklist-item[data-state='create']:focus-within {
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 38%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 5%, var(--kef-bg-card));
  }

  lef-repo-checklist-item lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
    font-size: 0.9rem;
    line-height: 1.3;
  }

  lef-repo-checklist-item[data-state='done'] lefine-text {
    color: var(--lefine-text-soft);
  }

  lef-repo-checklist-item input[data-testid='repo-new-task-input'] {
    width: 100%;
    min-width: 0;
    border: 0;
    background: transparent;
    color: var(--lefine-text);
    font: inherit;
    font-size: 0.9rem;
    line-height: 1.3;
    outline: 0;
  }

  lef-repo-checklist-item input[data-testid='repo-new-task-input']::placeholder {
    color: var(--lefine-text-soft);
    opacity: 0.78;
  }

  lef-todo-solver-cell {
    display: flex;
    justify-content: flex-end;
    min-width: 0;
  }

  .todo-solver-select {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.15rem;
    width: 2.15rem;
    height: 2.15rem;
    padding: 0.3rem 0.35rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 75%, transparent);
    border-radius: 8px;
    background: color-mix(in oklab, var(--lefine-text) 7%, var(--kef-bg-card));
    color: var(--lefine-text);
    font: inherit;
    cursor: pointer;
    transition: background 140ms ease, border-color 140ms ease, transform 140ms ease;
  }

  .todo-solver-select:hover {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 10%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 32%, var(--kef-line));
  }

  .todo-solver-select[aria-expanded='true'] {
    background: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 12%, var(--kef-bg-card));
    border-color: color-mix(in oklab, var(--kef-color-primary, #c89a5a) 42%, var(--kef-line));
  }

  .todo-solver-select:active {
    transform: scale(0.98);
  }

  .create-task-search {
    color: var(--lefine-text-soft);
  }

  .create-task-search:disabled {
    cursor: default;
    opacity: 0.46;
    transform: none;
  }

  .create-task-search:disabled:hover {
    border-color: color-mix(in oklab, var(--kef-line) 75%, transparent);
    background: color-mix(in oklab, var(--lefine-text) 7%, var(--kef-bg-card));
  }

  .todo-solver-select lef-solver-avatar {
    width: 1rem;
    height: 1rem;
    border-radius: 4px;
    font-size: 0.42rem;
    box-shadow: none;
    flex: 0 0 auto;
  }

  lef-task-variants.todo-solver-variants {
    grid-column: 2 / -1;
    padding: 0.1rem 0 0;
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

  lef-task-variant-name {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    min-width: 0;
  }

  lef-task-variant-name strong {
    flex: 0 1 auto;
    min-width: 0;
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

  lef-compare-row {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.5rem;
  }

  .compare-solvers {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    appearance: none;
    cursor: pointer;
    padding: 0.32rem 0.7rem;
    font-size: 0.74rem;
    font-weight: 600;
    color: var(--lefine-text-soft);
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line-soft);
    border-radius: 999px;
    transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
  }

  .compare-solvers:hover {
    color: var(--lefine-text);
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 40%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  lef-repo-page {
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
    padding: 0.9rem 1rem 1rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
    background: var(--kef-bg-card);
    color: var(--lefine-text);
  }

  lef-repo-page-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.75rem;
  }

  lef-repo-page-title {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 0;
  }

  lef-repo-page-title h2,
  lef-repo-page-title p {
    margin: 0;
  }

  lef-repo-page-title h2 {
    font-size: 1.05rem;
    line-height: 1.25;
    font-weight: 700;
  }

  lef-repo-page-title p {
    font-size: 0.86rem;
    color: var(--lefine-text-soft);
    overflow-wrap: anywhere;
  }

  .repo-page-back,
  .repo-page-copy {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 2rem;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--kef-line);
    border-radius: 8px;
    background: color-mix(in oklab, var(--kef-bg-card) 78%, var(--kef-bg-soft) 22%);
    color: var(--lefine-text-soft);
    font: inherit;
    font-size: 0.78rem;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
  }

  .repo-page-back:hover,
  .repo-page-copy:hover {
    color: var(--lefine-text);
    border-color: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 38%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-color-primary, #3a7afe) 8%, var(--kef-bg-card));
  }

  .repo-settings-list {
    display: grid;
    grid-template-columns: minmax(8rem, max-content) minmax(0, 1fr);
    gap: 0.5rem 0.9rem;
    margin: 0;
  }

  lef-repo-settings-kv {
    display: contents;
  }

  .repo-settings-list dt {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--lefine-text);
  }

  .repo-settings-list dd {
    margin: 0;
    min-width: 0;
    font-family: ui-monospace, monospace;
    font-size: 0.8rem;
    color: var(--lefine-text-soft);
    overflow-wrap: anywhere;
  }

  lef-repo-clone-hint {
    display: block;
    font-size: 0.88rem;
    line-height: 1.45;
    color: var(--lefine-text-soft);
  }

  lef-repo-clone-command {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.6rem;
    padding: 0.55rem;
    border: 1px solid var(--kef-line-soft);
    border-radius: 8px;
    background: color-mix(in oklab, var(--kef-bg-soft) 74%, transparent);
  }

  lef-repo-clone-command code,
  lef-repo-clone-link code {
    min-width: 0;
    font-family: ui-monospace, 'SFMono-Regular', Menlo, monospace;
    font-size: 0.8rem;
    color: var(--lefine-text);
    overflow-wrap: anywhere;
  }

  lef-repo-clone-link {
    display: grid;
    grid-template-columns: minmax(7rem, max-content) minmax(0, 1fr);
    gap: 0.45rem 0.85rem;
    align-items: baseline;
    color: var(--lefine-text-soft);
    font-size: 0.8rem;
  }

  lef-repo-clone-link lefine-text {
    font-weight: 700;
    color: var(--lefine-text);
  }

  @media (max-width: 980px) {
    lef-tasks-grid {
      grid-template-columns: minmax(0, 1fr);
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

    lef-repo-checklist-item {
      grid-template-columns: 18px minmax(0, 1fr) auto;
    }

    lef-todo-solver-cell {
      grid-column: 3;
      justify-content: flex-end;
    }

    .todo-solver-select {
      max-width: none;
    }

    lef-task-variants.todo-solver-variants {
      grid-column: 2 / -1;
    }

    lef-repo-page-head,
    lef-repo-clone-command,
    lef-repo-clone-link,
    .repo-settings-list {
      grid-template-columns: minmax(0, 1fr);
    }

    .repo-page-back,
    .repo-page-copy {
      justify-content: center;
    }
  }
</style>
