import type { KefineLocale } from '$lib/constants/kefine-locale';
import { readBrowserPublicRuntimeConfig } from '$lib/config/public-config';
import type {
  ProfileTemplate,
  ProfileTemplateBonusMode,
  ProfileTemplateFile,
  ProfileTemplateLocalizedContent,
  ProfileTemplatePricingMode,
  ProfileTemplateVariable,
  ProfileTemplateVisibility
} from '$lib/types/user';
import { syncPromptVariables } from '$lib/templates/template-content';

type TemplatePayload = {
  id?: string;
  authorHandle: string;
  authorProfileId?: string;
  authorDisplayName?: string;
  slug?: string;
  title: string;
  description: string;
  imageDataUrl?: string;
  baseLocale: KefineLocale;
  promptTemplate: string;
  promptVariables: ProfileTemplateVariable[];
  translations?: Partial<Record<KefineLocale, ProfileTemplateLocalizedContent>>;
  prefillTitle: string;
  prefillDescription: string;
  prefillEstimatedCost?: number;
  prefillCurrency?: string;
  prefillFiles: ProfileTemplateFile[];
  tags?: string[];
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
  visibility: ProfileTemplateVisibility;
  isPublished: boolean;
  bonusEnabled: boolean;
  bonusMode: ProfileTemplateBonusMode;
  bonusValue: number;
};

const SERVICE_PROXY_BASE = '/api/services';

function buildDefaultVpnTemplate(handle: string): ProfileTemplate {
  const now = new Date().toISOString();
  const promptTemplate =
    'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop';

  return {
    id: `default:${handle}:vpn-service`,
    profileId: `default:${handle}`,
    authorHandle: handle,
    authorDisplayName: handle.toUpperCase(),
    slug: 'vpn-service',
    title: 'VPN Service',
    description: 'A ready-to-use service for delivering VPN access with connection instructions.',
    baseLocale: 'en',
    promptTemplate,
    promptVariables: [
      { key: 'region', defaultValue: '' }
    ],
    translations: {
      en: {
        title: 'VPN Service',
        description: 'A ready-to-use service for delivering VPN access with connection instructions.',
        promptTemplate
      },
      ru: {
        title: 'VPN сервис',
        description: 'Настроенный сервис для выдачи VPN-доступа с инструкцией по подключению.',
        promptTemplate
      },
      hy: {
        title: 'VPN ծառայություն',
        description: 'Պատրաստի ծառայություն VPN հասանելիություն տրամադրելու և միացման քայլերը ուղարկելու համար։',
        promptTemplate
      }
    },
    prefillTitle: '',
    prefillDescription: promptTemplate,
    prefillEstimatedCost: 15,
    prefillCurrency: 'USD',
    prefillFiles: [],
    tags: ['vpn', 'wireguard'],
    pricingMode: 'fixed',
    pricingValue: 15,
    visibility: 'public',
    isPublished: true,
    bonusEnabled: false,
    bonusMode: 'fixed',
    bonusValue: 0,
    createdAt: now,
    updatedAt: now
  };
}

function getDefaultActorHandle(): string {
  return readBrowserPublicRuntimeConfig().defaultActor.handle.trim().toLowerCase() || 'api';
}

function isDefaultActorHandle(handle: string): boolean {
  return handle.replace(/^@+/, '').trim().toLowerCase() === getDefaultActorHandle();
}

function mergeDefaultVpnTemplate(handle: string, templates: ProfileTemplate[]): ProfileTemplate[] {
  if (!isDefaultActorHandle(handle)) {
    return templates;
  }

  const hasVpn = templates.some((item) => item.slug.trim().toLowerCase() === 'vpn-service');
  return hasVpn ? templates : [buildDefaultVpnTemplate(handle.replace(/^@+/, '').trim().toLowerCase()), ...templates];
}

function normalizeVisibility(value: unknown, isPublished: boolean): ProfileTemplateVisibility {
  return value === 'public' || (value !== 'private' && isPublished) ? 'public' : 'private';
}

