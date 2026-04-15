import { getPublicRuntimeConfig } from '$lib/server/kefine-config';
import { proxyDeleteTemplate, proxyPublicTemplates, proxySaveTemplate, proxyTemplatesByHandle } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

function getDefaultActorHandle(): string {
  return getPublicRuntimeConfig().defaultActor.handle.replace(/^@+/, '').trim().toLowerCase();
}

export const GET: RequestHandler = async ({ request, fetch, url }) => {
  if (url.searchParams.has('limit')) {
    return proxyPublicTemplates(request, fetch);
  }

  const handle = url.searchParams.get('handle')?.replace(/^@+/, '').trim() || getDefaultActorHandle();
  return proxyTemplatesByHandle(request, handle, fetch);
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  return proxySaveTemplate(request, fetch);
};

export const PUT: RequestHandler = async ({ request, fetch }) => {
  return proxySaveTemplate(request, fetch);
};

export const DELETE: RequestHandler = async ({ request, fetch, url }) => {
  const templateId = url.searchParams.get('templateId')?.trim();
  if (!templateId) {
    return new Response('templateId is required', { status: 400 });
  }

  return proxyDeleteTemplate(request, templateId, fetch);
};
