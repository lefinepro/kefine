import { afterEach, describe, expect, test, vi } from 'vitest';
import { getCraterBaseUrl } from './kefine-config';
import { DEFAULT_PUBLIC_RUNTIME_CONFIG, setBrowserPublicRuntimeConfig } from './public-config';

const browserOrigin = 'http://app.local';

function stubBrowserWindow(): void {
  vi.stubGlobal('window', {
    location: {
      origin: browserOrigin
    }
  });
}

describe('getCraterBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setBrowserPublicRuntimeConfig(DEFAULT_PUBLIC_RUNTIME_CONFIG);
  });

  test.each([
    'http://crater:3001',
    'http://lepos:3001',
    'http://kefine-crater:3001',
    'http://kefine-lepos:3001'
  ])('routes internal compose backend %s through the browser origin', (craterBaseUrl) => {
    stubBrowserWindow();
    setBrowserPublicRuntimeConfig({ backend: { craterBaseUrl } });

    expect(getCraterBaseUrl()).toBe(browserOrigin);
  });
});
