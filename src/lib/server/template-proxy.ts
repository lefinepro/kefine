import { json } from '@sveltejs/kit';
import { proxyCraterRequest } from '$lib/server/crater-proxy';
import { getPublicRuntimeConfig } from '$lib/server/kefine-config';

function buildDefaultVpnTemplate(handle: string) {
  const now = new Date().toISOString();

  return {
    id: `default:${handle}:vpn-service`,
    profileId: `default:${handle}`,
    authorHandle: handle,
    authorDisplayName: handle.toUpperCase(),
    slug: 'vpn-service',
    title: 'VPN Service',
    description: 'A ready-to-use service for delivering VPN access with connection instructions.',
    baseLocale: 'en' as const,
    promptTemplate:
      'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop',
    promptVariables: [
      { key: 'region', defaultValue: '' }
    ],
    translations: {
      en: {
        title: 'VPN Service',
        description: 'A ready-to-use service for delivering VPN access with connection instructions.',
        promptTemplate:
          'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop'
      },
      ru: {
        title: 'VPN сервис',
        description: 'Настроенный сервис для выдачи VPN-доступа с инструкцией по подключению.',
        promptTemplate:
          'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop'
      },
      hy: {
        title: 'VPN ծառայություն',
        description: 'Պատրաստի ծառայություն VPN հասանելիություն տրամադրելու և միացման քայլերը ուղարկելու համար։',
        promptTemplate:
          'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop'
      }
    },
    prefillTitle: '',
    prefillDescription:
      'Create and deliver a VPN access package.\n\nNeed:\n- region: :region\n- protocol: WireGuard or VLESS\n- include setup steps for mobile and desktop',
    prefillEstimatedCost: 15,
    prefillCurrency: 'USD',
    prefillFiles: [],
    tags: ['vpn', 'wireguard'],
    pricingMode: 'fixed' as const,
    pricingValue: 15,
    visibility: 'public' as const,
    isPublished: true,
    bonusEnabled: false,
    bonusMode: 'fixed' as const,
    bonusValue: 0,
    createdAt: now,
    updatedAt: now
  };
}

function isDefaultActorHandle(handle: string): boolean {
  const runtimeConfig = getPublicRuntimeConfig();
  return handle.trim().toLowerCase() === runtimeConfig.defaultActor.handle.trim().toLowerCase();
}

async function readJsonPayload(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function isTemplateRecord(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as { id?: unknown; profileId?: unknown; slug?: unknown };
  return typeof candidate.id === 'string' && typeof candidate.profileId === 'string' && typeof candidate.slug === 'string';
}

export async function proxyPublicTemplates(request: Request, fetchFn: typeof fetch): Promise<Response> {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit');
  const pathname = limit ? `/templates?limit=${encodeURIComponent(limit)}` : '/templates';

  return proxyCraterRequest(request, fetchFn, pathname, {
    errorMessage: 'Failed to load public services.'
  });
}

export async function proxyTemplatesByHandle(
  request: Request,
  handle: string,
  fetchFn: typeof fetch
): Promise<Response> {
  const normalizedHandle = handle.replace(/^@+/, '').trim().toLowerCase();
  const response = await proxyCraterRequest(request, fetchFn, `/templates/${encodeURIComponent(handle)}`, {
    errorMessage: 'Failed to load services.'
  });

  if (!isDefaultActorHandle(normalizedHandle)) {
    return response;
  }

  if (!response.ok) {
    return json([buildDefaultVpnTemplate(normalizedHandle)]);
  }

  const payload = await readJsonPayload(response);
  if (!Array.isArray(payload)) {
    return json([buildDefaultVpnTemplate(normalizedHandle)]);
  }

  const hasVpnService = payload.some((item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const slug = (item as { slug?: unknown }).slug;
    return typeof slug === 'string' && slug.trim().toLowerCase() === 'vpn-service';
  });

  return hasVpnService ? json(payload) : json([buildDefaultVpnTemplate(normalizedHandle), ...payload]);
}

export async function proxyTemplateByHandleAndSlug(
  request: Request,
  handle: string,
  slug: string,
  fetchFn: typeof fetch
): Promise<Response> {
  const normalizedHandle = handle.replace(/^@+/, '').trim().toLowerCase();
  const normalizedSlug = slug.trim().toLowerCase();
  const response = await proxyCraterRequest(request, fetchFn, `/templates/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`, {
    errorMessage: 'Failed to load service.'
  });

  if (!isDefaultActorHandle(normalizedHandle) || normalizedSlug !== 'vpn-service') {
    return response;
  }

  if (!response.ok) {
    return json(buildDefaultVpnTemplate(normalizedHandle));
  }

  const payload = await readJsonPayload(response);
  return isTemplateRecord(payload) ? json(payload) : json(buildDefaultVpnTemplate(normalizedHandle));
}

export async function proxySaveTemplate(request: Request, fetchFn: typeof fetch): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, '/templates', {
    errorMessage: 'Failed to save service.'
  });
}

export async function proxyDeleteTemplate(
  request: Request,
  templateId: string,
  fetchFn: typeof fetch
): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/templates/${encodeURIComponent(templateId)}`, {
    errorMessage: 'Failed to delete service.'
  });
}