function normalizeLocale(value: unknown): KefineLocale {
  return value === 'ru' || value === 'hy' ? value : 'en';
}

function normalizeTranslations(value: unknown): Partial<Record<KefineLocale, ProfileTemplateLocalizedContent>> | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([locale]) => locale === 'en' || locale === 'ru' || locale === 'hy')
    .map(([locale, item]) => {
      const localized = item as Partial<ProfileTemplateLocalizedContent> | null;
      return [
        locale,
        {
          title: typeof localized?.title === 'string' ? localized.title : '',
          description: typeof localized?.description === 'string' ? localized.description : '',
          promptTemplate: typeof localized?.promptTemplate === 'string' ? localized.promptTemplate : ''
        }
      ] as const;
    });

  return entries.length > 0 ? (Object.fromEntries(entries) as Partial<Record<KefineLocale, ProfileTemplateLocalizedContent>>) : undefined;
}

function normalizePromptVariables(value: unknown, promptTemplate: string): ProfileTemplateVariable[] {
  const existing: ProfileTemplateVariable[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      const variable = item as Partial<ProfileTemplateVariable> | null;
      if (!variable || typeof variable.key !== 'string') {
        continue;
      }

      existing.push({
        key: variable.key,
        defaultValue: typeof variable.defaultValue === 'string' ? variable.defaultValue : ''
      });
    }
  }

  return syncPromptVariables(promptTemplate, existing);
}

function mapTemplate(value: unknown): ProfileTemplate | null {
  const item = value as Partial<ProfileTemplate> | null;
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.profileId !== 'string' || typeof item.slug !== 'string') {
    return null;
  }

  const promptTemplate =
    typeof (item as { promptTemplate?: unknown }).promptTemplate === 'string'
      ? ((item as { promptTemplate: string }).promptTemplate ?? '')
      : typeof item.prefillDescription === 'string'
        ? item.prefillDescription
        : typeof item.prefillTitle === 'string'
          ? item.prefillTitle
          : '';

  return {
    id: item.id,
    profileId: item.profileId,
    authorHandle: typeof (item as { authorHandle?: unknown }).authorHandle === 'string' ? (item as { authorHandle: string }).authorHandle : undefined,
    authorDisplayName:
      typeof (item as { authorDisplayName?: unknown }).authorDisplayName === 'string'
        ? (item as { authorDisplayName: string }).authorDisplayName
        : undefined,
    slug: item.slug,
    title: typeof item.title === 'string' ? item.title : 'Untitled template',
    description: typeof item.description === 'string' ? item.description : '',
    imageDataUrl: typeof (item as { imageDataUrl?: unknown }).imageDataUrl === 'string' ? (item as { imageDataUrl: string }).imageDataUrl : undefined,
    baseLocale: normalizeLocale((item as { baseLocale?: unknown }).baseLocale),
    promptTemplate,
    promptVariables: normalizePromptVariables((item as { promptVariables?: unknown }).promptVariables, promptTemplate),
    translations: normalizeTranslations((item as { translations?: unknown }).translations),
    prefillTitle: typeof item.prefillTitle === 'string' ? item.prefillTitle : '',
    prefillDescription: typeof item.prefillDescription === 'string' ? item.prefillDescription : '',
    prefillEstimatedCost: typeof item.prefillEstimatedCost === 'number' ? item.prefillEstimatedCost : undefined,
    prefillCurrency: typeof item.prefillCurrency === 'string' ? item.prefillCurrency : undefined,
    prefillFiles: Array.isArray(item.prefillFiles) ? (item.prefillFiles as ProfileTemplateFile[]) : [],
    tags: Array.isArray((item as { tags?: unknown }).tags)
      ? ((item as { tags: unknown[] }).tags.filter((tag): tag is string => typeof tag === 'string'))
      : [],
    pricingMode: item.pricingMode === 'percent' ? 'percent' : 'fixed',
    pricingValue: typeof item.pricingValue === 'number' ? item.pricingValue : 0,
    visibility: normalizeVisibility((item as { visibility?: unknown }).visibility, item.isPublished === true),
    isPublished: item.isPublished === true,
    bonusEnabled: (item as { bonusEnabled?: unknown }).bonusEnabled === true,
    bonusMode: (item as { bonusMode?: unknown }).bonusMode === 'percent' ? 'percent' : 'fixed',
    bonusValue: typeof (item as { bonusValue?: unknown }).bonusValue === 'number' ? (item as { bonusValue: number }).bonusValue : 0,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString()
  };
}

