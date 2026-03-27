import { json } from '@sveltejs/kit';
import { buildOrderApiUrl } from '$lib/server/order-api';

export async function proxyCreateOrder(request: Request, fetchFn: typeof fetch): Promise<Response> {
  try {
    const body = await request.text();
    const response = await fetchFn(buildOrderApiUrl('/create'), {
      method: 'POST',
      headers: {
        'Content-Type': request.headers.get('content-type') ?? 'application/json',
        Accept: 'application/json'
      },
      body
    });

    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json'
      }
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to reach the configured order API.'
      },
      { status: 502 }
    );
  }
}

export async function proxyOrderStatus(
  orderPath: string,
  fetchFn: typeof fetch,
  orderId?: string
): Promise<Response> {
  try {
    const response = await fetchFn(buildOrderApiUrl(orderPath), {
      headers: {
        Accept: 'application/json'
      }
    });

    const payload = await response.text();

    return new Response(payload, {
      status: response.status,
      headers: {
        'content-type': response.headers.get('content-type') ?? 'application/json'
      }
    });
  } catch (error) {
    return json(
      {
        error: error instanceof Error ? error.message : 'Failed to reach the configured order API.',
        ...(orderId ? { orderId } : {})
      },
      { status: 502 }
    );
  }
}
