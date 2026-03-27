const DEFAULT_CRATER_BASE_URL = 'http://localhost:3001';
const DEFAULT_EXCHANGE_BASE_URL = DEFAULT_CRATER_BASE_URL;

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function resolveConfiguredUrl(value: string | undefined, fallback: string): string {
  const configured = value?.trim();
  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return normalizeBaseUrl(fallback);
}

export function resolveCraterBaseUrl(): string {
  return resolveConfiguredUrl(process.env.KEFINE_CRATER, DEFAULT_CRATER_BASE_URL);
}

export function resolveExchangeBaseUrl(): string {
  return resolveConfiguredUrl(process.env.KEFINE_EXCHANGE, resolveCraterBaseUrl() || DEFAULT_EXCHANGE_BASE_URL);
}

export function buildCraterApiUrl(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${resolveCraterBaseUrl()}/${normalizedPath}`;
}

export function buildExchangeUrl(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${resolveExchangeBaseUrl()}/${normalizedPath}`;
}
