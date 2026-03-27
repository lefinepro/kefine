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
