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
  return normalizeText(runtimeConfig.backend.craterBaseUrl);
}
