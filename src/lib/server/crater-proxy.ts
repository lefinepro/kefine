import { json } from '@sveltejs/kit';
import { buildCraterApiUrl } from '$lib/server/crater-api';

type ProxyOptions = {
  errorMessage: string;
  context?: Record<string, string>;
};

export async function proxyCraterRequest(
  request: Request,
  fetchFn: typeof fetch,
  pathname: string,
  options: ProxyOptions
): Promise<Response> {
  try {
    const body = request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.text();
    const response = await fetchFn(buildCraterApiUrl(pathname), {
      method: request.method,
      headers: {
        Accept: request.headers.get('accept') ?? 'application/json',
        ...(body !== undefined
          ? { 'Content-Type': request.headers.get('content-type') ?? 'application/json' }
          : {})
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
        error: error instanceof Error ? error.message : options.errorMessage,
        ...options.context
      },
      { status: 502 }
    );
  }
}
