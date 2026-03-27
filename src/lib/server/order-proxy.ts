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

export async function proxyPaymentQuote(request: Request, orderId: string, fetchFn: typeof fetch): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/payment/${encodeURIComponent(orderId)}`, {
    errorMessage: 'Failed to load payment quote.',
    context: { orderId }
  });
}

export async function proxyPaymentPromo(request: Request, orderId: string, fetchFn: typeof fetch): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/payment/${encodeURIComponent(orderId)}/promo`, {
    errorMessage: 'Failed to apply promo code.',
    context: { orderId }
  });
}
