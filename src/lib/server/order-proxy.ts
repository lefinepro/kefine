import { proxyCraterRequest } from '$lib/server/crater-proxy';

export async function proxyCreateOrder(request: Request, fetchFn: typeof fetch): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, '/create', {
    errorMessage: 'Failed to reach crater.'
  });
}

export async function proxyOrderStatus(
  request: Request,
  orderPath: string,
  fetchFn: typeof fetch,
  orderId?: string
): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, orderPath, {
    errorMessage: 'Failed to reach crater.',
    context: orderId ? { orderId } : undefined
  });
}

export async function proxyOrderStepConfirmation(
  request: Request,
  orderId: string,
  fetchFn: typeof fetch
): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/status/${encodeURIComponent(orderId)}/confirm`, {
    errorMessage: 'Failed to confirm task step.',
    context: { orderId }
  });
}

export async function proxyOrderStepComment(
  request: Request,
  orderId: string,
  stepId: string,
  fetchFn: typeof fetch
): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/status/${encodeURIComponent(orderId)}/steps/${encodeURIComponent(stepId)}/comments`, {
    errorMessage: 'Failed to post task step comment.',
    context: { orderId, stepId }
  });
}
