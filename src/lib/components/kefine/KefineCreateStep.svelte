<script lang="ts">
  import { tick } from 'svelte';
  import { onDestroy } from 'svelte';
  import KefineOrderListItem from '$lib/components/kefine/KefineOrderListItem.svelte';
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
    solverListHref?: string;
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
  const DEMO_VIDEO_SRC = '/assets/issue-114-example-task.webm';
  const exampleTasks = [
    'Make a go Proxy',
    'Make a go Proxy with tests',
    'Make a go Proxy ready for deploy'
  ];

  let fileInput = $state<HTMLInputElement | null>(null);
  let taskInput = $state<HTMLTextAreaElement | null>(null);
  let tagInputValue = $state('');
  let videoDialogOpen = $state(false);
  let stopPressCancel: (() => void) | null = null;
  let solverCompleteCancel: (() => void) | null = null;

  const solverSearchActive = $derived(Boolean(props.solverSearchActive));
  const solverSearchText = $derived(props.solverSearchText?.trim() ?? '');
  const solverSearchCompleted = $derived(Boolean(props.solverSearchCompleted));
  const solverListHref = $derived(props.solverListHref || '#');
  const exampleTaskReady = $derived(solverSearchActive && solverSearchCompleted && solverSearchText.length > 0);
  const searchRowPrimary = $derived(
    solverSearchCompleted ? `${REPO_URL}#${solverSearchText || 'Make a go Proxy'}` : solverSearchText
  );
  const searchRowSecondary = $derived(
    solverSearchCompleted ? '25m status ready' : props.solverSearchLabel
  );

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

  async function submitExampleTask(task: string) {
    props.onDescriptionChange?.(task);
    await tick();
    props.onSubmit();
  }

  function handleFileChange(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length > 0) {
      props.onAttachFiles(files);
    }

    input.value = '';
  }

  function commitTag() {
    const normalized = tagInputValue.trim().replace(/^#+/, '').toLowerCase();
    if (!normalized) {
      tagInputValue = '';
      return;
    }

    props.onTagsChange?.(Array.from(new Set([...(props.draft.tags ?? []), normalized])));
    tagInputValue = '';
  }

  function removeTag(tag: string) {
    props.onTagsChange?.((props.draft.tags ?? []).filter((item) => item !== tag));
  }

  function handleTagInputKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      event.preventDefault();
      commitTag();
    }
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

  function openSolverList(event: MouseEvent) {
    if (!solverSearchCompleted) {
      event.preventDefault();
    }
  }

  function closeVideoDialog() {
    videoDialogOpen = false;
  }

  function handleVideoDialogKeydown(event: KeyboardEvent) {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    closeVideoDialog();
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
    <label class="repo-url-control">
      <lefine-text>Repository</lefine-text>
      <input data-testid="kefine-repo-url" value={REPO_URL} readonly />
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
    <aside class="repo-examples" aria-label="Example tasks">
      {#each exampleTasks as task (task)}
        <button type="button" onclick={() => { void submitExampleTask(task); }}>
          {task}
        </button>
      {/each}
    </aside>

    <section class="repo-task-panel" aria-label="Task composer">
      <fieldset data-testid="kefine-create-form">
        <label for="order-title">Test</label>
        <textarea
          id="order-title"
          bind:this={taskInput}
          value={props.draft.description}
          data-testid="kefine-task-input"
          aria-label={props.title}
          placeholder={props.placeholder}
          rows="4"
          onkeydown={handleTaskInputKeydown}
          oninput={(event) => props.onDescriptionChange?.((event.currentTarget as HTMLTextAreaElement).value)}
        ></textarea>
        <button
          type="button"
          data-testid="kefine-submit-task"
          aria-label={props.executeAria}
          onclick={props.onSubmit}
        >
          Send
        </button>
      </fieldset>

      <section class="repo-composer-tools" aria-label={props.composerHints}>
        <button type="button" onclick={() => fileInput?.click()}>{props.addFileLabel}</button>
        <label>
          <lefine-text>{props.addExecutionEstimateLabel}</lefine-text>
          <input
            value={props.draft.executionEstimate}
            placeholder={props.executionEstimateLabel}
            oninput={(event) => props.onExecutionEstimateChange?.((event.currentTarget as HTMLInputElement).value)}
          />
        </label>
        <label>
          <lefine-text>tag</lefine-text>
          <input
            bind:value={tagInputValue}
            placeholder="tag"
            maxlength="32"
            onkeydown={handleTagInputKeydown}
            onblur={commitTag}
          />
        </label>
      </section>

      {#if props.draft.files.length > 0 || (props.draft.tags?.length ?? 0) > 0}
        <section class="repo-attachment-strip" aria-label="Attached task context">
          {#each props.draft.files as file, index (`${file.name}-${file.size}-${index}`)}
            <button type="button" onclick={() => props.onRemoveFile(index)}>
              <lefine-text>{file.name}</lefine-text>
              <strong>{props.fileCountLabel(1)}</strong>
            </button>
          {/each}
          {#each props.draft.tags ?? [] as tag (`tag-${tag}`)}
            <button type="button" onclick={() => removeTag(tag)} aria-label={`Remove ${tag} tag`}>
              #{tag} x
            </button>
          {/each}
        </section>
      {/if}

      <input bind:this={fileInput} class="repo-file-input" type="file" multiple onchange={handleFileChange} />
    </section>
  </section>

  {#if solverSearchActive && solverSearchText}
    <section class="repo-search-panel" aria-label="Created tasks">
      <label class="repo-search-field">
        <lefine-text>Search</lefine-text>
        <input value={`${REPO_URL}#${solverSearchText}`} readonly />
      </label>
      <section class="repo-search-actions" aria-label="Task filters">
        <button type="button">add a file</button>
        <button type="button">tag</button>
      </section>
      <a
        role="button"
        href={solverSearchCompleted ? solverListHref : '#'}
        class="kefine-solver-search-row"
        data-testid="kefine-solver-search-row"
        aria-label={solverSearchCompleted ? 'Open solver list' : props.solverSearchLabel}
        aria-disabled={!solverSearchCompleted}
        tabindex={solverSearchCompleted ? 0 : -1}
        onclick={openSolverList}
      >
        <strong>{searchRowPrimary}</strong>
        <lefine-text>{searchRowSecondary}</lefine-text>
      </a>
      <button
        type="button"
        class="repo-video-trigger"
        data-testid="kefine-demo-video-trigger"
        disabled={!exampleTaskReady}
        onclick={() => { videoDialogOpen = true; }}
      >
        Dragon A
      </button>
      <lefine-text class="repo-secondary-task">another repo#Another task 25m status</lefine-text>
    </section>
  {:else if props.isSearching && props.matchedOrders.length > 0}
    <section class="repo-history-panel" aria-label={props.matchedTasksLabel}>
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
  {:else if (props.recentOrders?.length ?? 0) > 0}
    <section class="repo-history-panel" aria-label={props.recentTasksLabel}>
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
</section>

{#if videoDialogOpen}
  <kefine-video-backdrop>
    <button type="button" class="repo-video-scrim" aria-label="Close video" onclick={closeVideoDialog}></button>
    <dialog
      open
      class="repo-video-dialog"
      data-testid="kefine-demo-video-dialog"
      aria-labelledby="kefine-demo-video-title"
      onkeydown={handleVideoDialogKeydown}
    >
      <header>
        <h2 id="kefine-demo-video-title">Metrics</h2>
        <button type="button" aria-label="Close video" onclick={closeVideoDialog}>x</button>
      </header>
      <section class="repo-metric-controls" aria-label="Metric filters">
        <button type="button" data-active="true">Speed</button>
        <button type="button">Price</button>
      </section>
      <ol class="repo-metric-list">
        <li><strong>#1</strong> Dragon A</li>
        <li><strong>#2</strong> Dragon B</li>
        <li><strong>#3</strong> Dragon C</li>
      </ol>
      <video controls preload="metadata" aria-label="Example task video">
        <source src={DEMO_VIDEO_SRC} type="video/webm" />
      </video>
    </dialog>
  </kefine-video-backdrop>
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
  .repo-search-panel,
  .repo-history-panel,
  .repo-video-dialog {
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

  .repo-url-control input,
  .repo-search-field input {
    width: 100%;
    min-height: 2rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    color: var(--lefine-text);
    padding: 0.35rem 0.55rem;
    font: inherit;
  }

  .repo-clone-button,
  .repo-login-button,
  .repo-tabs button,
  .repo-examples button,
  .repo-composer-tools button,
  .repo-composer-tools input,
  .repo-search-actions button,
  .repo-video-trigger,
  .repo-video-dialog button {
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
  .repo-video-trigger:not(:disabled),
  .repo-video-dialog button[data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-success) 34%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success) 12%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-success) 82%, var(--lefine-text));
    font-weight: 650;
  }

  .repo-workbench {
    display: grid;
    grid-template-columns: minmax(10rem, 13rem) minmax(0, 1fr);
    gap: 1rem;
    min-height: 14rem;
    padding: 1rem;
  }

  .repo-examples {
    display: grid;
    align-content: start;
    gap: 0.55rem;
  }

  .repo-examples button {
    width: 100%;
    min-height: 3rem;
    text-align: left;
    font-weight: 650;
  }

  .repo-task-panel {
    display: grid;
    gap: 0.75rem;
    min-width: 0;
  }

  fieldset {
    display: grid;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
  }

  fieldset label {
    color: var(--lefine-text-soft);
    font-size: 0.86rem;
    font-weight: 650;
  }

  textarea[data-testid='kefine-task-input'] {
    min-height: 7.5rem;
    width: 100%;
    resize: vertical;
    border: 1px solid var(--kef-line);
    border-radius: 0.55rem;
    background: color-mix(in oklab, var(--kef-bg-card) 97%, white 3%);
    color: var(--lefine-text);
    padding: 0.8rem 0.9rem;
    font: inherit;
    line-height: 1.45;
  }

  button[data-testid='kefine-submit-task'] {
    justify-self: end;
    min-width: 5.5rem;
    min-height: 2.2rem;
    border: 1px solid color-mix(in oklab, var(--kef-success) 36%, var(--kef-line));
    border-radius: 0.35rem;
    background: var(--kef-success);
    color: var(--kef-on-primary);
    padding: 0.4rem 0.85rem;
    font: inherit;
    font-weight: 650;
  }

  .repo-composer-tools,
  .repo-attachment-strip,
  .repo-search-actions,
  .repo-metric-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
  }

  .repo-composer-tools label {
    display: inline-flex;
    gap: 0.4rem;
    align-items: center;
  }

  .repo-composer-tools input {
    width: 9rem;
  }

  .repo-file-input {
    display: none;
  }

  .repo-search-panel,
  .repo-history-panel {
    display: grid;
    gap: 0.65rem;
    padding: 0.85rem 0.9rem;
  }

  .repo-search-field {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.55rem;
    align-items: center;
  }

  .repo-search-field lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
  }

  .kefine-solver-search-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
    min-height: 2.7rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
    color: var(--lefine-text);
    padding: 0.48rem 0.65rem;
    text-decoration: none;
  }

  .kefine-solver-search-row[aria-disabled='true'] {
    cursor: progress;
    opacity: 0.76;
  }

  .kefine-solver-search-row strong,
  .kefine-solver-search-row lefine-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kefine-solver-search-row lefine-text,
  .repo-secondary-task {
    color: var(--lefine-text-soft);
    font-size: 0.82rem;
  }

  .repo-video-trigger {
    justify-self: end;
    min-width: 8.5rem;
  }

  .repo-video-trigger:disabled {
    cursor: progress;
    opacity: 0.58;
  }

  .repo-history-panel ul {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  kefine-video-backdrop {
    position: fixed;
    inset: 0;
    z-index: 8;
    display: grid;
    place-items: center;
    padding: 1rem;
    background: color-mix(in oklab, var(--lefine-text) 38%, transparent);
    isolation: isolate;
  }

  .repo-video-scrim {
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

  .repo-video-dialog {
    position: static;
    z-index: 1;
    display: grid;
    gap: 0.75rem;
    width: min(100%, 22rem);
    max-height: min(90dvh, 42rem);
    margin: 0;
    overflow: auto;
    padding: 1rem;
  }

  .repo-video-dialog header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: center;
  }

  .repo-video-dialog h2 {
    margin: 0;
    font-size: 1rem;
  }

  .repo-metric-list {
    display: grid;
    gap: 0.45rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .repo-metric-list li {
    display: grid;
    grid-template-columns: 2.2rem minmax(0, 1fr);
    gap: 0.5rem;
    min-height: 2rem;
    align-items: center;
    border: 1px solid var(--kef-line);
    border-radius: 0.35rem;
    padding: 0.35rem 0.55rem;
    background: color-mix(in oklab, var(--kef-bg-card) 96%, white 4%);
  }

  video {
    width: 100%;
    max-height: 18rem;
    border: 1px solid var(--kef-line);
    border-radius: 0.5rem;
    background: #120f0c;
  }

  @media (max-width: 760px) {
    .kefine-command-center {
      width: min(100%, calc(100vw - 1rem));
      margin-top: 4.75rem;
    }

    .repo-shell-header,
    .repo-workbench,
    .repo-tabs {
      grid-template-columns: 1fr;
    }

    .repo-url-control,
    .repo-search-field,
    .kefine-solver-search-row {
      grid-template-columns: 1fr;
    }

    .repo-tabs button,
    .repo-video-trigger {
      width: 100%;
    }
  }
</style>
