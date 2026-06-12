import { proxyOrderStepComment } from '$lib/server/order/order-proxy';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch, params }) => {
  return proxyOrderStepComment(request, params.id, params.stepId, fetch);
};
