import type { DraftOrder, OrderView } from '$lib/components/kefine/kefine-workflow';
import type { KefineLocaleText } from '$lib/constants/kefine-locale';
import { buildProfileTaskPath } from '$lib/profile/profile-handles';
import { stripLocalePrefix } from '$lib/routing/kefine-locale-routing';

export type TaskRouteView = 'result' | 'stages' | null;

const GLOBAL_ORDER_PATH_PREFIX = '/orders/';
const LEGACY_TASK_PATH_PREFIX = '/task/';
const LEGACY_ORDER_PATH_PREFIX = '/order/';
const CANONICAL_ACTOR_ORDER_PATH_PATTERN = /^\/@([^/]+)\/([^/#?]+)$/i;
const CANONICAL_ACTOR_ORDER_WITH_RESOURCE_PATH_PATTERN = /^\/@([^/]+)\/(?:orders|order)\/([^/#?]+)$/i;
const LEGACY_ACTOR_ORDER_PATH_PATTERN = /^\/@([^/]+)\/order\/([^/#?]+)$/i;

function extractOrderUuid(orderId: string): string | null {
  const normalized = orderId.trim();
  if (!normalized) {
    return null;
  }

  const uuidMatch = normalized.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return uuidMatch?.[0] ?? null;
}

export function normalizeActorHandle(value: string): string {
  return value.trim().replace(/^@+/, '');
}

export function shortenAuthLabel(value: string | null | undefined, maxLength = 18): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const prefix = normalized.startsWith('@') ? '@' : '';
  const body = prefix ? normalized.slice(1) : normalized;
  const budget = Math.max(maxLength - prefix.length - 1, 8);
  const headLength = Math.max(4, Math.ceil(budget * 0.6));
  const tailLength = Math.max(3, budget - headLength);

  if (body.length <= headLength + tailLength + 1) {
    return normalized;
  }

  return `${prefix}${body.slice(0, headLength)}…${body.slice(-tailLength)}`;
}

export function buildActorOrderPath(actorHandle: string, orderId: string): string {
  const normalizedHandle = normalizeActorHandle(actorHandle);
  const normalizedOrderId = orderId.trim();
  if (!normalizedHandle || !normalizedOrderId) {
    return '/';
  }

  const routeId = extractOrderUuid(normalizedOrderId) ?? normalizedOrderId;
  return buildProfileTaskPath(normalizedHandle, routeId);
}

export function buildTaskRouteHash(orderId: string, view: TaskRouteView = null): string {
  const normalized = orderId.trim();
  if (!normalized) {
    return '';
  }

  const routeId = extractOrderUuid(normalized) ?? normalized;
  const suffix = view ? `/${view}` : '';
  return `#${GLOBAL_ORDER_PATH_PREFIX}${encodeURIComponent(routeId)}${suffix}`;
}

export function resolveOrderIdFromRouteValue(routeValue: string, knownOrders: OrderView[]): string {
  const normalized = routeValue.trim();
  if (!normalized) {
    return normalized;
  }

  const uuid = extractOrderUuid(normalized);
  if (uuid) {
    const uuidMatch = knownOrders.find((item) => extractOrderUuid(item.id) === uuid);
    if (uuidMatch) {
      return uuidMatch.id;
    }

    return uuid;
  }

  const directMatch = knownOrders.find((item) => item.id === normalized);
  if (directMatch) {
    return directMatch.id;
  }

  const shareIdMatch = knownOrders.find((item) => item.shareId?.trim() === normalized);
  if (shareIdMatch) {
    return shareIdMatch.id;
  }

  const suffixMatch = knownOrders.find((item) => item.id.endsWith(`/${normalized}`));
  if (suffixMatch) {
    return suffixMatch.id;
  }

  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return normalized;
  }

  return normalized;
}

export function resolveOrderIdCandidates(routeValue: string, knownOrders: OrderView[]): string[] {
  const normalized = routeValue.trim();
  if (!normalized) {
    return [];
  }

  const resolved = resolveOrderIdFromRouteValue(normalized, knownOrders);
  const candidates = [resolved];

  const suffixMatch = knownOrders.find((item) => item.id.endsWith(`/${normalized}`));
  if (suffixMatch && !candidates.includes(suffixMatch.id)) {
    candidates.unshift(suffixMatch.id);
  }

  const shareIdMatch = knownOrders.find((item) => item.shareId?.trim() === normalized);
  if (shareIdMatch && !candidates.includes(shareIdMatch.id)) {
    candidates.unshift(shareIdMatch.id);
  }

  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }

  return candidates;
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
    {
      ...current,
      ...order,
      ...(order.shareId?.trim() ? { shareId: order.shareId.trim() } : current.shareId ? { shareId: current.shareId } : {}),
      ...(order.taskIcon?.trim() ? { taskIcon: order.taskIcon.trim() } : current.taskIcon ? { taskIcon: current.taskIcon } : {}),
      id: current.id
    },
    ...orders.slice(index + 1)
  ];
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
  const actorPath = stripLocalePrefix(location.pathname).replace(/\/+$/, '');
  const actorMatch =
    actorPath.match(CANONICAL_ACTOR_ORDER_WITH_RESOURCE_PATH_PATTERN) ??
    actorPath.match(LEGACY_ACTOR_ORDER_PATH_PATTERN) ??
    actorPath.match(CANONICAL_ACTOR_ORDER_PATH_PATTERN);
  const actorView = location.hash === '#result' ? 'result' : location.hash === '#stages' ? 'stages' : null;
  if (actorMatch?.[2]) {
    return {
      orderId: decodeURIComponent(actorMatch[2]),
      view: actorView
    };
  }

  const hash = location.hash.replace(/^#/, '').replace(/\/+$/, '');
  const hashTaskPrefix = GLOBAL_ORDER_PATH_PREFIX;
  const hashLegacyPrefixes = [LEGACY_TASK_PATH_PREFIX, LEGACY_ORDER_PATH_PREFIX];

  if (hash.startsWith(hashTaskPrefix) || hashLegacyPrefixes.some((prefix) => hash.startsWith(prefix))) {
    const prefix = hash.startsWith(hashTaskPrefix)
      ? hashTaskPrefix
      : (hashLegacyPrefixes.find((candidate) => hash.startsWith(candidate)) ?? LEGACY_TASK_PATH_PREFIX);
    return parseTaskRouteValue(hash.slice(prefix.length));
  }

  const rawPath = stripLocalePrefix(location.pathname).replace(/\/+$/, '');
  const taskPrefixes = [GLOBAL_ORDER_PATH_PREFIX, LEGACY_TASK_PATH_PREFIX, LEGACY_ORDER_PATH_PREFIX];
  if (!taskPrefixes.some((prefix) => rawPath.startsWith(prefix))) {
    return null;
  }

  const prefix = taskPrefixes.find((candidate) => rawPath.startsWith(candidate)) ?? GLOBAL_ORDER_PATH_PREFIX;
  return parseTaskRouteValue(rawPath.slice(prefix.length));
}

export function normalizeDraftOrder(
  form: DraftOrder,
  localeText: KefineLocaleText
): DraftOrder {
  const sourceText = form.description.trim() || form.title.trim();
  const normalizedLines = sourceText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const normalizedTitle = normalizedLines[0] || form.title.trim();
  const isVpnOrder = /(?:^|\s)(vpn)(?:$|\s)|телеграм|telegram/i.test(sourceText);
  const estimatedCost = form.estimatedCost.trim() || (isVpnOrder ? '2' : '0');
  const currency = form.currency.trim() || (isVpnOrder ? 'USD' : localeText.defaults.defaultCurrency);
  const normalized: DraftOrder = {
    title: normalizedTitle,
    description: sourceText,
    tags: Array.from(
      new Set(
        form.tags
          .map((tag) => tag.trim().replace(/^#+/, '').toLowerCase())
          .filter(Boolean)
      )
    ),
    estimatedCost,
    currency,
    executionEstimate: form.executionEstimate.trim(),
    files: [...form.files],
    templateFiles: [...(form.templateFiles ?? [])]
  };

  if (!normalized.title) {
    normalized.title = localeText.defaults.taskTitle;
  }

  return normalized;
}

export function resolveWalletNetworkLabel(chainId: number | null, localeText: KefineLocaleText): string {
  if (chainId === 43114) {
    return localeText.auth.walletNetworkAvalanche;
  }

  if (chainId === 43113) {
    return localeText.auth.walletNetworkAvalancheFuji;
  }

  if (chainId === 100) {
    return localeText.auth.walletNetworkGnosis;
  }

  return localeText.auth.walletNetworkEthereum;
}

export function createGeneratedWalletAvatar(address: string | null | undefined): string | null {
  const normalizedAddress = address?.trim().toLowerCase();
  if (!normalizedAddress) {
    return null;
  }

  let hash = 0;
  for (let index = 0; index < normalizedAddress.length; index += 1) {
    hash = (hash * 31 + normalizedAddress.charCodeAt(index)) >>> 0;
  }

  const hueA = hash % 360;
  const hueB = (hash >>> 9) % 360;
  const hueC = (hash >>> 17) % 360;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hueA} 72% 62%)" />
          <stop offset="100%" stop-color="hsl(${hueB} 68% 42%)" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="20" fill="url(#g)" />
      <circle cx="20" cy="20" r="9" fill="hsl(${hueC} 78% 82% / 0.88)" />
      <circle cx="46" cy="22" r="6" fill="hsl(${hueA} 78% 88% / 0.82)" />
      <path d="M16 46c6-10 26-10 32 0" fill="none" stroke="hsl(${hueC} 88% 94%)" stroke-width="6" stroke-linecap="round" />
    </svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
