import {
  normalizeText,
  readBrowserPublicRuntimeConfig,
  type KefinePublicRuntimeConfig
} from './public-config';

export function getPublicRuntimeConfig(): KefinePublicRuntimeConfig {
  return readBrowserPublicRuntimeConfig();
}

export function getCraterBaseUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return normalizeText(window.__KEFINE_CRATER_BASE_URL__);
}
