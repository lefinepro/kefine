const LOCAL_ORDER_API_BASE_URL = 'http://localhost:3001';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveOrderApiBaseUrl(): string {
  const configured =
    process.env.KEFINE_ORDER_API_BASE_URL?.trim() ||
    process.env.VITE_KEFINE_EXCHANGE_BASE_URL?.trim() ||
    process.env.VITE_CRATER_BASE_URL?.trim() ||
    '';

  if (configured) {
    return normalizeBaseUrl(configured);
  }

  return LOCAL_ORDER_API_BASE_URL;
}

export function buildOrderApiUrl(pathname: string): string {
  const baseUrl = resolveOrderApiBaseUrl();
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${baseUrl}/${normalizedPath}`;
}
