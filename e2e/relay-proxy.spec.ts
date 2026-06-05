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
  responsesEndpoint: 'http://127.0.0.1:3001/api/responses',
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
// Captures what crater saw on the most recent POST /api/responses, so the test
// can assert the SvelteKit proxy forwarded the solver bearer token.
let responsesAuthHeader: string | undefined;
let responsesBody: string | undefined;

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

    // The solver return path. Crater authenticates the bearer token, processes
    // the OpenAI Responses payload, and answers with the normalized result.
    if (req.method === 'POST' && req.url?.startsWith('/api/responses')) {
      responsesAuthHeader = req.headers['authorization'];
      const chunks: Buffer[] = [];
      req.on('data', (chunk) => chunks.push(chunk as Buffer));
      req.on('end', () => {
        responsesBody = Buffer.concat(chunks).toString('utf8');
        if (responsesAuthHeader !== 'Bearer lepos_solver_secret') {
          res.writeHead(401, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unknown or missing solver token' }));
          return;
        }
        res.writeHead(202, { 'content-type': 'application/json' });
        res.end(
          JSON.stringify({
            accepted: true,
            provider: 'openai',
            solver: 'http://127.0.0.1:4501/actor/internal-bot',
            outputText: 'Task solved by local inference.'
          })
        );
      });
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

// Both tests share a single crater mock bound to one port, so they must run in
// the same worker; serial mode keeps them off parallel workers that would
// otherwise contend for port 3001 in their per-worker beforeAll.
test.describe.configure({ mode: 'serial' });

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

    // The relay advertises where solvers return their processed results.
    expect(body.responsesEndpoint).toBe(RELAY_METADATA.responsesEndpoint);

    // Internal services configured in config.json are surfaced the same way as
    // the relay actor that external API subscribers follow over the network.
    expect(body.internalServiceCount).toBe(1);
    expect(body.internalServiceActors).toContain('http://127.0.0.1:4501/actor/internal-bot');

    // The bot-token order endpoint has been removed; nothing should reach it.
    expect(botCreateRequested).toBe(false);
    expect(body).not.toHaveProperty('botCreateUrl');
    expect(body).not.toHaveProperty('botTokenRequired');
  });

  test('POST /api/responses forwards the solver bearer token to crater', async ({
    page
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'responses proxy e2e runs once against the single crater mock port'
    );

    // A solver processes the message relayed to its inbox and returns the
    // result (OpenAI Responses shape) authenticated with its bearer token.
    const payload = {
      id: 'resp_test',
      status: 'completed',
      model: 'gpt-4.1-mini',
      output: [{ type: 'message', content: [{ type: 'output_text', text: 'Task solved by local inference.' }] }],
      metadata: { request_id: 'https://origin.example/activities/task-1' }
    };

    const response = await page.request.post('/api/responses', {
      headers: {
        Authorization: 'Bearer lepos_solver_secret',
        'Content-Type': 'application/json'
      },
      data: payload
    });

    expect(response.status()).toBe(202);
    const body = (await response.json()) as { accepted: boolean; provider: string; outputText: string };
    expect(body.accepted).toBe(true);
    expect(body.provider).toBe('openai');
    expect(body.outputText).toBe('Task solved by local inference.');

    // The platform processing layer must receive the bearer token and payload.
    expect(responsesAuthHeader).toBe('Bearer lepos_solver_secret');
    expect(responsesBody).toContain('request_id');
  });
});
