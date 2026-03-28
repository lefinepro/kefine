const DEFAULT_CRATER_BASE_URL = 'http://localhost:3001';

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

export function buildCraterApiUrl(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${resolveCraterBaseUrl()}/${normalizedPath}`;
}
