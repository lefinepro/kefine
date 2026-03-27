<script lang="ts">
  import { onMount } from 'svelte';
  import type { DraftOrder, OrderView } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';

  const PLACEHOLDER_TYPE_DELAY_MS = 58;
  const PLACEHOLDER_DELETE_DELAY_MS = 34;
  const PLACEHOLDER_PAUSE_MS = 1150;
  const PLACEHOLDER_NEXT_DELAY_MS = 250;

  let {
    draft,
    titleFontSize,
    title,
    placeholder,
    placeholderVariants,
    executeAria,
    solverLabel,
    recentOrders,
    matchedOrders,
    isSearching,
    totalOrders,
    hasMoreOrders,
    matchedTasksLabel,
    timeLeftLabel,
    priceLabel,
    statusLabel,
    stopTaskLabel,
    onSubmit,
    onQueueTask,
    onStopOrder,
    onOpenOrder,
    onLoadMoreOrders
  }: {
    draft: DraftOrder;
    titleFontSize: number;
    title: string;
    placeholder: string;
    placeholderVariants: readonly string[];
    executeAria: string;
    solverLabel: string;
    recentOrders: OrderView[];
    matchedOrders: OrderView[];
    isSearching: boolean;
    totalOrders: number;
    hasMoreOrders: boolean;
    matchedTasksLabel: string;
    timeLeftLabel: string;
    priceLabel: string;
    statusLabel: string;
    stopTaskLabel: string;
    onSubmit: () => void;
    onQueueTask: (title: string) => Promise<void> | void;
    onStopOrder: (order: OrderView, event: Event) => void;
    onOpenOrder: (order: OrderView) => void;
    onLoadMoreOrders: () => void;
  } = $props();

  let animatedPlaceholder = $state('');
  let currentPlaceholderPhrase = $state('');
  let isLoadingMore = $state(false);
  let touchStopTimers = new Map<string, () => void>();
  let touchStopTriggered = new Set<string>();

  onMount(() => {
    const variants = placeholderVariants.length > 0 ? [...placeholderVariants] : [placeholder];
    let cancelTick: (() => void) | null = null;
    let variantIndex = 0;
    let charIndex = 0;
    let deleting = false;

    const tick = () => {
      const active = variants[variantIndex] ?? placeholder;
      currentPlaceholderPhrase = active;

      if (!deleting) {
        if (charIndex < active.length) {
          charIndex += 1;
          animatedPlaceholder = active.slice(0, charIndex);
          cancelTick = scheduleAfter(PLACEHOLDER_TYPE_DELAY_MS, tick);
          return;
        }

        deleting = true;
        cancelTick = scheduleAfter(PLACEHOLDER_PAUSE_MS, tick);
        return;
      }

      if (charIndex > 0) {
        charIndex -= 1;
        animatedPlaceholder = active.slice(0, charIndex);
        cancelTick = scheduleAfter(PLACEHOLDER_DELETE_DELAY_MS, tick);
        return;
      }

      deleting = false;
      variantIndex = (variantIndex + 1) % variants.length;
      cancelTick = scheduleAfter(PLACEHOLDER_NEXT_DELAY_MS, tick);
    };

    tick();

    return () => {
      cancelTick?.();

      for (const cancelTimer of touchStopTimers.values()) {
        cancelTimer();
      }

      touchStopTimers = new Map();
      touchStopTriggered = new Set();
    };
  });

  function handleTaskInputKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (event.shiftKey) {
      const titleValue = draft.title.trim();
      if (titleValue) {
        void onQueueTask(titleValue);
        draft.title = '';
        return;
      }

      const placeholderValue = currentPlaceholderPhrase.trim();
      if (placeholderValue) {
        void onQueueTask(placeholderValue);
      }
      return;
    }

    onSubmit();
  }

  function handleRecentOrdersScroll(event: Event) {
    if (!hasMoreOrders || isLoadingMore) return;

    const target = event.currentTarget as HTMLDivElement | null;
    if (!target) return;

    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 36;
    if (!nearBottom) return;

    isLoadingMore = true;
    onLoadMoreOrders();
    requestAnimationFrame(() => {
      isLoadingMore = false;
    });
  }

  function startStopPress(order: OrderView, event: PointerEvent) {
    if (event.pointerType === 'mouse') {
      return;
    }

    clearStopPress(order.id);
    event.preventDefault();
    event.stopPropagation();

    const cancelTimer = scheduleAfter(550, () => {
      touchStopTriggered = new Set([...touchStopTriggered, order.id]);
      onStopOrder(order, event);
      clearStopPress(order.id);
    });

    touchStopTimers = new Map(touchStopTimers).set(order.id, cancelTimer);
  }

  function clearStopPress(orderId: string) {
    const cancelTimer = touchStopTimers.get(orderId);
    if (cancelTimer) {
      cancelTimer();
      const nextTimers = new Map(touchStopTimers);
      nextTimers.delete(orderId);
      touchStopTimers = nextTimers;
    }
  }

  function handleStopClick(order: OrderView, event: MouseEvent) {
    const wasTouchTriggered = touchStopTriggered.has(order.id);
    if (wasTouchTriggered) {
      const nextTriggered = new Set(touchStopTriggered);
      nextTriggered.delete(order.id);
      touchStopTriggered = nextTriggered;
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    onStopOrder(order, event);
  }

  function handleOpenOrderKeydown(order: OrderView, event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    onOpenOrder(order);
  }

  function formatStatusLabel(status: string) {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'done' || normalized === 'completed') return 'Completed';
    if (normalized === 'stopped' || normalized === 'cancelled' || normalized === 'canceled') return 'Stopped';
    if (normalized === 'executing' || normalized === 'accepted') return 'Executing';
    if (normalized === 'queued') return 'Queued';
    if (!normalized) return 'Queued';
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }

  function formatOrderPrice(order: OrderView) {
    if (order.estimatedCost === undefined) {
      return `${priceLabel} -`;
    }

    const amount = Number.isInteger(order.estimatedCost)
      ? String(order.estimatedCost)
      : order.estimatedCost.toFixed(2).replace(/\.?0+$/, '');

    return `${priceLabel} ${amount} ${order.currency}`;
  }

  function formatOrderTime(order: OrderView) {
    return order.executionEstimate ? `${timeLeftLabel} ${order.executionEstimate}` : `${timeLeftLabel} -`;
  }

