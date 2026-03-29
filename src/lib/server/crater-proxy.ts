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
    const body =
      request.method === 'GET' || request.method === 'HEAD' ? undefined : new Uint8Array(await request.arrayBuffer());
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
    const contentType = response.headers.get('content-type') ?? 'application/json';

    if (!response.ok && !contentType.toLowerCase().includes('application/json')) {
      const normalized = payload.replace(/\s+/g, ' ').trim();
      const message = normalized || response.statusText || options.errorMessage;

      return json({ error: message }, { status: response.status });
    }

    return new Response(payload, {
      status: response.status,
      headers: {
        'content-type': contentType
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
