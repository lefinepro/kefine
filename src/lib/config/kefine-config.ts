import {
  normalizeText,
  resolvePublicRuntimeConfig,
  readBrowserPublicRuntimeConfig,
  type KefinePublicRuntimeConfig
} from './public-config';

export function getPublicRuntimeConfig(): KefinePublicRuntimeConfig {
  return readBrowserPublicRuntimeConfig();
}

export function getCraterBaseUrl(): string {
  const runtimeConfig =
    typeof window === 'undefined' ? resolvePublicRuntimeConfig({}) : readBrowserPublicRuntimeConfig();
  const configured = normalizeText(runtimeConfig.backend.craterBaseUrl);
  if (typeof window === 'undefined') {
    return configured;
  }

  try {
    const parsed = new URL(configured);
    const hostname = parsed.hostname.trim().toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname === 'crater' ||
      hostname === 'lepos' ||
      hostname === 'kefine-crater' ||
      hostname === 'kefine-lepos' ||
      hostname === 'host.docker.internal'
    ) {
      return window.location.origin;
    }
  } catch {
    return configured;
  }

  return configured;
}
