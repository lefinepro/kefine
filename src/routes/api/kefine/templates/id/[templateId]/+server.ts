import { proxyDeleteTemplate } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = ({ request, fetch, params }) =>
  proxyDeleteTemplate(request, params.templateId ?? '', fetch);
