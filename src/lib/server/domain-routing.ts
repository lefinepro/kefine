const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

type DomainBucket = 'primary' | 'legal' | 'task';

type DomainConfig = {
  primaryOrigin: URL | null;
  legalOrigin: URL | null;
  taskOrigin: URL | null;
};

function parseOrigin(value: string | undefined): URL | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }

  try {
    return new URL(normalized);
  } catch {
    return null;
  }
}

function isLocalHost(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '');
}

function getDomainBucket(pathname: string): DomainBucket {
  const normalizedPath = normalizePathname(pathname);

  if (
    normalizedPath === '/privacy' ||
    normalizedPath === '/terms' ||
    normalizedPath === '/refund-policy'
  ) {
    return 'legal';
  }

  if (
    normalizedPath === '/create' ||
    normalizedPath.startsWith('/task/') ||
    normalizedPath.startsWith('/order/') ||
    normalizedPath.startsWith('/payment/') ||
    normalizedPath.startsWith('/pay/') ||
    normalizedPath.startsWith('/passkeys/') ||
    normalizedPath === '/status' ||
    normalizedPath.startsWith('/status/') ||
    normalizedPath.startsWith('/api/kefine/')
  ) {
    return 'task';
  }

  return 'primary';
}

function getConfiguredOrigins(): DomainConfig {
  const primaryOrigin =
    parseOrigin(process.env.ORIGIN) ??
    parseOrigin(process.env.KEFINE_PRIMARY_ORIGIN) ??
    parseOrigin('https://lefine.pro');

  const legalOrigin =
    parseOrigin(process.env.KEFINE_LEGAL_ORIGIN) ??
    parseOrigin(process.env.LEGAL_ORIGIN) ??
    primaryOrigin;

  const taskOrigin =
    parseOrigin(process.env.KEFINE_TASK_ORIGIN) ??
    parseOrigin(process.env.TASK_ORIGIN) ??
    primaryOrigin;

  return {
    primaryOrigin,
    legalOrigin,
    taskOrigin
  };
}

export function resolveDomainRedirect(url: URL): URL | null {
  if (isLocalHost(url.hostname)) {
    return null;
  }

  const config = getConfiguredOrigins();
  const bucket = getDomainBucket(url.pathname);
  const targetOrigin =
    bucket === 'legal' ? config.legalOrigin : bucket === 'task' ? config.taskOrigin : config.primaryOrigin;

  if (!targetOrigin) {
    return null;
  }

  if (targetOrigin.origin === url.origin) {
    return null;
  }

  const redirectUrl = new URL(url.pathname + url.search, targetOrigin);
  return redirectUrl;
}
