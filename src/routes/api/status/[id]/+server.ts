import { proxyOrderStatus } from '$lib/server/order-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request, fetch, params }) => {
  return proxyOrderStatus(request, `/status/${encodeURIComponent(params.id)}`, fetch, params.id);
};
