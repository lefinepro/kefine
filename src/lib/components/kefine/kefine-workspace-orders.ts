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

const FREE_ORDER_COST = 0;
const FREE_ORDER_CURRENCY = 'USD';

function mergeActorIdentity(previous: OrderView, next: OrderView): OrderView {
  const actorHandle = next.actorHandle?.trim() || previous.actorHandle?.trim() || undefined;
  const actorDid =
    next.actorDid?.trim() ||
    previous.actorDid?.trim() ||
    (actorHandle ? `did:key:${actorHandle.replace(/^@+/, '')}` : undefined);

  return {
    ...previous,
    ...next,
    ...(next.taskIcon?.trim() ? { taskIcon: next.taskIcon.trim() } : previous.taskIcon ? { taskIcon: previous.taskIcon } : {}),
    ...(actorHandle ? { actorHandle: actorHandle.replace(/^@+/, '') } : {}),
    ...(actorDid ? { actorDid } : {})
  };
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const record = payload as Record<string, unknown>;
  const directError = record.error;

  if (typeof directError === 'string' && directError.trim()) {
    return directError;
  }

  if (directError && typeof directError === 'object') {
    const nested = directError as Record<string, unknown>;
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message;
    }

    if (typeof nested.error === 'string' && nested.error.trim()) {
      return nested.error;
    }
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message;
  }

  return fallback;
}
function normalizeOrderStatusId(orderId: string): string {
  const normalized = orderId.trim();
  if (!normalized) {
    return normalized;
  }

  const uuidMatch = normalized.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch?.[0] ?? normalized;
}

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
    const statusUrl = buildOrderProxyUrl(
      `/status/${encodeURIComponent(normalizeOrderStatusId(args.orderId))}`,
      args.orderApiBaseUrl
    );
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
    const parsed = extractStatusPayload(payload, args.fallbackOrder, args.localeText);
    if (!parsed) {
      return null;
    }

    return {
      ...parsed,
      estimatedCost: FREE_ORDER_COST,
      currency: FREE_ORDER_CURRENCY
    };
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
      latestOrder = {
        ...mergeActorIdentity(latestOrder, updated),
        id: latestOrder.id
      };
      args.upsertOrder(latestOrder);

      const currentOrder = args.getCurrentOrder();
      if (currentOrder?.id === latestOrder.id) {
        args.setCurrentOrder({
          ...mergeActorIdentity(currentOrder, updated),
          id: currentOrder.id
        });
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
  owner?: {
    ownerProfileId?: string;
    ownerUsername?: string;
    ownerDisplayName?: string;
    actorHandle?: string;
    actorDid?: string;
  } | null;
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
    const requestPayload = buildCreatePayload(args.payload, args.template, args.owner);
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
          if (requestPayload.taskIcon) {
            formData.append('taskIcon', requestPayload.taskIcon);
          }
          if (requestPayload.uiScenario) {
            formData.append('uiScenario', requestPayload.uiScenario);
          }
          if (requestPayload.labels) {
            formData.append('labels', JSON.stringify(requestPayload.labels));
          }
          if (requestPayload.ownerProfileId) {
            formData.append('ownerProfileId', requestPayload.ownerProfileId);
          }
          if (requestPayload.ownerUsername) {
            formData.append('ownerUsername', requestPayload.ownerUsername);
          }
          if (requestPayload.ownerDisplayName) {
            formData.append('ownerDisplayName', requestPayload.ownerDisplayName);
          }
          if (requestPayload.actorHandle) {
            formData.append('actorHandle', requestPayload.actorHandle);
          }
          if (requestPayload.actorDid) {
            formData.append('actorDid', requestPayload.actorDid);
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
      const message = extractErrorMessage(responseBody, args.localeText.errors.fallback);
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
        taskIcon: parsed.taskIcon || args.payload.taskIcon,
        solver: parsed.solver || '',
        solverName: parsed.solverName,
        solverHandle: parsed.solverHandle,
        solverProfileUrl: parsed.solverProfileUrl,
        ownerProfileId: parsed.ownerProfileId || args.owner?.ownerProfileId,
        ownerUsername: parsed.ownerUsername || args.owner?.ownerUsername,
        ownerDisplayName: parsed.ownerDisplayName || args.owner?.ownerDisplayName,
        actorHandle: parsed.actorHandle,
        actorDid: parsed.actorDid,
        status: parsed.status || 'queued',
        title: args.payload.title || args.localeText.defaults.taskTitle,
        description: args.payload.description || '',
        createdAt: new Date().toISOString(),
        assignedAt: undefined,
        startedAt: undefined,
        estimatedCost: FREE_ORDER_COST,
        currency: FREE_ORDER_CURRENCY,
        executionEstimate: args.resolveExecutionEstimate(
          args.payload.executionEstimate,
          args.payload.title,
          args.localeText
        ),
        labels: args.payload.tags,
        paymentUrl: undefined,
        uiScenario: parsed.uiScenario,
        exchangeStage: parsed.exchangeStage,
        executionSteps: parsed.executionSteps,
        activeExecutionStepId: parsed.activeExecutionStepId,
        progressPercent: parsed.progressPercent,
        executors: parsed.executors,
        notebook: parsed.notebook,
        interimResult: parsed.interimResult,
        result: parsed.result,
        iterations: parsed.iterations
      }
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : args.localeText.errors.fallback;
    return { kind: 'error', message };
  }
}

export async function saveWorkspaceOrderDocument(args: {
  orderId: string;
  content: string;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
  localeText: KefineLocaleText;
}): Promise<OrderView | null> {
  try {
    const response = await args.fetchFn(
      buildOrderProxyUrl(`/status/${encodeURIComponent(normalizeOrderStatusId(args.orderId))}/document`, args.orderApiBaseUrl),
      {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document: {
            format: 'markdown',
            content: args.content
          }
        })
      }
    );

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    return extractStatusPayload(payload, {
      title: '',
      description: args.content,
      currency: args.localeText.defaults.defaultCurrency,
      createdAt: new Date().toISOString()
    }, args.localeText);
  } catch {
    return null;
  }
}

export async function confirmWorkspaceOrderStep(args: {
  orderId: string;
  stepId?: string;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
}): Promise<boolean> {
  try {
    const response = await args.fetchFn(
      buildOrderProxyUrl(`/status/${encodeURIComponent(normalizeOrderStatusId(args.orderId))}/confirm`, args.orderApiBaseUrl),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(args.stepId ? { stepId: args.stepId } : {})
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}

export async function submitWorkspaceOrderStepComment(args: {
  orderId: string;
  stepId: string;
  content: string;
  fetchFn: typeof fetch;
  orderApiBaseUrl: string;
}): Promise<boolean> {
  try {
    const response = await args.fetchFn(
      buildOrderProxyUrl(
        `/status/${encodeURIComponent(normalizeOrderStatusId(args.orderId))}/steps/${encodeURIComponent(args.stepId)}/comments`,
        args.orderApiBaseUrl
      ),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: args.content })
      }
    );

    return response.ok;
  } catch {
    return false;
  }
}
