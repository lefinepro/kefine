import type { RequestHandler } from './$types';
import { proxyOrderStatus } from '$lib/server/order-proxy';

export const GET: RequestHandler = async ({ url, fetch }) => {
  const orderId = url.searchParams.get('id') ?? url.searchParams.get('orderId');
  const query = orderId ? `?id=${encodeURIComponent(orderId)}` : '';
  return proxyOrderStatus(new Request(url, { method: 'GET' }), `/status${query}`, fetch, orderId ?? undefined);
};
