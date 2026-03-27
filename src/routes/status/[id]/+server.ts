import type { RequestHandler } from './$types';
import { proxyOrderStatus } from '$lib/server/order-proxy';

export const GET: RequestHandler = async ({ params, fetch }) =>
  proxyOrderStatus(`/status/${encodeURIComponent(params.id)}`, fetch, params.id);
