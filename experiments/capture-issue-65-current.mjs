import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots');
const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });

function orderPayload(order) {
  return {
    orderId: order.id,
    title: order.title,
    status: order.status,
    solver: 'Test Solver',
    description: order.title,
    executionEstimate: 'about 2 hours',
    estimatedCost: 42,
    currency: 'USDC',
    paymentUrl: null,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    ownerUsername: 'api',
    ownerDisplayName: 'API',
    actorHandle: 'api',
    vcsEnabled: false,
    shareId: order.id,
    isPublicTask: false
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

  await page.route('**/api/kefine/templates/api', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/create', async (route) => {
    createCounter += 1;
    const postData = route.request().postDataJSON();
    const title = postData.title ?? postData.name ?? `Task ${createCounter}`;
    const order = {
      id: `order-${createCounter}`,
      title,
      status: 'queued'
    };
    orders.set(order.id, order);

    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        accepted: true,
        orderId: order.id,
        status: order.status,
        solver: 'Test Solver',
        paymentUrl: null
      })
    });
  });

  await page.route('**/status/**', async (route) => {
    const url = new URL(route.request().url());
    const segments = url.pathname.split('/').filter(Boolean);
    const orderId = decodeURIComponent(
      segments.at(-1) === 'document' || segments.at(-1) === 'settings'
        ? segments.at(-2) ?? ''
        : segments.at(-1) ?? ''
    );
    const order = orders.get(orderId);

    if (!order) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Order not found', orderId })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(orderPayload(order))
    });
  });
}

async function gotoAndWaitForReady(page) {
  await page.goto(baseURL);
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await page.getByTestId('kefine-task-input').waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
}

async function screenshot(page, filename) {
  const path = resolve(outDir, filename);
  await page.screenshot({ path, fullPage: true });
  console.log(`saved ${path}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1
});
const page = await context.newPage();

await mockOrderApi(page);
await gotoAndWaitForReady(page);

await page.getByTestId('kefine-task-input').fill('Нужен мини прокси на go');
await page.getByTestId('kefine-task-input').press('Enter');

const taskRow = page.getByTestId('kefine-solver-search-row');
await taskRow.waitFor({ state: 'visible' });
await page.waitForTimeout(350);
await screenshot(page, 'issue-65-home-search-active.png');

await page.getByRole('button', { name: 'Open solver list' }).waitFor({ state: 'visible', timeout: 6000 });
await screenshot(page, 'issue-65-home-task-row.png');

await taskRow.hover();
await page.waitForTimeout(150);
await screenshot(page, 'issue-65-home-task-row-hover.png');

await page.getByRole('button', { name: 'Open solver list' }).click();
await page.getByTestId('solution-list-page').waitFor({ state: 'visible' });
await screenshot(page, 'issue-65-solvers-page.png');

await page.getByRole('link', { name: /View .* source/ }).first().click();
await page.getByRole('tab', { name: 'Testing' }).waitFor({ state: 'visible' });
await screenshot(page, 'issue-65-solver-detail.png');

await page.getByRole('tab', { name: 'Source' }).click();
await page.waitForTimeout(150);
await screenshot(page, 'issue-65-solver-source.png');

await browser.close();
