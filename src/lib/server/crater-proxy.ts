import { json } from '@sveltejs/kit';
import { buildCraterApiUrl } from '$lib/server/crater-api';

type ProxyOptions = {
  errorMessage: string;
  context?: Record<string, string>;
  forwardAuthorization?: boolean;
};

export async function proxyCraterRequest(
  request: Request,
  fetchFn: typeof fetch,
  pathname: string,
  options: ProxyOptions
): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type');
    const isMultipart = contentType?.includes('multipart/form-data');
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const forwardedHost = request.headers.get('x-forwarded-host');
    const forwardedPort = request.headers.get('x-forwarded-port');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const userAgent = request.headers.get('user-agent');
    const authorization = request.headers.get('authorization');

    let body: BodyInit | undefined;
    let headers: Record<string, string> = {
      Accept: request.headers.get('accept') ?? 'application/json'
    };

    if (forwardedProto) {
      headers['X-Forwarded-Proto'] = forwardedProto;
    }

    if (forwardedHost) {
      headers['X-Forwarded-Host'] = forwardedHost;
    }

    if (forwardedPort) {
      headers['X-Forwarded-Port'] = forwardedPort;
    }

    if (origin) {
      headers['Origin'] = origin;
    }

    if (referer) {
      headers['Referer'] = referer;
    }

    if (userAgent) {
      headers['User-Agent'] = userAgent;
    }

    if (options.forwardAuthorization && authorization) {
      headers['Authorization'] = authorization;
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      if (isMultipart) {
        // For multipart/form-data, forward the body directly to preserve boundary
        body = request.body ?? undefined;
        if (contentType) {
          headers['Content-Type'] = contentType;
        }
      } else {
        // For JSON and other types, read as ArrayBuffer
        body = new Uint8Array(await request.arrayBuffer());
        if (contentType) {
          headers['Content-Type'] = contentType;
        }
      }
    }

    const response = await fetchFn(buildCraterApiUrl(pathname), {
      method: request.method,
      headers,
      body
    });

    const payload = await response.text();
    const responseContentType = response.headers.get('content-type') ?? 'application/json';

    if (!response.ok && !responseContentType.toLowerCase().includes('application/json')) {
      const normalized = payload.replace(/\s+/g, ' ').trim();
      const message = normalized || response.statusText || options.errorMessage;

      return json({ error: message }, { status: response.status });
    }

    return new Response(payload, {
      status: response.status,
      headers: {
        'content-type': responseContentType
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
