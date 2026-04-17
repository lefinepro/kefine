import { isSpecialRuntimeHostname } from '$lib/config/special-runtime';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

export function resolveDomainRedirect(url: URL): URL | null {
  if (isLocalHost(url.hostname) || isSpecialRuntimeHostname(url.hostname)) {
    return null;
  }
  return null;
}
