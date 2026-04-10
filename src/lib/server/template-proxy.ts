import { proxyCraterRequest } from '$lib/server/crater-proxy';

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
  return proxyCraterRequest(request, fetchFn, `/templates/${encodeURIComponent(handle)}`, {
    errorMessage: 'Failed to load services.'
  });
}

export async function proxyTemplateByHandleAndSlug(
  request: Request,
  handle: string,
  slug: string,
  fetchFn: typeof fetch
): Promise<Response> {
  return proxyCraterRequest(request, fetchFn, `/templates/${encodeURIComponent(handle)}/${encodeURIComponent(slug)}`, {
    errorMessage: 'Failed to load service.'
  });
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
