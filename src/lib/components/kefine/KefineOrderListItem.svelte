<script lang="ts">
  import type { OrderView } from './kefine-workflow';
  import {
    formatKefineOrderPrice,
    formatKefineOrderStatus,
    formatKefineOrderTime
  } from '$lib/components/kefine/kefine-order-formatters';

  let {
    order,
    statusLabel,
    timeLeftLabel,
    priceLabel,
    stopTaskLabel = '',
    itemTestId,
    openTestId,
    etaTestId,
    stopTestId,
    showStop = false,
    onOpen,
    onOpenKeydown,
    onStop,
    onStopPointerDown,
    onStopPointerUp,
    onStopPointerLeave,
    onStopPointerCancel
  }: {
    order: OrderView;
    statusLabel: string;
    timeLeftLabel: string;
    priceLabel: string;
    stopTaskLabel?: string;
    itemTestId: string;
    openTestId: string;
    etaTestId: string;
    stopTestId?: string;
    showStop?: boolean;
    onOpen: () => void;
    onOpenKeydown: (event: KeyboardEvent) => void;
    onStop?: (event: MouseEvent) => void;
    onStopPointerDown?: (event: PointerEvent) => void;
    onStopPointerUp?: () => void;
    onStopPointerLeave?: () => void;
    onStopPointerCancel?: () => void;
  } = $props();
</script>

<li>
  <kefine-order-item
    data-testid={itemTestId}
    data-order-id={order.id}
    data-status={order.status}
    role="button"
    tabindex="0"
    onclick={onOpen}
    onkeydown={onOpenKeydown}
  >
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
      </button>
    {/if}

    <section data-part="open" data-testid={openTestId}>
      <kefine-order-summary>
        <kefine-order-title>{order.title}</kefine-order-title>
        <kefine-order-meta>
          <kefine-order-solver>{order.solver}</kefine-order-solver>
          <kefine-order-estimate data-testid={etaTestId}>
            <span>{statusLabel} {formatKefineOrderStatus(order.status)}</span>
            <span>{formatKefineOrderTime(order, timeLeftLabel)}</span>
            <span>{formatKefineOrderPrice(order, priceLabel)}</span>
          </kefine-order-estimate>
        </kefine-order-meta>
      </kefine-order-summary>
    </section>
  </kefine-order-item>
</li>

<style>
  kefine-order-item {
    width: 100%;
    border: 0;
    border-radius: 0.4rem;
    background: color-mix(in oklab, var(--kef-bg-card) 99%, var(--kef-bg-soft));
    padding: clamp(0.68rem, 2vw, 0.86rem);
    text-align: left;
    display: grid;
    gap: 0.3rem;
    min-width: 0;
    transition:
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-order-item:hover {
    background: color-mix(in oklab, var(--kef-bg-card) 100%, white);
    box-shadow: 0 14px 26px color-mix(in oklab, var(--kef-text) 6%, transparent);
  }

  kefine-order-item[data-status='done'] {
    border-color: color-mix(in oklab, var(--kef-primary) 28%, transparent);
  }

  kefine-order-item[data-status='stopped'] {
    opacity: 0.72;
  }

  section[data-part='open'] {
    min-width: 0;
  }

  kefine-order-summary {
    display: grid;
    gap: 0.28rem;
    min-width: 0;
  }

  kefine-order-title {
    display: block;
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.2;
    color: var(--kef-text);
    overflow-wrap: anywhere;
  }

  kefine-order-meta {
    display: grid;
    gap: 0.28rem;
    color: var(--kef-text-soft);
    font-size: 0.84rem;
  }

  kefine-order-solver {
    display: block;
  }

  kefine-order-estimate {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem 0.8rem;
  }

  button[data-part='status-toggle'] {
    width: 2rem;
    min-width: 2rem;
    min-height: 2rem;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line) 78%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, transparent);
    color: var(--kef-text);
    padding: 0;
    margin-bottom: 0.35rem;
  }

  button[data-part='status-toggle'][data-status='done'] {
    border-color: color-mix(in oklab, var(--kef-primary) 44%, transparent);
    background: color-mix(in oklab, var(--kef-primary) 10%, var(--kef-bg-card));
  }

  button[data-part='status-toggle'][data-status='completed'],
  button[data-part='status-toggle'][data-status='executing'],
  button[data-part='status-toggle'][data-status='accepted'] {
    border-color: color-mix(in oklab, #9dcc7a 44%, transparent);
    background: color-mix(in oklab, #9dcc7a 14%, var(--kef-bg-card));
  }

  button[data-part='status-toggle'][data-status='stopped'] {
    border-color: color-mix(in oklab, #d68a6c 44%, transparent);
    background: color-mix(in oklab, #d68a6c 10%, var(--kef-bg-card));
  }

  button[data-part='status-toggle'] task-dot {
    display: block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 999px;
    background: currentColor;
    opacity: 0.9;
  }
</style>
