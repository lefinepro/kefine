import { expect, test } from '@playwright/test';
import http from 'node:http';
import type { AddressInfo } from 'node:net';

// Relay metadata that a real crater backend exposes at GET /api/relay. It lists
// the relay actor, its inbox/followers, the supported subscription protocols,
// and the internal services wired up through kefine.config.json — the same
// view an external API subscriber and an internal service share.
const RELAY_METADATA = {
  relayActor: 'http://127.0.0.1:3001/actor/relay',
  relayInbox: 'http://127.0.0.1:3001/actor/relay/inbox',
  relayOutbox: 'http://127.0.0.1:3001/actor/relay/outbox',
  relayFollowers: 'http://127.0.0.1:3001/actor/relay/followers',
  protocols: ['mastodon', 'litepub'],
  subscriberCount: 0,
  internalServiceCount: 1,
  internalServiceActors: ['http://127.0.0.1:4501/actor/internal-bot']
};

// The SvelteKit /api/relay route proxies to crater's craterBaseUrl, which is
// http://127.0.0.1:3001 in the dev config used by the Playwright web server.
const CRATER_PORT = 3001;

let craterMock: http.Server | undefined;
let botCreateRequested = false;

test.beforeAll(async () => {
  // Only the chromium project hosts the mock backend so the two projects never
  // contend for the single crater port; the mobile project skips the test.
  if (test.info().project.name !== 'chromium') {
    return;
  }

  craterMock = http.createServer((req, res) => {
    if (req.url?.startsWith('/api/bot/create')) {
      botCreateRequested = true;
      res.writeHead(404, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }

    if (req.method === 'GET' && req.url?.startsWith('/api/relay')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(RELAY_METADATA));
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unexpected request', url: req.url }));
  });

  await new Promise<void>((resolve, reject) => {
    craterMock!.once('error', reject);
    craterMock!.listen(CRATER_PORT, '127.0.0.1', resolve);
  });

  // Sanity-check the bind so a port clash fails loudly instead of timing out.
  expect((craterMock.address() as AddressInfo).port).toBe(CRATER_PORT);
});

test.afterAll(async () => {
  if (craterMock) {
    await new Promise<void>((resolve) => craterMock!.close(() => resolve()));
    craterMock = undefined;
  }
});

test.describe('Relay proxy', () => {
  test('GET /api/relay surfaces the relay actor and configured internal services', async ({
    page
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'relay proxy e2e runs once against the single crater mock port'
    );

    const response = await page.request.get('/api/relay');
    expect(response.status()).toBe(200);

    const body = (await response.json()) as typeof RELAY_METADATA;
    expect(body.relayActor).toBe(RELAY_METADATA.relayActor);
    expect(body.protocols).toEqual(['mastodon', 'litepub']);

    // Internal services configured in config.json are surfaced the same way as
    // the relay actor that external API subscribers follow over the network.
    expect(body.internalServiceCount).toBe(1);
    expect(body.internalServiceActors).toContain('http://127.0.0.1:4501/actor/internal-bot');

    // The bot-token order endpoint has been removed; nothing should reach it.
    expect(botCreateRequested).toBe(false);
    expect(body).not.toHaveProperty('botCreateUrl');
    expect(body).not.toHaveProperty('botTokenRequired');
  });
});
