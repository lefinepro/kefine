import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots');
const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';
const exampleRepo = '@example/proxy-on-go/release';

mkdirSync(outDir, { recursive: true });

function buildOrder(id, title, status = 'queued') {
  return {
    id,
    title,
    status,
    solver: 'Test Solver',
    executionEstimate: 'about 2 hours',
    estimatedCost: 42,
    currency: 'USDC',
    ownerUsername: 'api',
    ownerDisplayName: 'API',
    actorHandle: 'api',
    shareId: id,
    isPublicTask: false,
    vcsEnabled: false
  };
}

function orderPayload(order) {
  return {
    orderId: order.id,
    title: order.title,
    status: order.status,
    solver: order.solver,
    description: order.title,
    executionEstimate: order.executionEstimate,
    estimatedCost: order.estimatedCost,
    currency: order.currency,
    paymentUrl: null,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    ownerUsername: order.ownerUsername,
    ownerDisplayName: order.ownerDisplayName,
    actorHandle: order.actorHandle,
    shareId: order.shareId,
    isPublicTask: order.isPublicTask,
    vcsEnabled: order.vcsEnabled
  };
}

async function mockOrderApi(page) {
  let createCounter = 0;
  const orders = new Map();

  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true })
    });
  });

  await page.route('**/create', async (route) => {
    createCounter += 1;
    const payload = route.request().postDataJSON();
    const title = payload.title ?? payload.name ?? `Task ${createCounter}`;
    const order = buildOrder(`order-${createCounter}`, title);
    orders.set(order.id, order);

    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        accepted: true,
        orderId: order.id,
        status: order.status,
        solver: order.solver,
        paymentUrl: null
      })
    });
  });

  await page.route('**/status/**', async (route) => {
    const url = new URL(route.request().url());
    const orderId = decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? '');
    const order = orders.get(orderId);

    await route.fulfill({
      status: order ? 200 : 404,
      contentType: 'application/json',
      body: JSON.stringify(order ? orderPayload(order) : { error: 'Order not found', orderId })
    });
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1400 },
  deviceScaleFactor: 1
});
const page = await context.newPage();

await mockOrderApi(page);
await page.goto(baseURL);
await page.evaluate(() => {
  window.localStorage.clear();
});
await page.reload();
await page.getByTestId('kefine-task-input').waitFor();
await page.waitForFunction(() => {
  const el = document.querySelector('[data-testid="kefine-task-input"]');
  return el && Object.getOwnPropertySymbols(el).length > 0;
});
await page.locator('.repo-example-list button').first().click();
await page.getByTestId('kefine-solver-search-row').waitFor();
await page.locator('[data-testid="kefine-solver-select-trigger"]:not([disabled])').waitFor({ timeout: 6000 });
await page.waitForFunction(() => {
  return document
    .querySelector('[data-testid="kefine-header-search"]')
    ?.getAttribute('data-search-completed') === 'true';
});
await page.waitForTimeout(250);

const commandCenterPath = resolve(outDir, 'issue-114-command-center.png');
await page.getByTestId('kefine-command-center').screenshot({ path: commandCenterPath });
console.log('saved', commandCenterPath);

await page.getByTestId('kefine-solver-select-trigger').click();
await page.getByTestId('kefine-solver-metrics-dialog').waitFor();
await page.waitForTimeout(250);

const modalPath = resolve(outDir, 'issue-114-solver-modal.png');
await page.getByTestId('kefine-solver-metrics-dialog').screenshot({ path: modalPath });
console.log('saved', modalPath);
console.log(`captured ${exampleRepo}`);

await context.close();
await browser.close();
