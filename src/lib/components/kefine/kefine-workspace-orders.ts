import { buildOrderProxyUrl } from '$lib/order-proxy-path';
import type { DraftOrder, OrderView } from '$lib/components/kefine/kefine-workflow';
import { buildCreatePayload, extractStatusPayload, parseStoredOrders, readCreateResponse } from '$lib/components/kefine/kefine-workflow';
import type { KefineLocaleText } from '$lib/constants/kefine-locale';
import { createOfflineOrder, mergeDemoOrders } from '$lib/components/kefine/kefine-workspace-helpers';

type OrderFallback = {
  title: string;
  description: string;
  currency: string;
  createdAt: string;
};

export function loadWorkspaceOrders(args: {
  storage: Storage;
  storageKey: string;
  localeText: KefineLocaleText;
  demoOrders: OrderView[];
  pageSize: number;
}): { orders: OrderView[]; visibleLimit: number } {
  let orders: OrderView[];

  try {
    const raw = args.storage.getItem(args.storageKey);
    orders = parseStoredOrders(raw, args.localeText);
    if (raw !== null) {
      args.storage.setItem(args.storageKey, JSON.stringify(orders));
    }
  } catch {
    orders = [];
  }

  const mergedOrders = mergeDemoOrders(orders, args.demoOrders);
  args.storage.setItem(args.storageKey, JSON.stringify(mergedOrders));

  return {
    orders: mergedOrders,
    visibleLimit: Math.min(args.pageSize, mergedOrders.length)
  };
}

export function persistWorkspaceOrders(storage: Storage, storageKey: string, orders: OrderView[]): void {
  storage.setItem(storageKey, JSON.stringify(orders));
}

export async function fetchOrderStatus(args: {
  orderId: string;
  fallbackOrder: OrderFallback;
  mockOrderStatus: Record<string, unknown>;
  localeText: KefineLocaleText;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
}): Promise<OrderView | null> {
  if (args.orderId.startsWith('local-')) {
    return null;
  }

  const mockPayload = args.mockOrderStatus[args.orderId];
  if (mockPayload) {
    return extractStatusPayload(mockPayload, args.fallbackOrder, args.localeText);
  }

  try {
    const response = await args.fetchFn(
      buildOrderProxyUrl(`/status/${encodeURIComponent(args.orderId)}`, args.orderApiBaseUrl),
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return extractStatusPayload(payload, args.fallbackOrder, args.localeText);
  } catch {
    return null;
  }
}

export async function pollWorkspaceOrder(args: {
  order: OrderView;
  token: symbol;
  signal: AbortSignal;
  pollLimit: number;
  pollIntervalMs: number;
  localeText: KefineLocaleText;
  fetchOrderStatus: (orderId: string, fallbackOrder: OrderFallback) => Promise<OrderView | null>;
  isTokenCurrent: (orderId: string, token: symbol) => boolean;
  deleteToken: (orderId: string) => void;
  upsertOrder: (order: OrderView) => void;
  getCurrentOrder: () => OrderView | null;
  setCurrentOrder: (order: OrderView) => void;
  waitForDelay: (delayMs: number, signal: AbortSignal) => Promise<void>;
}): Promise<void> {
  let tries = 0;
  let latestOrder = args.order;

  while (tries < args.pollLimit) {
    if (args.signal.aborted) {
      args.deleteToken(args.order.id);
      return;
    }

    if (!args.isTokenCurrent(args.order.id, args.token)) {
      return;
    }

    const updated = await args.fetchOrderStatus(args.order.id, {
      title: latestOrder.title,
      description: latestOrder.description,
      currency: latestOrder.currency || args.localeText.defaults.defaultCurrency,
      createdAt: latestOrder.createdAt
    });

    if (!args.isTokenCurrent(args.order.id, args.token)) {
      return;
    }

    if (updated) {
      latestOrder = { ...latestOrder, ...updated, id: latestOrder.id };
      args.upsertOrder(latestOrder);

      const currentOrder = args.getCurrentOrder();
      if (currentOrder?.id === latestOrder.id) {
        args.setCurrentOrder({ ...currentOrder, ...updated, id: currentOrder.id });
      }

      if (updated.status === 'completed') {
        args.deleteToken(args.order.id);
        return;
      }
    }

    tries += 1;

    try {
      await args.waitForDelay(args.pollIntervalMs, args.signal);
    } catch {
      args.deleteToken(args.order.id);
      return;
    }
  }

  if (args.isTokenCurrent(args.order.id, args.token)) {
    args.deleteToken(args.order.id);
  }
}

export async function submitWorkspaceOrder(args: {
  payload: DraftOrder;
  isBackground: boolean;
  localeText: KefineLocaleText;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
  toNumber: (value: unknown) => number | undefined;
  resolveExecutionEstimate: (executionEstimate: string | undefined, title: string, localeText: KefineLocaleText) => string | undefined;
}): Promise<
  | { kind: 'remote'; order: OrderView }
  | { kind: 'offline'; order: OrderView }
  | { kind: 'error' }
> {
  try {
    const response = await args.fetchFn(buildOrderProxyUrl('/create', args.orderApiBaseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify(buildCreatePayload(args.payload))
    });

    const body: unknown = await response.json();
    const parsed = response.ok ? readCreateResponse(body) : null;
    if (!response.ok || !parsed) {
      throw new Error(args.localeText.errors.fallback);
    }

    return {
      kind: 'remote',
      order: {
        id: parsed.orderId,
        solver: parsed.solver || args.localeText.defaults.openSolverMarket,
        status: parsed.status || 'queued',
        title: args.payload.title || args.localeText.defaults.taskTitle,
        description: args.payload.description || '',
        createdAt: new Date().toISOString(),
        estimatedCost: args.toNumber(args.payload.estimatedCost) || undefined,
        currency: args.payload.currency || args.localeText.defaults.defaultCurrency,
        executionEstimate: args.resolveExecutionEstimate(
          args.payload.executionEstimate,
          args.payload.title,
          args.localeText
        ),
        paymentUrl: undefined,
        uiScenario: parsed.uiScenario
      }
    };
  } catch (error) {
    const isNetworkError =
      error instanceof TypeError ||
      (error instanceof Error && /network|fetch|failed to fetch|load failed/i.test(error.message));

    if (isNetworkError) {
      return {
        kind: 'offline',
        order: createOfflineOrder(args.payload, args.localeText, args.resolveExecutionEstimate, args.toNumber)
      };
    }

    return { kind: 'error' };
  }
}
