import { buildOrderProxyUrl } from '$lib/order-proxy-path';
import type { DraftOrder, OrderView, TemplatePresentation } from '$lib/components/kefine/kefine-workflow';
import { buildCreatePayload, extractStatusPayload, parseStoredOrders, readCreateResponse } from '$lib/components/kefine/kefine-workflow';
import type { KefineLocaleText } from '$lib/constants/kefine-locale';

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

  args.storage.setItem(args.storageKey, JSON.stringify(orders));

  return {
    orders,
    visibleLimit: Math.min(args.pageSize, orders.length)
  };
}

export function persistWorkspaceOrders(storage: Storage, storageKey: string, orders: OrderView[]): void {
  storage.setItem(storageKey, JSON.stringify(orders));
}

export async function fetchOrderStatus(args: {
  orderId: string;
  fallbackOrder: OrderFallback;
  localeText: KefineLocaleText;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
}): Promise<OrderView | null> {
  try {
    const statusUrl = buildOrderProxyUrl(`/status/${encodeURIComponent(args.orderId)}`, args.orderApiBaseUrl);
    const response = await args.fetchFn(
      statusUrl,
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
  template?: TemplatePresentation | null;
  isBackground: boolean;
  localeText: KefineLocaleText;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
  toNumber: (value: unknown) => number | undefined;
  resolveExecutionEstimate: (executionEstimate: string | undefined, title: string, localeText: KefineLocaleText) => string | undefined;
}): Promise<
  | { kind: 'remote'; order: OrderView }
  | { kind: 'error'; message?: string; statusCode?: number }
> {
  try {
    const requestPayload = buildCreatePayload(args.payload, args.template);
    const hasFiles = args.payload.files.length > 0;
    
    const requestBody = hasFiles
      ? (() => {
          const formData = new FormData();
          // Append scalar fields first
          formData.append('name', requestPayload.name || '');
          formData.append('title', requestPayload.title || '');
          formData.append('content', requestPayload.content || '');
          formData.append('description', requestPayload.description || '');
          formData.append('estimatedCost', String(requestPayload.estimatedCost || 0));
          formData.append('currency', requestPayload.currency || '');
          if (requestPayload.executionEstimate) {
            formData.append('executionEstimate', requestPayload.executionEstimate);
          }
          if (requestPayload.uiScenario) {
            formData.append('uiScenario', requestPayload.uiScenario);
          }
          if (requestPayload.labels) {
            formData.append('labels', JSON.stringify(requestPayload.labels));
          }
          if (requestPayload.attachment) {
            formData.append('attachment', JSON.stringify(requestPayload.attachment));
          }

          // Append actual files
          for (const file of args.payload.files) {
            formData.append('files', file, file.name);
          }

          return formData;
        })()
      : JSON.stringify(requestPayload);

    const response = await args.fetchFn(buildOrderProxyUrl('/create', args.orderApiBaseUrl), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(hasFiles ? {} : { 'Content-Type': 'application/json' })
      },
      body: requestBody
    });

    const responseBody: unknown = await response.json();
    const parsed = response.ok ? readCreateResponse(responseBody) : null;
    
    if (!response.ok || !parsed) {
      const errorData = responseBody as Record<string, unknown> | null;
      const message = (errorData?.error as string) || args.localeText.errors.fallback;
      return {
        kind: 'error',
        message,
        statusCode: response.status
      };
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
        labels: args.payload.tags,
        paymentUrl: undefined,
        uiScenario: parsed.uiScenario
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : args.localeText.errors.fallback;
    return { kind: 'error', message };
  }
}
