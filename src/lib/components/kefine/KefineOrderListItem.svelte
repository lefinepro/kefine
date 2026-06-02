<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { OrderView } from './kefine-workflow';

  let {
    order,
    openTaskLabel,
    relatedItemsLabel,
    createServiceLabel = 'Transform to service',
    serviceVariablesLabel = 'Service variables',
    stopTaskLabel = '',
    deleteTaskLabel = '',
    itemTestId,
    openTestId,
    stopTestId,
    deleteTestId,
    showStop = false,
    showDelete = false,
    showCreateService = false,
    searchQuery = '',
    onOpen,
    onCreateService,
    onOpenKeydown,
    onStop,
    onDelete,
    onStopPointerDown,
    onStopPointerUp,
    onStopPointerLeave,
    onStopPointerCancel
  }: {
    order: OrderView;
    openTaskLabel: string;
    relatedItemsLabel: string;
    createServiceLabel?: string;
    serviceVariablesLabel?: string;
    stopTaskLabel?: string;
    deleteTaskLabel?: string;
    itemTestId: string;
    openTestId: string;
    stopTestId?: string;
    deleteTestId?: string;
    showStop?: boolean;
    showDelete?: boolean;
    showCreateService?: boolean;
    searchQuery?: string;
    onOpen: () => void;
    onCreateService?: (event: MouseEvent) => void;
    onOpenKeydown: (event: KeyboardEvent) => void;
    onStop?: (event: MouseEvent) => void;
    onDelete?: (event: MouseEvent) => void;
    onStopPointerDown?: (event: PointerEvent) => void;
    onStopPointerUp?: () => void;
    onStopPointerLeave?: () => void;
    onStopPointerCancel?: () => void;
  } = $props();

  function escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightText(text: string, query: string): string {
    const escapedText = escapeHtml(text);
    if (!query.trim()) return escapedText;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return escapedText.replace(regex, '<mark style="background:color-mix(in oklab, var(--kef-color-primary, #c89a5a) 35%, transparent); color:inherit; border-radius:2px; padding:0 1px;">$1</mark>');
  }

  function normalizeSnippet(text: string | undefined): string {
    return (text ?? '').replace(/\s+/g, ' ').trim();
  }

  function formatTemplateVariableLabel(key: string): string {
    const normalized = key.trim().replace(/[_-]+/g, ' ');
    if (!normalized) {
      return 'Variable';
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const hasLabels = $derived((order.labels?.length ?? 0) > 0);
  const hasServiceVariables = $derived((order.templateVariables?.length ?? 0) > 0);
  const hasExpandedSections = $derived(hasLabels || hasServiceVariables);
  const canMakeTemplate = $derived(order.status === 'completed' || order.status === 'done');
  const orderSnippet = $derived(normalizeSnippet(order.description));
</script>

<li>
  <details
    data-testid={itemTestId}
    data-order-id={order.id}
    data-status={order.status}
    data-has-sections={hasExpandedSections}
  >
    <summary ondblclick={onOpen}>
      <kefine-order-row>
        <kefine-order-disclosure aria-hidden="true">
          <Icon icon="mdi:chevron-down" width="16" height="16" />
        </kefine-order-disclosure>

        <kefine-order-mark aria-hidden="true" data-status={order.status}>
          <task-dot></task-dot>
        </kefine-order-mark>

        <kefine-order-copy>
          <kefine-order-title>{@html highlightText(order.title ?? '', searchQuery)}</kefine-order-title>
          {#if orderSnippet}
            <kefine-order-snippet data-testid={`kefine-order-snippet-${order.id}`}>
              {@html highlightText(orderSnippet, searchQuery)}
            </kefine-order-snippet>
          {/if}
        </kefine-order-copy>
      </kefine-order-row>
    </summary>

    <kefine-order-panel>
      <kefine-order-actions>
        <button
          type="button"
          data-part="open-task"
          data-testid={openTestId}
          onclick={onOpen}
          onkeydown={onOpenKeydown}
        >
          <Icon icon="mdi:arrow-top-right" width="15" height="15" aria-hidden="true" />
          <lefine-text>{openTaskLabel}</lefine-text>
        </button>

        {#if showCreateService && canMakeTemplate}
          <button
            type="button"
            data-part="create-service"
            aria-label={`${createServiceLabel}: ${order.title}`}
            onclick={onCreateService}
          >
            <Icon icon="mdi:wand-sparkles" width="15" height="15" aria-hidden="true" />
            <lefine-text>{createServiceLabel}</lefine-text>
          </button>
        {/if}

        {#if showStop}
          <button
            type="button"
            data-part="status-toggle"
            data-testid={stopTestId}
            aria-label={`${stopTaskLabel}: ${order.title}`}
            data-status={order.status}
            onpointerdown={onStopPointerDown}
            onpointerup={onStopPointerUp}
            onpointerleave={onStopPointerLeave}
            onpointercancel={onStopPointerCancel}
            onclick={onStop}
          >
            <status-mark aria-hidden="true" data-status={order.status}><task-dot></task-dot></status-mark>
            <lefine-text>{stopTaskLabel}</lefine-text>
          </button>
        {/if}

        {#if showDelete}
          <button
            type="button"
            data-part="delete-task"
            data-testid={deleteTestId}
            aria-label={`${deleteTaskLabel}: ${order.title}`}
            onclick={onDelete}
          >
            <Icon icon="mdi:trash-can-outline" width="15" height="15" aria-hidden="true" />
          </button>
        {/if}
      </kefine-order-actions>

      <kefine-order-sections>
        {#if hasLabels}
          <details>
            <summary>{relatedItemsLabel}</summary>
            <kefine-order-tag-list>
              {#each order.labels ?? [] as label (`${order.id}-${label}`)}
                <li>#{label}</li>
              {/each}
            </kefine-order-tag-list>
          </details>
        {/if}

        {#if hasServiceVariables}
          <details>
            <summary>{serviceVariablesLabel}</summary>
            <kefine-order-detail-grid>
              {#each order.templateVariables ?? [] as variable (`${order.id}-${variable.key}`)}
                <kefine-order-detail-row>
                  <dt>{formatTemplateVariableLabel(variable.key)}</dt>
                  <dd>{order.templateVariableValues?.[variable.key] ?? variable.defaultValue ?? '-'}</dd>
                </kefine-order-detail-row>
              {/each}
            </kefine-order-detail-grid>
          </details>
        {/if}
      </kefine-order-sections>
    </kefine-order-panel>
  </details>
</li>

<style>
  li {
    list-style: none;
  }

  li > details {
    border-radius: 0.8rem;
    border: 0;
    background: transparent;
    box-shadow: none;
    overflow: hidden;
    transition: background-color 140ms ease;
  }

  li > details:hover {
    box-shadow: none;
  }

  summary {
    list-style: none;
    cursor: pointer;
  }

  summary:hover kefine-order-row,
  summary:focus-visible kefine-order-row {
    background: transparent;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  kefine-order-row {
    display: grid;
    grid-template-columns: auto auto minmax(0, 1fr);
    align-items: center;
    gap: 0.62rem;
    padding: 0.9rem 1rem 0.9rem 0;
  }

  kefine-order-mark {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    border: 0;
    color: var(--lefine-text-soft);
    background: color-mix(in oklab, var(--kef-bg-card) 86%, transparent);
  }

  kefine-order-mark task-dot,
  status-mark task-dot {
    display: block;
    width: 0.48rem;
    height: 0.48rem;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.95;
  }

  kefine-order-mark[data-status='done'],
  kefine-order-mark[data-status='completed'],
  status-mark[data-status='done'],
  status-mark[data-status='completed'] {
    color: #5e9360;
  }

  kefine-order-mark[data-status='executing'],
  kefine-order-mark[data-status='accepted'],
  status-mark[data-status='executing'],
  status-mark[data-status='accepted'] {
    color: #4f7f9b;
  }

  kefine-order-mark[data-status='stopped'],
  status-mark[data-status='stopped'] {
    color: #a66b55;
  }

  kefine-order-copy {
    display: grid;
    gap: 0.22rem;
    min-width: 0;
  }

  kefine-order-title {
    display: block;
    font-size: 1.02rem;
    line-height: 1.25;
    color: var(--lefine-text);
    overflow-wrap: anywhere;
  }

  kefine-order-snippet {
    display: -webkit-box;
    color: color-mix(in oklab, var(--lefine-text) 66%, transparent);
    font-size: 0.86rem;
    line-height: 1.35;
    overflow: hidden;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    line-clamp: 2;
    -webkit-line-clamp: 2;
  }

  kefine-order-disclosure {
    display: inline-grid;
    place-items: center;
    width: 1.85rem;
    height: 1.85rem;
    border-radius: 999px;
    color: color-mix(in oklab, var(--lefine-text-soft) 88%, var(--kef-primary) 12%);
    background: transparent;
    box-shadow: none;
    opacity: 0;
    transform: rotate(-90deg);
    transform-origin: center;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      opacity var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft);
  }

  li > details:hover kefine-order-disclosure,
  summary:focus-visible kefine-order-disclosure {
    color: var(--lefine-text);
    background: transparent;
    opacity: 1;
  }

  li > details[open] kefine-order-disclosure {
    transform: rotate(0deg);
  }

  kefine-order-disclosure :global(svg) {
    display: block;
  }

  kefine-order-panel {
    display: grid;
    gap: 0.8rem;
    padding: 0 1rem 1rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-line) 22%, transparent);
  }

  kefine-order-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    align-items: center;
    padding-top: 0.75rem;
  }

  button[data-part='open-task'],
  button[data-part='create-service'],
  button[data-part='status-toggle'],
  button[data-part='delete-task'] {
    min-height: 2rem;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line) 62%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, transparent);
    color: var(--lefine-text);
    padding: 0.38rem 0.78rem;
    font: inherit;
  }

  button[data-part='open-task'] {
    color: color-mix(in oklab, var(--lefine-text) 90%, #456c8e 10%);
  }

  button[data-part='create-service'] {
    color: color-mix(in oklab, var(--lefine-text) 90%, #8a5a22 10%);
  }

  button[data-part='delete-task'] {
    width: 2rem;
    min-width: 2rem;
    padding-inline: 0;
    justify-content: center;
    color: color-mix(in oklab, var(--lefine-text) 84%, #8e3f2b 16%);
  }

  kefine-order-sections {
    display: grid;
    gap: 0.5rem;
  }

  kefine-order-sections details {
    border-radius: 0.7rem;
    border-color: color-mix(in oklab, var(--kef-line) 32%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 90%, #efe4bf 10%);
    box-shadow: none;
  }

  kefine-order-sections summary {
    padding: 0.65rem 0.78rem;
    color: var(--lefine-text);
    font-weight: 600;
  }

  kefine-order-sections details[open] summary {
    border-bottom: 1px solid color-mix(in oklab, var(--kef-line) 18%, transparent);
  }

  kefine-order-detail-grid {
    display: grid;
    gap: 0;
    padding: 0.2rem 0.78rem 0.78rem;
  }

  kefine-order-detail-row {
    display: grid;
    grid-template-columns: minmax(0, 10rem) minmax(0, 1fr);
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid color-mix(in oklab, var(--kef-line) 12%, transparent);
  }

  kefine-order-detail-row:last-child {
    border-bottom: 0;
  }

  kefine-order-detail-row dt,
  kefine-order-detail-row dd {
    margin: 0;
    min-width: 0;
  }

  kefine-order-detail-row dt {
    color: var(--lefine-text-soft);
  }

  kefine-order-detail-row dd {
    color: var(--lefine-text);
    overflow-wrap: anywhere;
    display: grid;
    gap: 0.2rem;
  }

  kefine-order-tag-list {
    margin: 0;
    padding: 0.2rem 0.78rem 0.82rem 1.7rem;
    display: grid;
    gap: 0.42rem;
    color: var(--lefine-text-soft);
  }

  @media (max-width: 760px) {
    kefine-order-row {
      grid-template-columns: auto auto minmax(0, 1fr);
    }

    kefine-order-detail-row {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }
</style>
