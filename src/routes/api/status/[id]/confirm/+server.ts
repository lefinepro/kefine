import { proxyOrderStepConfirmation } from '$lib/server/order/order-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, params }) => {
  return proxyOrderStepConfirmation(request, params.id, fetch);
};
