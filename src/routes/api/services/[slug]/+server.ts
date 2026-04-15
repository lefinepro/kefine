import { getPublicRuntimeConfig } from '$lib/server/kefine-config';
import { proxyTemplateByHandleAndSlug } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

function getDefaultActorHandle(): string {
  return getPublicRuntimeConfig().defaultActor.handle.replace(/^@+/, '').trim().toLowerCase();
}

export const GET: RequestHandler = async ({ request, fetch, params }) => {
  const url = new URL(request.url);
  const handle = url.searchParams.get('handle')?.replace(/^@+/, '').trim() || getDefaultActorHandle();
  return proxyTemplateByHandleAndSlug(request, handle, params.slug, fetch);
};
