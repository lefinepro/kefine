import type { KefineLocale } from '$lib/constants/kefine-locale';
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

const TEMPLATE_PROXY_BASE = '/api/kefine/templates';

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
  const response = await fetch(`${TEMPLATE_PROXY_BASE}/${encodeURIComponent(handle.replace(/^@+/, ''))}`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => [])) as unknown[];
  return Array.isArray(payload) ? payload.map(mapTemplate).filter((item): item is ProfileTemplate => item !== null) : [];
}

export async function fetchPublicTemplates(baseUrl: string, limit = 24): Promise<ProfileTemplate[]> {
  void baseUrl;
  const normalizedLimit = Number.isFinite(limit) ? Math.max(1, Math.min(48, Math.round(limit))) : 24;
  const response = await fetch(`${TEMPLATE_PROXY_BASE}?limit=${normalizedLimit}`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => [])) as unknown[];
  return Array.isArray(payload) ? payload.map(mapTemplate).filter((item): item is ProfileTemplate => item !== null) : [];
}

export async function fetchTemplateByHandleAndSlug(baseUrl: string, handle: string, slug: string): Promise<ProfileTemplate | null> {
  void baseUrl;
  const response = await fetch(
    `${TEMPLATE_PROXY_BASE}/${encodeURIComponent(handle.replace(/^@+/, ''))}/${encodeURIComponent(slug)}`
  );
  if (!response.ok) {
    return null;
  }

  return mapTemplate(await response.json().catch(() => null));
}

export async function saveTemplateToCrater(baseUrl: string, payload: TemplatePayload): Promise<ProfileTemplate | null> {
  void baseUrl;
  const response = await fetch(TEMPLATE_PROXY_BASE, {
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
  const response = await fetch(`${TEMPLATE_PROXY_BASE}/id/${encodeURIComponent(templateId)}`, {
    method: 'DELETE'
  });

  return response.ok;
}
