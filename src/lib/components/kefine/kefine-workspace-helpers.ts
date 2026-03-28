import type { DraftOrder, OrderView } from '$lib/components/kefine/kefine-workflow';
import type { KefineLocaleText } from '$lib/constants/kefine-locale';

export type TaskRouteView = 'result' | 'stages' | null;

export function createContactMailtoUrl(args: {
  brandName: string;
  recipient: string;
  name: string;
  email: string;
  message: string;
}): string {
  const subjectSource = args.name.trim() || args.brandName;
  const bodyLines = [
    args.name.trim() ? `Name: ${args.name.trim()}` : '',
    args.email.trim() ? `Email: ${args.email.trim()}` : '',
    '',
    args.message.trim()
  ].filter(Boolean);

  const mailto = new URL(`mailto:${args.recipient}`);
  mailto.searchParams.set('subject', `${args.brandName}: ${subjectSource}`);
  mailto.searchParams.set('body', bodyLines.join('\n'));
  return mailto.toString();
}

export function mergeOrdersById(
  orders: OrderView[],
  order: OrderView
): OrderView[] {
  const index = orders.findIndex((item) => item.id === order.id);
  if (index === -1) {
    return [order, ...orders];
  }

  const current = orders[index];
  if (!current) {
    return orders;
  }

  return [
    ...orders.slice(0, index),
    { ...current, ...order, id: current.id },
    ...orders.slice(index + 1)
  ];
}

export function mergeDemoOrders(
  orders: OrderView[],
  demoOrders: OrderView[]
): OrderView[] {
  return demoOrders.reduce((nextOrders, demoOrder) => mergeOrdersById(nextOrders, demoOrder), orders);
}

export function getVisibleOrdersLimit(
  ordersLength: number,
  currentLimit: number,
  pageSize: number
): number {
  if (ordersLength === 0) {
    return pageSize;
  }

  return Math.min(Math.max(currentLimit, 1), ordersLength);
}

function parseTaskRouteValue(rawValue: string): { orderId: string; view: TaskRouteView } | null {
  const [encodedId, view] = rawValue.split('/');
  if (!encodedId) {
    return null;
  }

  const normalizedView = view === 'result' || view === 'stages' ? view : null;
  try {
    return { orderId: decodeURIComponent(encodedId), view: normalizedView };
  } catch {
    return { orderId: encodedId, view: normalizedView };
  }
}

export function readTaskRouteStateFromLocation(location: Location): { orderId: string; view: TaskRouteView } | null {
  const hash = location.hash.replace(/^#/, '').replace(/\/+$/, '');
  const hashTaskPrefix = '/task/';
  const hashLegacyPrefix = '/order/';

  if (hash.startsWith(hashTaskPrefix) || hash.startsWith(hashLegacyPrefix)) {
    const prefix = hash.startsWith(hashTaskPrefix) ? hashTaskPrefix : hashLegacyPrefix;
    return parseTaskRouteValue(hash.slice(prefix.length));
  }

  const rawPath = location.pathname.replace(/\/+$/, '');
  const taskPrefix = '/task/';
  const legacyPrefix = '/order/';
  if (!rawPath.startsWith(taskPrefix) && !rawPath.startsWith(legacyPrefix)) {
    return null;
  }

  const prefix = rawPath.startsWith(taskPrefix) ? taskPrefix : legacyPrefix;
  return parseTaskRouteValue(rawPath.slice(prefix.length));
}

export function createOfflineOrder(
  payload: DraftOrder,
  localeText: KefineLocaleText,
  resolveExecutionEstimate: (executionEstimate: string | undefined, title: string, localeText: KefineLocaleText) => string | undefined,
  toNumber: (value: unknown) => number | undefined
): OrderView {
  const randomId =
    typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: `local-${randomId}`,
    solver: localeText.defaults.solverNetwork,
    status: 'queued',
    title: payload.title || localeText.defaults.taskTitle,
    description: payload.description || '',
    createdAt: new Date().toISOString(),
    estimatedCost: toNumber(payload.estimatedCost) || undefined,
    currency: payload.currency || localeText.defaults.defaultCurrency,
    executionEstimate: resolveExecutionEstimate(payload.executionEstimate, payload.title, localeText),
    paymentUrl: undefined
  };
}

export function normalizeDraftOrder(
  form: DraftOrder,
  localeText: KefineLocaleText
): DraftOrder {
  const normalized: DraftOrder = {
    title: form.title.trim(),
    description: form.description.trim() || form.title.trim(),
    estimatedCost: form.estimatedCost.trim() || '0',
    currency: form.currency.trim() || localeText.defaults.defaultCurrency,
    executionEstimate: form.executionEstimate.trim()
  };

  if (!normalized.title) {
    normalized.title = localeText.defaults.taskTitle;
  }

  return normalized;
}
