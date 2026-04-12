import { getPublicRuntimeConfig } from '$lib/server/kefine-config';
import { proxyPublicTemplates, proxySaveTemplate, proxyTemplatesByHandle } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

function getDefaultActorHandle(): string {
  return getPublicRuntimeConfig().defaultActor.handle.replace(/^@+/, '').trim().toLowerCase();
}

export const GET: RequestHandler = async ({ request, fetch, url }) => {
  if (url.searchParams.has('limit')) {
    return proxyPublicTemplates(request, fetch);
  }

  return proxyTemplatesByHandle(request, getDefaultActorHandle(), fetch);
};

export const POST: RequestHandler = async ({ request, fetch }) => {
  return proxySaveTemplate(request, fetch);
};

export const PUT: RequestHandler = async ({ request, fetch }) => {
  return proxySaveTemplate(request, fetch);
};
