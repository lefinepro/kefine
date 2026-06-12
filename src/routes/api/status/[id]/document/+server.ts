import { proxyOrderDocumentUpdate } from '$lib/server/order/order-proxy';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, fetch, params }) => {
  return proxyOrderDocumentUpdate(request, params.id, fetch);
};
