import { proxyPublicTemplates, proxySaveTemplate } from '$lib/server/template-proxy';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ request, fetch }) => proxyPublicTemplates(request, fetch);
export const POST: RequestHandler = ({ request, fetch }) => proxySaveTemplate(request, fetch);
export const PUT: RequestHandler = ({ request, fetch }) => proxySaveTemplate(request, fetch);
