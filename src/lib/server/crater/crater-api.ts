import { getKefineConfig } from '$lib/server/config/kefine-config';

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function resolveCraterBaseUrl(): string {
  return normalizeBaseUrl(getKefineConfig().backend.craterBaseUrl);
}

export function buildCraterApiUrl(pathname: string): string {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return `${resolveCraterBaseUrl()}/${normalizedPath}`;
}
