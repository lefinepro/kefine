import { getPublicRuntimeConfig } from '$lib/server/kefine-config';
import { proxyTemplateByHandleAndSlug } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

function getDefaultActorHandle(): string {
  return getPublicRuntimeConfig().defaultActor.handle.replace(/^@+/, '').trim().toLowerCase();
}

export const GET: RequestHandler = async ({ request, fetch, params }) => {
  return proxyTemplateByHandleAndSlug(request, getDefaultActorHandle(), params.slug, fetch);
};
