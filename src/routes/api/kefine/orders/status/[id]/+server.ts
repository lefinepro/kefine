import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildOrderApiUrl } from '$lib/server/order-api';

export const GET: RequestHandler = async ({ params, fetch }) => {
  try {
    const response = await fetch(buildOrderApiUrl(`/status/${encodeURIComponent(params.id)}`), {
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
        orderId: params.id
      },
      { status: 502 }
    );
  }
};
