<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { OrderView } from './kefine-workflow';
  import {
    formatKefineOrderStatus,
    formatKefineOrderTime
  } from '$lib/components/kefine/kefine-order-formatters';

  let {
    order,
    statusLabel,
    timeLeftLabel,
    solverLabel,
    openTaskLabel,
    summaryLabel,
    executionLabel,
    relatedItemsLabel,
    windowLabel,
    createServiceLabel = 'Transform to service',
    serviceVariablesLabel = 'Service variables',
    stopTaskLabel = '',
    deleteTaskLabel = '',
    itemTestId,
    openTestId,
    etaTestId,
    stopTestId,
    deleteTestId,
    showStop = false,
    showDelete = false,
    showCreateService = false,
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
    statusLabel: string;
    timeLeftLabel: string;
    solverLabel: string;
    openTaskLabel: string;
    summaryLabel: string;
    executionLabel: string;
    relatedItemsLabel: string;
    windowLabel: string;
    createServiceLabel?: string;
    serviceVariablesLabel?: string;
    stopTaskLabel?: string;
    deleteTaskLabel?: string;
    itemTestId: string;
    openTestId: string;
    etaTestId: string;
    stopTestId?: string;
    deleteTestId?: string;
    showStop?: boolean;
    showDelete?: boolean;
    showCreateService?: boolean;
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

  function formatTemplateVariableLabel(key: string): string {
    const normalized = key.trim().replace(/[_-]+/g, ' ');
    if (!normalized) {
      return 'Variable';
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  const formattedStatus = $derived(formatKefineOrderStatus(order.status));
  const formattedTime = $derived(formatKefineOrderTime(order, timeLeftLabel));
  const hasDescription = $derived(Boolean(order.description?.trim() && order.description !== order.title));
  const hasLabels = $derived((order.labels?.length ?? 0) > 0);
  const hasServiceVariables = $derived((order.templateVariables?.length ?? 0) > 0);
  const hasSolverInfo = $derived(Boolean(order.solver?.trim() || order.solverHandle?.trim()));
  const hasExpandedSections = $derived(
    hasDescription || hasSolverInfo || hasLabels || hasServiceVariables || Boolean(order.executionEstimate)
  );
  const canMakeTemplate = $derived(order.status === 'completed' || order.status === 'done');
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
        <kefine-order-mark aria-hidden="true" data-status={order.status}>
          <task-dot></task-dot>
        </kefine-order-mark>

        <kefine-order-copy>
          <kefine-order-title>{order.title}</kefine-order-title>
          <kefine-order-meta data-testid={etaTestId}>
            <lefine-text>{formattedStatus}</lefine-text>
            <lefine-text>{formattedTime}</lefine-text>
          </kefine-order-meta>
        </kefine-order-copy>

        <kefine-order-disclosure aria-hidden="true">
          <Icon icon="mdi:chevron-down" width="18" height="18" />
        </kefine-order-disclosure>
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
        <details open>
          <summary>{summaryLabel}</summary>
          <kefine-order-detail-grid>
            <kefine-order-detail-row>
              <dt>{statusLabel}</dt>
              <dd>{formattedStatus}</dd>
            </kefine-order-detail-row>
            <kefine-order-detail-row>
              <dt>{timeLeftLabel}</dt>
              <dd>{order.executionEstimate || '-'}</dd>
            </kefine-order-detail-row>
          </kefine-order-detail-grid>
          {#if hasDescription}
            <p data-part="description">{order.description}</p>
          {/if}
        </details>

        {#if hasSolverInfo || order.executionEstimate}
          <details>
            <summary>{executionLabel}</summary>
            <kefine-order-detail-grid>
              {#if hasSolverInfo}
                <kefine-order-detail-row>
                  <dt>{solverLabel}</dt>
                  <dd>
                    {order.solver}
                    {#if order.solverHandle}
                      <lefine-text>{order.solverHandle}</lefine-text>
                    {/if}
                  </dd>
                </kefine-order-detail-row>
              {/if}
              {#if order.executionEstimate}
                <kefine-order-detail-row>
                  <dt>{windowLabel}</dt>
                  <dd>{order.executionEstimate}</dd>
                </kefine-order-detail-row>
              {/if}
            </kefine-order-detail-grid>
          </details>
        {/if}

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
    border: 1px solid color-mix(in oklab, var(--kef-line) 72%, transparent);
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--kef-bg-card) 97%, #f6edd2 3%), color-mix(in oklab, var(--kef-bg-card) 99%, transparent)),
      repeating-linear-gradient(
        0deg,
        transparent 0,
        transparent 28px,
        color-mix(in oklab, var(--kef-line) 8%, transparent) 28px,
        color-mix(in oklab, var(--kef-line) 8%, transparent) 29px
      );
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--kef-line) 26%, transparent),
      inset 0 1px 0 color-mix(in oklab, white 26%, transparent),
      0 8px 18px color-mix(in oklab, var(--lefine-text) 4%, transparent);
    overflow: hidden;
    transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease, background-color 140ms ease;
  }

  li > details:hover {
    border-color: color-mix(in oklab, var(--kef-primary, #b97a28) 36%, transparent);
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--kef-primary, #b97a28) 20%, transparent),
      inset 0 1px 0 color-mix(in oklab, white 28%, transparent),
      0 12px 24px color-mix(in oklab, var(--lefine-text) 9%, transparent);
    transform: translateY(-1px);
  }

  summary {
    list-style: none;
    cursor: pointer;
  }

  summary:hover kefine-order-row,
  summary:focus-visible kefine-order-row {
    background: color-mix(in oklab, var(--kef-bg-hover, #eadcbc) 42%, transparent);
  }

  summary::-webkit-details-marker {
    display: none;
  }

  kefine-order-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: start;
    gap: 0.8rem;
    padding: 0.9rem 1rem;
  }

  kefine-order-mark {
    width: 1.2rem;
    height: 1.2rem;
    margin-top: 0.1rem;
    border-radius: 999px;
    display: inline-grid;
    place-items: center;
    border: 1px solid color-mix(in oklab, var(--kef-line) 58%, transparent);
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

  kefine-order-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem 0.8rem;
    color: var(--lefine-text-soft);
    font-size: 0.84rem;
  }

  kefine-order-disclosure {
    color: var(--lefine-text-soft);
    transition: transform var(--kef-motion-fast) var(--kef-ease-soft);
  }

  li > details[open] kefine-order-disclosure {
    transform: rotate(180deg);
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

  p[data-part='description'] {
    margin: 0;
    padding: 0 0.78rem 0.78rem;
    color: var(--lefine-text-soft);
    line-height: 1.45;
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
      grid-template-columns: auto minmax(0, 1fr);
    }

    kefine-order-disclosure {
      grid-column: 2;
      justify-self: end;
      margin-top: -1.65rem;
    }

    kefine-order-detail-row {
      grid-template-columns: 1fr;
      gap: 0.2rem;
    }
  }
</style>