export async function fetchTemplatesByHandle(baseUrl: string, handle: string): Promise<ProfileTemplate[]> {
  void baseUrl;
  const normalizedHandle = handle.replace(/^@+/, '');
  const response = await fetch(
    isDefaultActorHandle(normalizedHandle)
      ? SERVICE_PROXY_BASE
      : `${SERVICE_PROXY_BASE}?handle=${encodeURIComponent(normalizedHandle)}`
  );
  if (!response.ok) {
    return mergeDefaultVpnTemplate(handle, []);
  }

  const payload = (await response.json().catch(() => [])) as unknown[];
  const templates = Array.isArray(payload) ? payload.map(mapTemplate).filter((item): item is ProfileTemplate => item !== null) : [];
  return mergeDefaultVpnTemplate(handle, templates);
}

export async function fetchPublicTemplates(baseUrl: string, limit = 24): Promise<ProfileTemplate[]> {
  void baseUrl;
  const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(48, Math.round(limit))) : 24;
  const response = await fetch(`${SERVICE_PROXY_BASE}?limit=${normalizedLimit}`);
  if (!response.ok) {
    return mergeDefaultVpnTemplate(getDefaultActorHandle(), []);
  }

  const payload = (await response.json().catch(() => [])) as unknown[];
  const templates = Array.isArray(payload) ? payload.map(mapTemplate).filter((item): item is ProfileTemplate => item !== null) : [];
  return mergeDefaultVpnTemplate(getDefaultActorHandle(), templates);
}

export async function fetchTemplateByHandleAndSlug(baseUrl: string, handle: string, slug: string): Promise<ProfileTemplate | null> {
  void baseUrl;
  const normalizedHandle = handle.replace(/^@+/, '');
  const response = await fetch(
    isDefaultActorHandle(normalizedHandle)
      ? `${SERVICE_PROXY_BASE}/${encodeURIComponent(slug)}`
      : `${SERVICE_PROXY_BASE}/${encodeURIComponent(slug)}?handle=${encodeURIComponent(normalizedHandle)}`
  );
  if (!response.ok) {
    return isDefaultActorHandle(handle) && slug.trim().toLowerCase() === 'vpn-service'
      ? buildDefaultVpnTemplate(handle.replace(/^@+/, '').trim().toLowerCase())
      : null;
  }

  const template = mapTemplate(await response.json().catch(() => null));
  if (template) {
    return template;
  }

  return isDefaultActorHandle(handle) && slug.trim().toLowerCase() === 'vpn-service'
    ? buildDefaultVpnTemplate(handle.replace(/^@+/, '').trim().toLowerCase())
    : null;
}

export async function saveTemplateToCrater(baseUrl: string, payload: TemplatePayload): Promise<ProfileTemplate | null> {
  void baseUrl;
  const response = await fetch(SERVICE_PROXY_BASE, {
    method: payload.id ? 'PUT' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return null;
  }

  return mapTemplate(await response.json().catch(() => null));
}

export async function deleteTemplateFromCrater(baseUrl: string, templateId: string): Promise<boolean> {
  void baseUrl;
  const response = await fetch(`${SERVICE_PROXY_BASE}?templateId=${encodeURIComponent(templateId)}`, {
    method: 'DELETE'
  });

  return response.ok;
}
