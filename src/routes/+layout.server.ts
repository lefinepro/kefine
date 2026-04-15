import type { LayoutServerLoad } from './$types';
import { getPublicRuntimeConfig } from '$lib/server/kefine-config';

function resolveRequestOrigin(url: URL, request: Request): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const forwardedPort = request.headers.get('x-forwarded-port')?.split(',')[0]?.trim();

  if (!forwardedHost) {
    return url.origin;
  }

  const protocol = forwardedProto || url.protocol.replace(/:$/, '') || 'https';
  const needsPort =
    forwardedPort &&
    !forwardedHost.includes(':') &&
    !((protocol === 'https' && forwardedPort === '443') || (protocol === 'http' && forwardedPort === '80'));

  return `${protocol}://${forwardedHost}${needsPort ? `:${forwardedPort}` : ''}`;
}

export const load: LayoutServerLoad = ({ url, request }) => {
  return {
    publicConfig: getPublicRuntimeConfig(),
    requestOrigin: resolveRequestOrigin(url, request)
  };
};
