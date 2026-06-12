import { json } from '@sveltejs/kit';
import { proxyOrderStatus } from '$lib/server/order/order-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, url }) => {
  const orderId = url.searchParams.get('id') ?? url.searchParams.get('orderId');
  if (!orderId) {
    return json({ error: 'Missing order id' }, { status: 400 });
  }

  return proxyOrderStatus(request, `/status/${encodeURIComponent(orderId)}`, fetch, orderId);
};
