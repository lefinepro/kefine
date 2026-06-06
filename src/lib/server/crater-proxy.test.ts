import { describe, expect, test, vi } from 'vitest';

import { proxyCraterRequest } from './crater-proxy';

describe('proxyCraterRequest', () => {
  test('forwards multipart uploads as buffered bytes with the original content type', async () => {
    let forwardedInit: RequestInit | undefined;
    const fetchFn = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      forwardedInit = init;
      return new Response('{"ok":true}', {
        status: 200,
        headers: {
          'content-type': 'application/json'
        }
      });
    }) as unknown as typeof fetch;

    const formData = new FormData();
    formData.append('title', 'Upload repro');
    formData.append('files', new File(['hello from upload'], 'notes.txt', { type: 'text/plain' }));

    const request = new Request('https://example.test/api/create', {
      method: 'POST',
      body: formData
    });

    const response = await proxyCraterRequest(request, fetchFn, '/create', {
      errorMessage: 'Failed to reach Lepos.'
    });

    expect(response.status).toBe(200);
    expect(fetchFn).toHaveBeenCalledOnce();
    expect(forwardedInit?.body).toBeInstanceOf(Uint8Array);
    expect((forwardedInit?.headers as Record<string, string>)['Content-Type']).toMatch(
      /^multipart\/form-data; boundary=/
    );

    const bodyText = new TextDecoder().decode(forwardedInit?.body as Uint8Array);
    expect(bodyText).toContain('name="title"');
    expect(bodyText).toContain('Upload repro');
    expect(bodyText).toContain('filename="notes.txt"');
    expect(bodyText).toContain('hello from upload');
  });
});
