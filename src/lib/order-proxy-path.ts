const DEFAULT_ORDER_PROXY_BASE_PATH = '';

function normalizeProxyBasePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export function resolveOrderProxyBasePath(value?: string): string {
  if (typeof value === 'string') {
    return normalizeProxyBasePath(value);
  }

  return normalizeProxyBasePath(DEFAULT_ORDER_PROXY_BASE_PATH);
}

export function buildOrderProxyUrl(pathname: string, basePath?: string): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const resolvedBasePath = resolveOrderProxyBasePath(basePath);
  return `${resolvedBasePath}${normalizedPath}`;
}
