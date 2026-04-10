import { proxyTemplateByHandleAndSlug } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, fetch, params }) =>
  proxyTemplateByHandleAndSlug(request, params.handle ?? '', params.slug ?? '', fetch);
