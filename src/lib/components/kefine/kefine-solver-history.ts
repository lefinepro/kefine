import type { OrderView } from '$lib/components/kefine/kefine-workflow';

export type SolverHistoryTask = {
  id: string;
  title: string;
  description?: string;
  href?: string;
  isActive?: boolean;
};

const DEFAULT_SOLVER_HISTORY_LIMIT = 10;

function normalizeHandle(value: string | null | undefined): string {
  return value?.trim().replace(/^@+/, '') ?? '';
}

function normalizeRepositoryPart(value: string): string {
  return value.trim().replace(/^@+/, '').replace(/^\/+/, '').replace(/\.git$/i, '');
}

function formatRepositoryName(repositoryPart: string, ownerHandle?: string): string {
  const normalizedRepository = normalizeRepositoryPart(repositoryPart);
  if (!normalizedRepository) {
    return '';
  }

  if (normalizedRepository.includes('/')) {
    return normalizedRepository;
  }

  const normalizedOwner = normalizeHandle(ownerHandle);
  return normalizedOwner ? `${normalizedOwner}/${normalizedRepository}` : normalizedRepository;
}

export function resolveOrderRepositoryName(
  order: OrderView | null | undefined,
  fallbackRepositoryName = ''
): string {
  const ownerHandle =
    order?.repository?.ownerHandle ||
    order?.ownerUsername ||
    order?.actorHandle ||
    '';
  const repositoryName = order?.repository?.name || order?.repository?.slug || '';
  const formattedRepositoryName = repositoryName
    ? formatRepositoryName(repositoryName, ownerHandle)
    : '';

  if (formattedRepositoryName) {
    return formattedRepositoryName;
  }

  const formattedFallbackName = fallbackRepositoryName
    ? formatRepositoryName(fallbackRepositoryName, '')
    : '';
  if (formattedFallbackName) {
    return formattedFallbackName;
  }

  return order?.title?.trim() || order?.description?.trim() || order?.id || 'Task';
}

function orderKeys(order: OrderView): string[] {
  return [order.id, order.shareId]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function orderTimestamp(order: OrderView): number {
  const parsed = Date.parse(order.createdAt);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildSolverHistoryTasks(args: {
  currentOrder: OrderView | null;
  orders: OrderView[];
  fallbackRepositoryName?: string;
  limit?: number;
}): SolverHistoryTask[] {
  const limit = Math.max(1, args.limit ?? DEFAULT_SOLVER_HISTORY_LIMIT);
  const tasks: SolverHistoryTask[] = [];
  const seenOrderKeys = new Set<string>();

  function appendOrder(order: OrderView | null | undefined, isActive: boolean): void {
    if (!order?.id || tasks.length >= limit) {
      return;
    }

    const keys = orderKeys(order);
    if (keys.some((key) => seenOrderKeys.has(key))) {
      return;
    }

    keys.forEach((key) => seenOrderKeys.add(key));
    const title = resolveOrderRepositoryName(
      order,
      isActive ? (args.fallbackRepositoryName ?? '') : ''
    );
    const description = order.title?.trim() || order.description?.trim() || '';

    tasks.push({
      id: order.id,
      title,
      ...(description && description !== title ? { description } : {}),
      ...(isActive ? { isActive: true } : {})
    });
  }

  appendOrder(args.currentOrder, true);

  const historicalOrders = args.orders
    .map((order, index) => ({ order, index }))
    .filter(({ order }) => order.id !== args.currentOrder?.id)
    .sort((left, right) => {
      const timestampDelta = orderTimestamp(right.order) - orderTimestamp(left.order);
      return timestampDelta || left.index - right.index;
    });

  for (const { order } of historicalOrders) {
    appendOrder(order, false);
  }

  return tasks;
}
