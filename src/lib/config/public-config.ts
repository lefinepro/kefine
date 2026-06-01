import type { KefineLocale } from '$lib/constants/kefine-locale';

export type KefineSocialLinkId = 'mastodon' | 'discord' | 'linkedin' | 'telegram' | 'github';

export type KefineLegalUpdatedAt = Record<KefineLocale, string>;

export type KefinePublicAppConfig = {
  name: string;
  supportEmail: string;
  reownProjectId: string;
  socialLinks: Record<KefineSocialLinkId, string>;
  legalUpdatedAt: KefineLegalUpdatedAt;
};

export type KefinePinnedServiceConfig = {
  handle: string;
  slug: string;
  isPinned: boolean;
};

export type KefineDefaultActorPublicConfig = {
  handle: string;
  displayName: string;
};

export type KefinePublicRuntimeConfig = {
  app: KefinePublicAppConfig;
  services: KefinePinnedServiceConfig[];
  defaultActor: KefineDefaultActorPublicConfig;
  backend: {
    craterBaseUrl: string;
  };
};

export const DEFAULT_PUBLIC_RUNTIME_CONFIG: KefinePublicRuntimeConfig = {
  app: {
    name: 'Lefine',
    supportEmail: 'order@lefine.pro',
    reownProjectId: '909acf523be03f300ad21cca95d966c8',
    socialLinks: {
      mastodon: 'https://mastodon.social/@lefine',
      discord: 'https://discord.com/invite/lefine',
      linkedin: 'https://www.linkedin.com/company/lefine',
      telegram: 'https://t.me/lefine',
      github: 'https://github.com/lefinepro'
    },
    legalUpdatedAt: {
      en: 'March 2026',
      ru: 'Март 2026',
      hy: 'Մարտ 2026'
    }
  },
  services: [],
  defaultActor: {
    handle: 'staff',
    displayName: 'Staff'
  },
  backend: {
    craterBaseUrl: 'http://localhost:3001'
  }
};

export function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() || fallback : fallback;
}

export function resolvePublicRuntimeConfig(value: unknown): KefinePublicRuntimeConfig {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PUBLIC_RUNTIME_CONFIG;
  }

  const source = value as {
    app?: Partial<KefinePublicAppConfig>;
    services?: unknown;
    defaultActor?: Partial<KefineDefaultActorPublicConfig>;
  };
  const app: Partial<KefinePublicAppConfig> = source.app ?? {};
  const defaultActor: Partial<KefineDefaultActorPublicConfig> = source.defaultActor ?? {};
  const socialLinks: Partial<Record<KefineSocialLinkId, string>> = app.socialLinks ?? {};
  const legalUpdatedAt: Partial<KefineLegalUpdatedAt> = app.legalUpdatedAt ?? {};
  const services = Array.isArray(source.services)
    ? source.services
        .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
        .map((item) => ({
          handle: normalizeText(item.handle),
          slug: normalizeText(item.slug),
          isPinned: item.isPinned === true
        }))
        .filter((item) => item.handle && item.slug)
    : DEFAULT_PUBLIC_RUNTIME_CONFIG.services;

  return {
    app: {
      name: normalizeText(app.name, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.name),
      supportEmail: normalizeText(app.supportEmail, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.supportEmail),
      reownProjectId: normalizeText(app.reownProjectId, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.reownProjectId),
      socialLinks: {
        mastodon: normalizeText(socialLinks.mastodon, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.mastodon),
        discord: normalizeText(socialLinks.discord, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.discord),
        linkedin: normalizeText(socialLinks.linkedin, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.linkedin),
        telegram: normalizeText(socialLinks.telegram, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.telegram),
        github: normalizeText(socialLinks.github, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.socialLinks.github)
      },
      legalUpdatedAt: {
        en: normalizeText(legalUpdatedAt.en, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.en),
        ru: normalizeText(legalUpdatedAt.ru, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.ru),
        hy: normalizeText(legalUpdatedAt.hy, DEFAULT_PUBLIC_RUNTIME_CONFIG.app.legalUpdatedAt.hy)
      }
    },
    services,
    defaultActor: {
      handle: normalizeText(defaultActor.handle, DEFAULT_PUBLIC_RUNTIME_CONFIG.defaultActor.handle),
      displayName: normalizeText(defaultActor.displayName, DEFAULT_PUBLIC_RUNTIME_CONFIG.defaultActor.displayName)
    },
    backend: {
      craterBaseUrl: normalizeText((value as { backend?: { craterBaseUrl?: string } }).backend?.craterBaseUrl, DEFAULT_PUBLIC_RUNTIME_CONFIG.backend.craterBaseUrl)
    }
  };
}

export function getPublicRuntimeConfig(value: unknown = {}): KefinePublicRuntimeConfig {
  return resolvePublicRuntimeConfig(value);
}

let browserPublicRuntimeConfig: KefinePublicRuntimeConfig | null = null;

export function setBrowserPublicRuntimeConfig(value: unknown): void {
  browserPublicRuntimeConfig = resolvePublicRuntimeConfig(value);
}

export function readBrowserPublicRuntimeConfig(): KefinePublicRuntimeConfig {
  return browserPublicRuntimeConfig ?? DEFAULT_PUBLIC_RUNTIME_CONFIG;
}
