<script lang="ts">
  import { onDestroy, tick } from 'svelte';
  import KefineOrderListItem from '$lib/components/kefine/KefineOrderListItem.svelte';
  import SolutionMetricsMini from '$lib/components/kefine/SolutionMetricsMini.svelte';
  import { defaultMetrics } from '$lib/kefine/solutions-data';
  import type { DraftOrder, OrderView, TemplatePresentation } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';

  type PinnedService = {
    id: string;
    href: string;
    imageDataUrl?: string;
    title: string;
    description: string;
    authorHandle: string;
  };

  type Props = {
    draft: DraftOrder;
    template: TemplatePresentation | null;
    serviceSetup?: {
      title: string;
      subtitle: string;
    } | null;
    pinnedServices: PinnedService[];
    pinnedServicesTitle: string;
    pinnedServicesSubtitle: string;
    titleFontSize: number;
    title: string;
    afe: {
      title: string;
      labels: {
        input: string;
        intake: string;
        route: string;
        result: string;
        delivery: string;
      };
      cards: Array<{
        title: string;
        detail: string;
      }>;
    };
    placeholder: string;
    placeholderVariants: readonly string[];
    executeAria: string;
    backgroundExecuteAria: string;
    solverSearchActive?: boolean;
    solverSearchText?: string;
    solverSearchCompleted?: boolean;
    solverSearchLabel: string;
    solverLabel: string;
    matchedOrders: OrderView[];
    recentOrders?: OrderView[];
    isSearching: boolean;
    matchedTasksLabel: string;
    recentTasksLabel: string;
    addFileLabel: string;
    addExecutionEstimateLabel: string;
    fileCountLabel: (count: number) => string;
    composerHints: string;
    openTaskLabel: string;
    relatedItemsLabel: string;
    createServiceLabel?: string;
    stopTaskLabel: string;
    deleteTaskLabel: string;
    onSubmit: () => void;
    onQueueTask: () => Promise<void> | void;
    onAttachFiles: (files: File[]) => void;
    onRemoveFile: (index: number) => void;
    onDeleteOrder: (order: OrderView, event: Event) => void;
    onStopOrder: (order: OrderView, event: Event) => void;
    onOpenOrder: (order: OrderView) => void;
    onCreateServiceFromOrder?: (order: OrderView, event: Event) => void;
    onDescriptionChange?: (value: string) => void;
    onTemplateVariableChange?: (key: string, value: string) => void;
    onTagsChange?: (tags: string[]) => void;
    executionEstimateLabel: string;
    onExecutionEstimateChange?: (value: string) => void;
    onSolverSearchComplete?: () => void;
  };

  const props: Props = $props();
  const REPO_URL = '@example/proxy-on-go/release';
  const exampleTasks = [
    'Make a go Proxy',
    'Make a go Proxy with tests',
    'Make a go Proxy ready for deploy'
  ];

  let taskInput = $state<HTMLInputElement | null>(null);
  let solverDialogOpen = $state(false);
  let stopPressCancel: (() => void) | null = null;
  let solverCompleteCancel: (() => void) | null = null;

  const solverSearchActive = $derived(Boolean(props.solverSearchActive));
  const solverSearchText = $derived(props.solverSearchText?.trim() ?? '');
  const solverSearchCompleted = $derived(Boolean(props.solverSearchCompleted));
  const solverReady = $derived(solverSearchActive && solverSearchCompleted && solverSearchText.length > 0);
  const headerSearchValue = $derived(
    solverSearchActive && solverSearchText ? `${REPO_URL}#${solverSearchText}` : props.draft.description
  );
  const activeTaskTitle = $derived(solverSearchText || props.draft.description.trim() || 'Make a go Proxy');
  const createdTaskStatus = $derived(solverSearchCompleted ? '25m status ready' : props.solverSearchLabel);

  function solverDisplayName(index: number) {
    return index === 0 ? 'Dragon A' : index === 1 ? 'Dragon B' : 'Dragon C';
  }

  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (event.shiftKey) {
      void props.onQueueTask();
      return;
    }

    props.onSubmit();
  }

  function handleTaskInput(event: Event) {
    props.onDescriptionChange?.((event.currentTarget as HTMLInputElement).value);
  }

  async function submitExampleTask(task: string) {
    props.onDescriptionChange?.(task);
    await tick();
    props.onSubmit();
  }

  function handleOpenOrderKeydown(order: OrderView, event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    props.onOpenOrder(order);
  }

  function handleStopPointerDown(order: OrderView, event: PointerEvent) {
    stopPressCancel?.();
    stopPressCancel = scheduleAfter(600, () => {
      stopPressCancel = null;
      props.onStopOrder(order, event);
    });
  }

  function clearStopPointerTimer() {
    stopPressCancel?.();
    stopPressCancel = null;
  }

  function openSolverDialog() {
    if (!solverReady) {
      return;
    }

    solverDialogOpen = true;
  }

  function closeSolverDialog() {
    solverDialogOpen = false;
  }

  function handleSolverDialogKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    closeSolverDialog();
  }

  $effect(() => {
    solverCompleteCancel?.();
    solverCompleteCancel = null;

    if (!solverSearchActive || solverSearchCompleted || !solverSearchText) {
      return;
    }

    solverCompleteCancel = scheduleAfter(1200, () => {
      solverCompleteCancel = null;
      props.onSolverSearchComplete?.();
    });
  });

  onDestroy(() => {
    stopPressCancel?.();
    solverCompleteCancel?.();
  });
