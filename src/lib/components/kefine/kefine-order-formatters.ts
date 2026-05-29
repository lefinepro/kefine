import type { OrderView } from './kefine-workflow';

export function formatKefineOrderStatus(status: string) {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'done' || normalized === 'completed') return 'Completed';
  if (normalized === 'rejected') return 'Rejected';
  if (normalized === 'stopped' || normalized === 'cancelled' || normalized === 'canceled') return 'Stopped';
  if (normalized === 'executing' || normalized === 'accepted') return 'Executing';
  if (normalized === 'queued') return 'Queued';
  if (!normalized) return 'Queued';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function localizeKefineOrderStatus(
  status: string,
  labels: Partial<Record<string, string>>
) {
  const normalized = status.trim().toLowerCase();
  const key = normalized || 'queued';
  const localized = labels[key];
  if (localized) {
    return localized;
  }
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function formatKefineOrderPrice(order: OrderView, priceLabel: string) {
  if (order.estimatedCost === undefined) {
    return `${priceLabel} -`;
  }

  const amount = Number.isInteger(order.estimatedCost)
    ? String(order.estimatedCost)
    : order.estimatedCost.toFixed(2).replace(/\.?0+$/, '');

  return `${priceLabel} ${amount} ${order.currency}`;
}

export function formatKefineOrderTime(order: OrderView, timeLeftLabel: string) {
  return order.executionEstimate ? `${timeLeftLabel} ${order.executionEstimate}` : `${timeLeftLabel} -`;
}
