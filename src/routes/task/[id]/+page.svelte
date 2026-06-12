<script lang="ts">
  import { browser } from '$app/environment';
  import { page as routePage } from '$app/state';
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import {
    extractStatusPayload,
    ORDER_STORAGE_KEY,
    parseStoredOrders,
    type NotebookBlockType,
    type OrderNotebookBlock,
    type OrderView,
    type ProgressState
  } from '$lib/components/kefine/kefine-workflow';
  import { resolveTaskDocumentContent } from '$lib/components/kefine/kefine-task-feed';
  import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
  import { KEFINE_TEXT_HY } from '$lib/constants/kefine-locale-hy';
  import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';
  import type { KefineLocaleText } from '$lib/constants/kefine-locale';
  import { topbarSearchPlaceholderOverride } from '$lib/kefine/topbar/topbar-search-context';
  import { readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';

  type MarkdownBlock =
    | {
        id: string;
        type: 'heading';
        level: number;
        content: string;
      }
    | {
        id: string;
        type: 'paragraph';
        content: string;
      }
    | {
        id: string;
        type: 'list';
        items: string[];
      }
    | {
        id: string;
        type: 'code';
        language: string;
        content: string;
      };

  type PropertyRow = {
    id: string;
    label: string;
    value: string;
    icon: string;
    href?: string;
  };

  type DetailBlock = OrderNotebookBlock & {
    sourceTitle?: string;
  };

  let { data }: { data: { initialOrderId: string } } = $props();

  let order = $state<OrderView | null>(null);
  let loading = $state(true);
  let unavailable = $state(false);

  const activeLocale = $derived(readLocaleFromPathname(routePage.url.pathname) ?? 'en');
  const localeText = $derived(
    (activeLocale === 'ru' ? KEFINE_TEXT_RU : activeLocale === 'hy' ? KEFINE_TEXT_HY : KEFINE_TEXT_EN) as unknown as KefineLocaleText
  );
  const taskCompleted = $derived(isTaskCompleted(order));
  const taskSearchContext = $derived(order ? resolveTaskSearchContext(order) : '');
  const labels = $derived(order?.labels?.map((label) => label.trim()).filter(Boolean) ?? []);
  const propertyRows = $derived(resolvePropertyRows(order, activeLocale));
  const markdownBlocks = $derived(parseMarkdownBlocks(resolveTaskText(order)));
  const subtasks = $derived(order?.executionSteps ?? []);
  const detailBlocks = $derived(resolveDetailBlocks(order));

  onMount(() => {
    void loadTask();
  });

  $effect(() => {
    topbarSearchPlaceholderOverride.set(taskSearchContext || null);
    return () => topbarSearchPlaceholderOverride.set(null);
  });

  async function loadTask() {
    if (!browser) {
      return;
    }

    loading = true;
    unavailable = false;

    const storedOrder = readStoredOrder(data.initialOrderId);
    if (storedOrder) {
      order = storedOrder;
    }

    const remoteOrder = await fetchRemoteOrder(data.initialOrderId, storedOrder);
    if (remoteOrder) {
      order = mergeTaskOrder(storedOrder, remoteOrder);
      loading = false;
      unavailable = false;
      return;
    }

    loading = false;
    unavailable = !storedOrder;
  }

  function readStoredOrder(routeOrderId: string): OrderView | null {
    try {
      const orders = parseStoredOrders(localStorage.getItem(ORDER_STORAGE_KEY), localeText);
      const normalized = routeOrderId.trim();
      const decoded = decodeRouteValue(normalized);

      return (
        orders.find((item) => item.id === decoded) ||
        orders.find((item) => item.shareId === decoded) ||
        orders.find((item) => encodeURIComponent(item.id) === normalized) ||
        orders.find((item) => item.shareId && encodeURIComponent(item.shareId) === normalized) ||
        null
      );
    } catch {
      return null;
    }
  }

  async function fetchRemoteOrder(routeOrderId: string, fallbackOrder: OrderView | null): Promise<OrderView | null> {
    try {
      const response = await fetch(`/api/status/${encodeURIComponent(routeOrderId)}`, {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();
      return extractStatusPayload(
        payload,
        {
          title: fallbackOrder?.title ?? '',
          description: fallbackOrder?.description ?? '',
          currency: fallbackOrder?.currency ?? localeText.defaults.defaultCurrency,
          createdAt: fallbackOrder?.createdAt ?? new Date().toISOString()
        },
        localeText
      );
    } catch {
      return null;
    }
  }

  function mergeTaskOrder(storedOrder: OrderView | null, remoteOrder: OrderView): OrderView {
    if (!storedOrder) {
      return remoteOrder;
    }

    return {
      ...storedOrder,
      ...remoteOrder,
      id: remoteOrder.id || storedOrder.id,
      shareId: remoteOrder.shareId || storedOrder.shareId,
      labels: remoteOrder.labels?.length ? remoteOrder.labels : storedOrder.labels,
      executionSteps: remoteOrder.executionSteps?.length ? remoteOrder.executionSteps : storedOrder.executionSteps,
      document: remoteOrder.document || storedOrder.document,
      notebook: remoteOrder.notebook || storedOrder.notebook,
      result: remoteOrder.result || storedOrder.result,
      repository: remoteOrder.repository || storedOrder.repository
    };
  }

  function decodeRouteValue(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  function resolveTaskText(currentOrder: OrderView | null): string {
    const content = resolveTaskDocumentContent(currentOrder).trim();
    if (content) {
      return content;
    }

    return currentOrder?.description?.trim() || '';
  }

  function parseMarkdownBlocks(content: string): MarkdownBlock[] {
    const blocks: MarkdownBlock[] = [];
    const paragraph: string[] = [];
    const listItems: string[] = [];
    let codeLines: string[] | null = null;
    let codeLanguage = '';

    function nextId(type: string): string {
      return `${type}-${blocks.length + 1}`;
    }

    function pushParagraph() {
      const value = paragraph.join(' ').trim();
      if (value) {
        blocks.push({
          id: nextId('paragraph'),
          type: 'paragraph',
          content: value
        });
      }
      paragraph.length = 0;
    }

    function pushList() {
      if (listItems.length > 0) {
        blocks.push({
          id: nextId('list'),
          type: 'list',
          items: [...listItems]
        });
      }
      listItems.length = 0;
    }

    function pushCode() {
      if (codeLines) {
        blocks.push({
          id: nextId('code'),
          type: 'code',
          language: codeLanguage,
          content: codeLines.join('\n').trimEnd()
        });
      }
      codeLines = null;
      codeLanguage = '';
    }

    for (const rawLine of content.replace(/\r\n/g, '\n').split('\n')) {
      const fence = rawLine.match(/^```([\w-]+)?\s*$/);
      if (fence) {
        if (codeLines) {
          pushCode();
        } else {
          pushParagraph();
          pushList();
          codeLines = [];
          codeLanguage = fence[1]?.trim() ?? '';
        }
        continue;
      }

      if (codeLines) {
        codeLines.push(rawLine);
        continue;
      }

      const line = rawLine.trim();
      if (!line) {
        pushParagraph();
        pushList();
        continue;
      }

      const heading = line.match(/^(#{1,4})\s+(.+)$/);
      if (heading) {
        pushParagraph();
        pushList();
        blocks.push({
          id: nextId('heading'),
          type: 'heading',
          level: heading[1]?.length ?? 2,
          content: heading[2]?.trim() ?? ''
        });
        continue;
      }

      const bullet = line.match(/^[-*]\s+(.+)$/);
      if (bullet) {
        pushParagraph();
        listItems.push(bullet[1]?.trim() ?? '');
        continue;
      }

      pushList();
      paragraph.push(line);
    }

    pushParagraph();
    pushList();
    if (codeLines) {
      pushCode();
    }

    return blocks;
  }

  function resolvePropertyRows(currentOrder: OrderView | null, locale: string): PropertyRow[] {
    if (!currentOrder) {
      return [];
    }

    const rows: PropertyRow[] = [
      {
        id: 'type',
        label: 'Type',
        value: resolveTaskKind(currentOrder),
        icon: 'lucide:file-text'
      },
      {
        id: 'status',
        label: 'Status',
        value: formatCompletionStatus(currentOrder),
        icon: 'lucide:circle-dot'
      }
    ];

    appendRow(rows, {
      id: 'price',
      label: 'Price',
      value: formatPrice(currentOrder.estimatedCost, currentOrder.currency),
      icon: 'lucide:coins'
    });
    appendRow(rows, {
      id: 'estimate',
      label: 'Estimate',
      value: currentOrder.executionEstimate ?? '',
      icon: 'lucide:timer'
    });
    appendRow(rows, {
      id: 'owner',
      label: 'Owner',
      value: currentOrder.ownerDisplayName || currentOrder.ownerUsername || currentOrder.actorHandle || '',
      icon: 'lucide:at-sign'
    });
    appendRow(rows, {
      id: 'created',
      label: 'Created',
      value: formatDate(currentOrder.createdAt, locale),
      icon: 'lucide:calendar'
    });

    return rows;
  }

  function appendRow(rows: PropertyRow[], row: PropertyRow) {
    if (row.value.trim()) {
      rows.push(row);
    }
  }

  function resolveDetailBlocks(currentOrder: OrderView | null): DetailBlock[] {
    if (!currentOrder) {
      return [];
    }

    const notebookBlocks =
      currentOrder.notebook?.steps.flatMap((step) =>
        step.blocks.map((block) => ({
          ...block,
          sourceTitle: step.title
        }))
      ) ?? [];
    const resultBlocks = currentOrder.result?.blocks.map((block) => ({
      ...block,
      sourceTitle: currentOrder.result?.title
    })) ?? [];
    const interimBlocks = currentOrder.interimResult?.blocks.map((block) => ({
      ...block,
      sourceTitle: currentOrder.interimResult?.title
    })) ?? [];

    return [...notebookBlocks, ...interimBlocks, ...resultBlocks].filter((block) => block.content.trim());
  }

  function isTaskCompleted(currentOrder: OrderView | null): boolean {
    const normalized = currentOrder?.status?.toLowerCase() ?? '';
    return normalized === 'completed' || normalized === 'done';
  }

  function isStateCompleted(state: ProgressState): boolean {
    return state === 'completed';
  }

  function resolveTaskKind(currentOrder: OrderView): string {
    return resolveTaskText(currentOrder).trim() ? 'Document' : 'Task';
  }

  function formatCompletionStatus(currentOrder: OrderView): string {
    return isTaskCompleted(currentOrder) ? 'Completed' : 'Open';
  }

  function formatPrice(amount: number | undefined, currency: string | undefined): string {
    if (amount === undefined) {
      return '';
    }

    const normalizedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
    return `${normalizedAmount} ${currency?.trim() || 'USD'}`;
  }

  function formatRepository(currentOrder: OrderView): string {
    const repository = currentOrder.repository;
    if (!repository) {
      return '';
    }

    const owner = repository.ownerHandle?.replace(/^@+/, '').trim();
    if (owner && repository.slug) {
      return `@${owner}/${repository.slug}`;
    }

    return repository.slug || repository.name || repository.id;
  }

  function resolveTaskSearchContext(currentOrder: OrderView): string {
    const project = formatRepository(currentOrder);
    return [project, currentOrder.title.trim() ? `task:${currentOrder.title.trim()}` : '']
      .filter(Boolean)
      .join(' ');
  }

  function formatDate(value: string | undefined, locale: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function blockLabel(type: NotebookBlockType): string {
    switch (type) {
      case 'code':
        return 'Code';
      case 'output':
        return 'Output';
      case 'artifact':
        return 'Artifact';
      case 'diff':
        return 'Diff';
      case 'warning':
        return 'Warning';
      default:
        return 'Note';
    }
  }

  function blockIcon(type: NotebookBlockType): string {
    switch (type) {
      case 'code':
        return 'lucide:square-code';
      case 'output':
        return 'lucide:terminal-square';
      case 'artifact':
        return 'lucide:paperclip';
      case 'diff':
        return 'lucide:file-diff';
      case 'warning':
        return 'lucide:triangle-alert';
      default:
        return 'lucide:file-text';
    }
  }

  function isCodeLikeBlock(type: NotebookBlockType): boolean {
    return type === 'code' || type === 'output' || type === 'diff';
  }
</script>

<svelte:head>
  <title>{order ? `${order.title} | Lefine` : 'Task | Lefine'}</title>
</svelte:head>

<lef-task-document-page data-testid="kefine-task-document-page">
  <lef-task-document-shell>
    {#if loading && !order}
      <lef-task-empty-state>
        <h1>Loading task</h1>
      </lef-task-empty-state>
    {:else if unavailable || !order}
      <lef-task-empty-state>
        <h1>Task not found</h1>
        <p>This task is not available.</p>
      </lef-task-empty-state>
    {:else}
      <aside data-testid="kefine-task-document-sidebar" aria-label="Task document navigation">
        <nav>
          <a href="#overview">
            <Icon icon="lucide:layout-dashboard" width="15" height="15" aria-hidden="true" />
            <lefine-text>Overview</lefine-text>
          </a>
          <a href="#details">
            <Icon icon="lucide:list-checks" width="15" height="15" aria-hidden="true" />
            <lefine-text>Details</lefine-text>
          </a>
          {#if subtasks.length > 0}
            <a href="#subtasks">
              <Icon icon="lucide:check-square" width="15" height="15" aria-hidden="true" />
              <lefine-text>Subtasks</lefine-text>
            </a>
          {/if}
          {#if detailBlocks.length > 0}
            <a href="#activity">
              <Icon icon="lucide:history" width="15" height="15" aria-hidden="true" />
              <lefine-text>Activity</lefine-text>
            </a>
          {/if}
        </nav>
      </aside>

      <article id="overview" aria-label="Task document">
        <lef-task-title-block>
          <lef-task-title-row>
            <input type="checkbox" aria-label="Task completion" checked={taskCompleted} disabled />
            <h1>{order.title}</h1>
          </lef-task-title-row>

          {#if labels.length > 0}
            <lef-task-label-list aria-label="Task labels">
              {#each labels as label}
                <lefine-text>{label}</lefine-text>
              {/each}
            </lef-task-label-list>
          {/if}
        </lef-task-title-block>

        <lef-task-property-grid id="details" data-testid="kefine-task-document-properties">
          {#each propertyRows as row}
            <lef-task-property>
              <Icon icon={row.icon} width="16" height="16" aria-hidden="true" />
              <strong>{row.label}</strong>
              <lef-task-property-value>
                {#if row.href}
                  <a href={row.href}>{row.value}</a>
                {:else}
                  {row.value}
                {/if}
              </lef-task-property-value>
            </lef-task-property>
          {/each}
        </lef-task-property-grid>



        {#if subtasks.length > 0}
          <section id="subtasks" aria-label="Subtasks" data-testid="kefine-task-document-subtasks">
            <ol>
              {#each subtasks as subtask}
                <li>
                  <input
                    type="checkbox"
                    aria-label={subtask.title}
                    checked={isStateCompleted(subtask.state)}
                    disabled
                  />
                  <lef-task-subtask-copy>
                    <strong>{subtask.title}</strong>
                    {#if subtask.detail}
                      <p>{subtask.detail}</p>
                    {/if}
                  </lef-task-subtask-copy>
                </li>
              {/each}
            </ol>
          </section>
        {/if}

        {#if detailBlocks.length > 0}
          <section id="activity" aria-label="More" data-testid="kefine-task-document-blocks">
            <lef-task-detail-block-list>
              {#each detailBlocks as block}
                <lef-task-detail-block data-kind={block.type}>
                  <lef-task-detail-heading>
                    <Icon icon={blockIcon(block.type)} width="16" height="16" aria-hidden="true" />
                    <strong>{block.title || block.sourceTitle || blockLabel(block.type)}</strong>
                    {#if block.language}
                      <lefine-text>{block.language}</lefine-text>
                    {/if}
                  </lef-task-detail-heading>
                  {#if isCodeLikeBlock(block.type)}
                    <pre><code>{block.content}</code></pre>
                  {:else}
                    <p>{block.content}</p>
                  {/if}
                </lef-task-detail-block>
              {/each}
            </lef-task-detail-block-list>
          </section>
        {/if}
      </article>
    {/if}
  </lef-task-document-shell>
</lef-task-document-page>

<style>
  lef-task-document-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--kef-bg);
    color: var(--lefine-text);
  }

  lef-task-document-shell {
    display: grid;
    grid-template-columns: 13rem minmax(0, 1fr);
    align-items: start;
    width: min(76rem, 100%);
    margin: 0 auto;
    gap: 1.1rem;
    padding: 2rem 1.5rem 4rem;
  }

  aside {
    display: block;
    position: sticky;
    top: 5.25rem;
    min-width: 0;
  }

  nav {
    display: grid;
    gap: 0.25rem;
  }

  nav a {
    display: grid;
    grid-template-columns: 1rem minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    min-height: 2.35rem;
    border-radius: 0.5rem;
    padding: 0.45rem 0.6rem;
    color: var(--lefine-text-soft);
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
  }

  nav a:hover,
  nav a:focus-visible {
    background: color-mix(in oklab, var(--kef-color-primary, var(--kef-primary)) 8%, transparent);
    color: var(--lefine-text);
  }

  nav a lefine-text {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  article,
  lef-task-empty-state,
  lef-task-markdown,
  lef-task-detail-block-list,
  lef-task-detail-block,
  lef-task-subtask-copy {
    display: grid;
  }

  article {
    gap: 1.25rem;
    min-width: 0;
  }

  lef-task-empty-state {
    grid-column: 1 / -1;
    min-height: 18rem;
    align-content: center;
    gap: 0.5rem;
  }

  lef-task-title-block {
    display: grid;
    gap: 0.75rem;
  }

  lef-task-title-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.75rem;
  }

  lef-task-title-row > input,
  ol input {
    width: 1.2rem;
    height: 1.2rem;
    margin: 0;
    accent-color: var(--kef-success, #5f7962);
  }

  lef-task-title-row > input {
    align-self: center;
  }

  h1,
  p {
    margin: 0;
  }

  h1 {
    max-width: 32ch;
    font-size: 1.85rem;
    line-height: 1.15;
  }

  p {
    max-width: 70ch;
    color: var(--lefine-text-soft);
  }

  lef-task-label-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    padding-left: 1.95rem;
  }

  lef-task-label-list lefine-text {
    display: inline-flex;
    min-height: 1.5rem;
    align-items: center;
    border-radius: 0.4rem;
    padding: 0 0.5rem;
    background: var(--kef-bg-soft);
    border: 1px solid var(--kef-line-soft);
    color: var(--lefine-text-soft);
    font-size: 0.75rem;
    font-weight: 700;
  }

  lef-task-property-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem 1.5rem;
    padding: 0.2rem 0 0.4rem;
  }

  lef-task-property {
    display: grid;
    grid-template-columns: 1rem 5.5rem minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    min-height: 1.75rem;
    color: var(--lefine-text-soft);
    font-size: 0.9rem;
  }

  lef-task-property strong {
    color: var(--lefine-text-soft);
    font-size: 0.74rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  lef-task-property-value {
    display: block;
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--lefine-text);
    font-weight: 600;
  }

  lef-task-property-value a {
    color: var(--kef-color-primary, var(--kef-primary));
  }

  section {
    display: grid;
    gap: 0.8rem;
    padding: 0.35rem 0 0;
  }

  lef-task-markdown {
    gap: 0.85rem;
  }

  lef-task-markdown-heading {
    display: block;
    color: var(--lefine-text);
    font-weight: 800;
  }

  lef-task-markdown-heading[data-level='1'] {
    font-size: 1.3rem;
  }

  lef-task-markdown-heading[data-level='2'] {
    font-size: 1.1rem;
  }

  ul,
  ol {
    display: grid;
    gap: 0.55rem;
    margin: 0;
    padding: 0;
  }

  ul li {
    position: relative;
    padding-left: 1rem;
    color: var(--lefine-text-soft);
  }

  ul li::before {
    position: absolute;
    top: 0.7rem;
    left: 0;
    width: 0.35rem;
    height: 0.35rem;
    border-radius: 50%;
    background: var(--kef-color-primary, var(--kef-primary));
    content: '';
  }

  ol li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0.75rem;
    padding: 0.35rem 0;
  }

  ol input {
    margin-top: 0.15rem;
  }

  lef-task-subtask-copy {
    gap: 0.15rem;
  }

  lef-task-subtask-copy strong {
    font-size: 0.92rem;
    color: var(--lefine-text);
  }

  lef-task-subtask-copy p {
    color: var(--lefine-text-soft);
    font-size: 0.88rem;
  }

  lef-task-markdown-code,
  lef-task-detail-block {
    display: grid;
    gap: 0.45rem;
  }

  lef-task-markdown-code > lefine-text,
  lef-task-detail-heading lefine-text {
    display: inline-flex;
    justify-self: start;
    border-radius: 0.4rem;
    padding: 0.1rem 0.45rem;
    background: var(--kef-bg-soft);
    border: 1px solid var(--kef-line-soft);
    color: var(--lefine-text-soft);
    font-size: 0.72rem;
    font-weight: 800;
  }

  pre {
    width: 100%;
    max-width: 100%;
    overflow: auto;
    border-radius: 0.5rem;
    padding: 0.9rem;
    background: var(--kef-bg-soft);
    border: 1px solid var(--kef-line-soft);
    color: var(--lefine-text);
    font-size: 0.85rem;
    line-height: 1.55;
  }

  code {
    font-family: var(--kef-font-family-mono);
  }

  lef-task-detail-block-list {
    gap: 0.9rem;
  }

  lef-task-detail-block {
    border-left: 3px solid color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 60%, var(--kef-line));
    padding-left: 0.9rem;
  }

  lef-task-detail-heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--lefine-text);
  }

  lef-task-detail-heading strong {
    font-size: 0.92rem;
  }

  @media (max-width: 720px) {
    lef-task-document-shell {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding: 1rem 0.9rem 3rem;
    }

    aside {
      position: static;
    }

    nav {
      grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    }

    nav a {
      justify-content: center;
    }

    h1 {
      max-width: none;
      font-size: 1.5rem;
    }

    lef-task-property-grid {
      grid-template-columns: 1fr;
    }

    lef-task-property {
      grid-template-columns: 1rem 4.5rem minmax(0, 1fr);
    }
  }
</style>
