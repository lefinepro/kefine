import type { ProfileTemplate, ProfileTemplateFile, ProfileTemplatePricingMode } from '$lib/types/user';

type TemplatePayload = {
  id?: string;
  authorHandle: string;
  authorProfileId?: string;
  authorDisplayName?: string;
  slug?: string;
  title: string;
  description: string;
  prefillTitle: string;
  prefillDescription: string;
  prefillEstimatedCost?: number;
  prefillCurrency?: string;
  prefillFiles: ProfileTemplateFile[];
  pricingMode: ProfileTemplatePricingMode;
  pricingValue: number;
  isPublished: boolean;
};

function normalizeBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function mapTemplate(value: unknown): ProfileTemplate | null {
  const item = value as Partial<ProfileTemplate> | null;
  if (!item || typeof item !== 'object' || typeof item.id !== 'string' || typeof item.profileId !== 'string' || typeof item.slug !== 'string') {
    return null;
  }

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
    prefillTitle: typeof item.prefillTitle === 'string' ? item.prefillTitle : '',
    prefillDescription: typeof item.prefillDescription === 'string' ? item.prefillDescription : '',
    prefillEstimatedCost: typeof item.prefillEstimatedCost === 'number' ? item.prefillEstimatedCost : undefined,
    prefillCurrency: typeof item.prefillCurrency === 'string' ? item.prefillCurrency : undefined,
    prefillFiles: Array.isArray(item.prefillFiles) ? (item.prefillFiles as ProfileTemplateFile[]) : [],
    pricingMode: item.pricingMode === 'percent' ? 'percent' : 'fixed',
    pricingValue: typeof item.pricingValue === 'number' ? item.pricingValue : 0,
    isPublished: item.isPublished === true,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString()
  };
}

export async function fetchTemplatesByHandle(baseUrl: string, handle: string): Promise<ProfileTemplate[]> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/templates/${encodeURIComponent(handle.replace(/^@+/, ''))}`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => [])) as unknown[];
  return Array.isArray(payload) ? payload.map(mapTemplate).filter((item): item is ProfileTemplate => item !== null) : [];
}

export async function fetchTemplateByHandleAndSlug(baseUrl: string, handle: string, slug: string): Promise<ProfileTemplate | null> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/templates/${encodeURIComponent(handle.replace(/^@+/, ''))}/${encodeURIComponent(slug)}`);
  if (!response.ok) {
    return null;
  }

  return mapTemplate(await response.json().catch(() => null));
}

export async function saveTemplateToCrater(baseUrl: string, payload: TemplatePayload): Promise<ProfileTemplate | null> {
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/templates`, {
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
  const response = await fetch(`${normalizeBaseUrl(baseUrl)}/templates/${encodeURIComponent(templateId)}`, {
    method: 'DELETE'
  });

  return response.ok;
}