</script>

<section class="kefine-command-center kefine-card" data-testid="kefine-command-center" aria-label="Lefine command center">
  <header class="repo-shell-header">
    <a class="repo-brand" href="/" aria-label="Lefine home">Lefine</a>
    <label class="repo-search-control">
      <lefine-text>Search</lefine-text>
      <input
        bind:this={taskInput}
        data-testid="kefine-task-input"
        data-search-active={solverSearchActive}
        value={headerSearchValue}
        readonly={solverSearchActive}
        aria-label={props.title}
        placeholder={`${REPO_URL}#Make a go Proxy`}
        onkeydown={handleTaskInputKeydown}
        oninput={handleTaskInput}
      />
    </label>
    <button type="button" class="repo-clone-button">clone</button>
    <button type="button" class="repo-login-button">login</button>
  </header>

  <nav class="repo-tabs" aria-label="Repository views">
    <button type="button" data-active="true">Overview</button>
    <button type="button">Checkpoints</button>
    <button type="button">Source</button>
    <button type="button" class="repo-apply">Apply</button>
  </nav>

  <section class="repo-workbench">
    <aside class="repo-task-rail" aria-label="Tasks">
      <strong>Tasks</strong>

      {#if solverSearchActive && solverSearchText}
        <button
          type="button"
          class="kefine-solver-search-row"
          data-testid="kefine-solver-search-row"
          disabled={!solverSearchCompleted}
          aria-label={solverSearchCompleted ? 'Created task ready' : props.solverSearchLabel}
          onclick={openSolverDialog}
        >
          <lefine-text>{REPO_URL}</lefine-text>
          <strong>{solverSearchText}</strong>
          <lefine-meta>{createdTaskStatus}</lefine-meta>
        </button>
      {/if}

      <section class="repo-example-list" aria-label="Example tasks">
        {#each exampleTasks as task (task)}
          <button type="button" class="repo-task-button" onclick={() => { void submitExampleTask(task); }}>
            <lefine-text>{task}</lefine-text>
            <lefine-meta>example</lefine-meta>
          </button>
        {/each}
      </section>

      {#if !solverSearchActive && props.isSearching && props.matchedOrders.length > 0}
        <section class="repo-side-history" aria-label={props.matchedTasksLabel}>
          <strong>{props.matchedTasksLabel}</strong>
          <ul data-testid="kefine-search-results">
            {#each props.matchedOrders as order (order.id)}
              <KefineOrderListItem
                {order}
                openTaskLabel={props.openTaskLabel}
                relatedItemsLabel={props.relatedItemsLabel}
                createServiceLabel={props.createServiceLabel}
                deleteTaskLabel={props.deleteTaskLabel}
                showCreateService={false}
                showDelete={true}
                itemTestId={`kefine-search-order-${order.id}`}
                openTestId={`kefine-open-search-order-${order.id}`}
                deleteTestId={`kefine-delete-search-order-${order.id}`}
                openOrder={() => props.onOpenOrder(order)}
                onCreateService={(event) => props.onCreateServiceFromOrder?.(order, event)}
                onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
                onDelete={(event) => props.onDeleteOrder(order, event)}
              />
            {/each}
          </ul>
        </section>
      {:else if !solverSearchActive && (props.recentOrders?.length ?? 0) > 0}
        <section class="repo-side-history" aria-label={props.recentTasksLabel}>
          <strong>{props.recentTasksLabel}</strong>
          <ul data-testid="kefine-recent-orders">
            {#each props.recentOrders ?? [] as order (order.id)}
              <KefineOrderListItem
                {order}
                openTaskLabel={props.openTaskLabel}
                relatedItemsLabel={props.relatedItemsLabel}
                createServiceLabel={props.createServiceLabel}
                stopTaskLabel={props.stopTaskLabel}
                deleteTaskLabel={props.deleteTaskLabel}
                showCreateService={false}
                showStop={order.status !== 'completed' && order.status !== 'done'}
                showDelete={true}
                openByDefault={true}
                itemTestId={`kefine-recent-order-${order.id}`}
                openTestId={`kefine-open-order-${order.id}`}
                stopTestId={`kefine-stop-order-${order.id}`}
                deleteTestId={`kefine-delete-order-${order.id}`}
                openOrder={() => props.onOpenOrder(order)}
                onCreateService={(event) => props.onCreateServiceFromOrder?.(order, event)}
                onOpenKeydown={(event) => handleOpenOrderKeydown(order, event)}
                onStop={(event) => props.onStopOrder(order, event)}
                onDelete={(event) => props.onDeleteOrder(order, event)}
                onStopPointerDown={(event) => handleStopPointerDown(order, event)}
                onStopPointerUp={clearStopPointerTimer}
                onStopPointerLeave={clearStopPointerTimer}
                onStopPointerCancel={clearStopPointerTimer}
              />
            {/each}
          </ul>
        </section>
      {/if}
    </aside>

    <section class="repo-test-block" data-testid="kefine-test-block" aria-label="Test">
      <header>
        <strong>Test</strong>
        <lefine-text>{activeTaskTitle}</lefine-text>
      </header>

      <section class="repo-test-surface" aria-label="Proxy test details">
        <section class="repo-test-summary">
          <strong>POST /</strong>
          <lefine-text>returns proxy ready</lefine-text>
          <lefine-meta>{solverSearchActive ? createdTaskStatus : 'ready'}</lefine-meta>
        </section>

        <section class="repo-test-grid" aria-label="Request and response">
          <article>
            <strong>Request body</strong>
            <dl>
              <dt>ping</dt>
              <dd>hello</dd>
            </dl>
          </article>
          <article>
            <strong>Response</strong>
            <dl>
              <dt>ok</dt>
              <dd>true</dd>
              <dt>message</dt>
              <dd>proxy ready</dd>
            </dl>
          </article>
        </section>
      </section>

      <footer>
        <button
          type="button"
          class="repo-select-solver"
          data-testid="kefine-solver-select-trigger"
          disabled={!solverReady}
          onclick={openSolverDialog}
        >
          Select solver
        </button>
      </footer>
    </section>
  </section>
</section>

{#if solverDialogOpen}
  <kefine-solver-backdrop>
    <button type="button" class="repo-solver-scrim" aria-label="Close solver metrics" onclick={closeSolverDialog}></button>
    <dialog
      open
      class="repo-solver-dialog"
      data-testid="kefine-solver-metrics-dialog"
      aria-labelledby="kefine-solver-dialog-title"
      onkeydown={handleSolverDialogKeydown}
    >
      <header>
        <section>
          <h2 id="kefine-solver-dialog-title">Select solver</h2>
          <lefine-text>{REPO_URL}#{solverSearchText}</lefine-text>
        </section>
        <button type="button" aria-label="Close solver metrics" onclick={closeSolverDialog}>x</button>
      </header>

      <ol class="repo-solver-ranks" data-testid="kefine-solver-options" aria-label="Solver candidates">
        {#each defaultMetrics as metric, index (`metric-${metric.solverId}`)}
          <li data-active={index === 0}>
            <strong>#{index + 1}</strong>
            <lefine-text>{solverDisplayName(index)}</lefine-text>
            <lefine-value>{metric.executionTimeSec.toFixed(1)}s</lefine-value>
          </li>
        {/each}
      </ol>

      <SolutionMetricsMini
        metrics={defaultMetrics}
        activeSolverId={defaultMetrics[0]?.solverId ?? '5'}
        project={REPO_URL}
        slug={solverSearchText}
      />
    </dialog>
  </kefine-solver-backdrop>
{/if}

<style>
  .kefine-command-center {
    display: grid;
    gap: 0.85rem;
    width: min(100%, calc(100vw - 7rem));
    max-width: 74rem;
    margin: 5.4rem auto 2rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    padding: 0;
    color: var(--lefine-text);
  }

  .kefine-command-center::after {
    content: none;
  }

  .repo-shell-header,
  .repo-tabs,
  .repo-workbench,
  .repo-task-rail,
  .repo-test-block,
  .repo-solver-dialog {
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: color-mix(in oklab, var(--kef-bg-card) 92%, var(--kef-bg));
    box-shadow: none;
  }

  .repo-shell-header {
    display: grid;
    grid-template-columns: auto minmax(16rem, 1fr) auto auto;
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

  .repo-search-control {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.5rem;
    align-items: center;
    min-width: 0;
  }

  .repo-search-control lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
  }

  .repo-search-control input {
    width: 100%;
    min-height: 2rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    color: var(--lefine-text);
    padding: 0.35rem 0.55rem;
    font: inherit;
  }

  .repo-search-control input[data-search-active='true'] {
    font-weight: 650;
  }

  .repo-clone-button,
  .repo-login-button,
  .repo-tabs button,
  .repo-task-button,
  .kefine-solver-search-row,
  .repo-select-solver,
  .repo-solver-dialog button {
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
  .repo-select-solver:not(:disabled),
  .repo-solver-dialog li[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-success) 34%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success) 12%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-success) 82%, var(--lefine-text));
    font-weight: 650;
  }

  .repo-workbench {
    display: grid;
    grid-template-columns: minmax(13rem, 16rem) minmax(0, 1fr);
    gap: 1rem;
    min-height: 27rem;
    padding: 1rem;
  }

  .repo-task-rail {
    display: grid;
    align-content: start;
    gap: 0.7rem;
    padding: 0.85rem;
    min-width: 0;
  }

  .repo-task-rail > strong,
  .repo-side-history > strong,
  .repo-test-block > header strong,
  .repo-test-summary strong,
  .repo-test-grid article > strong {
    color: var(--lefine-text);
    font-size: 0.92rem;
    font-weight: 700;
  }

  .repo-example-list,
  .repo-side-history,
  .repo-side-history ul {
    display: grid;
    gap: 0.55rem;
    min-width: 0;
  }

  .repo-side-history ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .repo-task-button,
  .kefine-solver-search-row {
    display: grid;
    gap: 0.18rem;
    width: 100%;
    min-height: 3.05rem;
    text-align: left;
  }

  .kefine-solver-search-row:not(:disabled) {
    background: color-mix(in oklab, var(--kef-success) 10%, var(--kef-bg-card));
  }

  .kefine-solver-search-row:disabled {
    cursor: progress;
    opacity: 0.76;
  }

  .repo-task-button lefine-text,
  .kefine-solver-search-row lefine-text,
  .kefine-solver-search-row strong,
  .repo-task-button lefine-meta,
  .kefine-solver-search-row lefine-meta,
  .repo-test-block lefine-text,
  .repo-test-block lefine-meta,
  .repo-solver-dialog lefine-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .repo-task-button lefine-text,
  .kefine-solver-search-row strong {
    font-weight: 650;
  }

  .repo-task-button lefine-meta,
  .kefine-solver-search-row lefine-text,
  .kefine-solver-search-row lefine-meta,
  .repo-test-block lefine-text,
  .repo-test-block lefine-meta,
  .repo-solver-dialog lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
  }

  .repo-test-block {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    gap: 0.8rem;
    min-width: 0;
    min-height: 25rem;
    padding: 0.95rem;
  }

  .repo-test-block > header,
  .repo-test-block > footer {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    min-width: 0;
  }

  .repo-test-surface {
    display: grid;
    align-content: start;
    gap: 0.85rem;
    min-height: 17rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.55rem;
    background: color-mix(in oklab, var(--kef-bg-card) 97%, white 3%);
    padding: 0.85rem;
  }

  .repo-test-summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: center;
    min-height: 2.35rem;
    border-bottom: 1px solid var(--kef-line);
    padding-bottom: 0.7rem;
  }

  .repo-test-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .repo-test-grid article {
    display: grid;
    gap: 0.55rem;
    min-width: 0;
    border: 1px solid var(--kef-line);
    border-radius: 0.45rem;
    background: color-mix(in oklab, var(--kef-bg-card) 95%, var(--kef-bg-soft));
    padding: 0.7rem;
  }

  .repo-test-grid dl {
    display: grid;
    grid-template-columns: minmax(4rem, 0.42fr) minmax(0, 1fr);
    gap: 0.35rem 0.55rem;
    margin: 0;
  }

  .repo-test-grid dt,
  .repo-test-grid dd {
    min-width: 0;
    margin: 0;
    border-radius: 0.3rem;
    background: color-mix(in oklab, var(--kef-bg-card) 86%, white 4%);
    padding: 0.36rem 0.5rem;
    font-size: 0.82rem;
  }

  .repo-test-grid dt {
    color: var(--lefine-text-soft);
    font-weight: 650;
  }

  .repo-test-grid dd {
    color: var(--lefine-text);
    overflow-wrap: anywhere;
  }

  .repo-select-solver {
    min-width: 9rem;
    justify-self: end;
  }

  .repo-select-solver:disabled {
    cursor: progress;
    opacity: 0.58;
  }

  kefine-solver-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--lefine-text) 38%, transparent);
    isolation: isolate;
  }

  .repo-solver-scrim {
    position: absolute;
    inset: 0;
    width: 100%;
    min-height: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    padding: 0;
    cursor: default;
  }

  .repo-solver-dialog {
    position: static;
    z-index: 1;
    display: grid;
    gap: 0.85rem;
    width: min(100%, 42rem);
    max-height: min(90dvh, 44rem);
    margin: 0;
    overflow: auto;
    padding: 1rem;
  }

  .repo-solver-dialog > header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: start;
  }

  .repo-solver-dialog h2 {
    margin: 0;
    font-size: 1rem;
  }

  .repo-solver-dialog header section {
    display: grid;
    gap: 0.18rem;
    min-width: 0;
  }

  .repo-solver-ranks {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .repo-solver-ranks li {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr) auto;
    gap: 0.5rem;
    min-height: 2.1rem;
    align-items: center;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    padding: 0.35rem 0.55rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
  }

  .repo-solver-ranks lefine-value {
    font-family: 'Fira Mono', 'Fira Code', ui-monospace, monospace;
    font-size: 0.82rem;
  }

  @media (max-width: 760px) {
    .kefine-command-center {
      width: min(100%, calc(100vw - 1rem));
      margin-top: 4.75rem;
    }

    .repo-shell-header,
    .repo-workbench,
    .repo-tabs,
    .repo-search-control,
    .repo-test-grid,
    .repo-test-summary {
      grid-template-columns: 1fr;
    }

    .repo-tabs button,
    .repo-select-solver {
      width: 100%;
    }

    .repo-test-block > header,
    .repo-test-block > footer {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