</script>

<article class="kefine-card kefine-card--wide kefine-card--create">
  <h2 class="kefine-create-title">{title}</h2>

  <form
    class="kefine-form"
    onsubmit={(event) => {
      event.preventDefault();
      onSubmit();
    }}
  >
    <fieldset class="kefine-exec-row" data-testid="kefine-create-form">
      <p class="kefine-task-block">
        <textarea
          id="order-title"
          bind:value={draft.title}
          class="kefine-task-input"
          data-testid="kefine-task-input"
          style={`font-size: ${titleFontSize}rem;`}
          placeholder={animatedPlaceholder}
          onkeydown={handleTaskInputKeydown}
        ></textarea>
      </p>
      <button
        type="submit"
        data-variant="primary"
        class="kefine-exec-btn"
        data-testid="kefine-submit-task"
        aria-label={executeAria}
      >
        <span class="kefine-exec-arrow" aria-hidden="true">➵</span>
      </button>
    </fieldset>
  </form>

  <section class="kefine-recent" aria-label={isSearching ? matchedTasksLabel : solverLabel}>
    {#if isSearching && matchedOrders.length > 0}
      <kefine-recent-title class="kefine-recent-title">{matchedTasksLabel}</kefine-recent-title>
      <ul class="kefine-recent-list kefine-recent-list--compact" data-testid="kefine-search-results">
        {#each matchedOrders as order (order.id)}
          <li>
            <kefine-order-card
              class="kefine-recent-item kefine-queued-task kefine-order-item"
              data-testid={`kefine-search-order-${order.id}`}
              data-order-id={order.id}
              data-status={order.status}
              role="button"
              tabindex="0"
              onclick={() => onOpenOrder(order)}
              onkeydown={(event: KeyboardEvent) => handleOpenOrderKeydown(order, event)}
            >
                <section class="kefine-order-open" data-testid={`kefine-open-search-order-${order.id}`}>
                  <kefine-order-summary class="kefine-order-summary">
                    <kr-title>{order.title}</kr-title>
                    <kefine-order-meta class="kefine-order-meta">
                      <kefine-order-solver>{order.solver}</kefine-order-solver>
                      <kefine-order-estimate class="kefine-order-estimate" data-testid={`kefine-order-eta-${order.id}`}>
                        <span>{statusLabel} {formatStatusLabel(order.status)}</span>
                        <span>{formatOrderTime(order)}</span>
                        <span>{formatOrderPrice(order)}</span>
                      </kefine-order-estimate>
                    </kefine-order-meta>
                </kefine-order-summary>
              </section>
            </kefine-order-card>
          </li>
        {/each}
      </ul>
    {:else if totalOrders > 0}
      <section class="kefine-recent-scroll" data-testid="kefine-recent-scroll" onscroll={handleRecentOrdersScroll}>
        <ul class="kefine-recent-list" data-testid="kefine-recent-list">
          {#each recentOrders as order (order.id)}
            <li>
              <kefine-order-card
                class="kefine-recent-item kefine-queued-task kefine-order-item"
                data-testid={`kefine-order-item-${order.id}`}
                data-order-id={order.id}
                data-status={order.status}
                role="button"
                tabindex="0"
                onclick={() => onOpenOrder(order)}
                onkeydown={(event: KeyboardEvent) => handleOpenOrderKeydown(order, event)}
              >
                <button
                  type="button"
                  class="kefine-status-toggle kefine-status-toggle--order"
                  data-testid={`kefine-stop-order-${order.id}`}
                  aria-label={`${stopTaskLabel}: ${order.title}`}
                  data-status={order.status}
                  onpointerdown={(event) => startStopPress(order, event)}
                  onpointerup={() => clearStopPress(order.id)}
                  onpointerleave={() => clearStopPress(order.id)}
                  onpointercancel={() => clearStopPress(order.id)}
                  onclick={(event) => handleStopClick(order, event)}
                >
                  <status-mark aria-hidden="true" data-status={order.status}><task-dot></task-dot></status-mark>
                </button>
                <section class="kefine-order-open" data-testid={`kefine-open-order-${order.id}`}>
                  <kefine-order-summary class="kefine-order-summary">
                    <kr-title>{order.title}</kr-title>
                    <kefine-order-meta class="kefine-order-meta">
                      <kefine-order-solver>{order.solver}</kefine-order-solver>
                      <kefine-order-estimate class="kefine-order-estimate" data-testid={`kefine-order-eta-${order.id}`}>
                        <span>{statusLabel} {formatStatusLabel(order.status)}</span>
                        <span>{formatOrderTime(order)}</span>
                        <span>{formatOrderPrice(order)}</span>
                      </kefine-order-estimate>
                    </kefine-order-meta>
                  </kefine-order-summary>
                </section>
              </kefine-order-card>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </section>
</article>
