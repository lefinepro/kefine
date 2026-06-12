import { proxyOrderSettingsUpdate } from '$lib/server/order/order-proxy';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, fetch, params }) => {
  return proxyOrderSettingsUpdate(request, params.id, fetch);
};
