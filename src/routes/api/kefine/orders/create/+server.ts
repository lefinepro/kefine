import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildOrderApiUrl } from '$lib/server/order-api';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const body = await request.text();
    const response = await fetch(buildOrderApiUrl('/create'), {
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
};
