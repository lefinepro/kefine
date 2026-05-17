import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

async function loadChromium() {
  const candidates = [
    'playwright',
    '/home/box/.nvm/versions/node/v20.20.2/lib/node_modules/playwright/index.js'
  ];
  for (const id of candidates) {
    try {
      const mod = require(id);
      const browser = await mod.chromium.launch();
      await browser.close();
      return mod.chromium;
    } catch {
      // try next candidate
    }
  }
  throw new Error('No working playwright installation found. Run "npx playwright install chromium".');
}

const chromium = await loadChromium();
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots/issue-63');
mkdirSync(outDir, { recursive: true });

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const VIEWPORT = { width: 1440, height: 900 };

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 1
});
const page = await context.newPage();

// ---------- API mocks (mirrors e2e/helpers/kefine.ts) ----------
await page.route('**/api/health', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, status: 'healthy' })
  });
});

let createCounter = 0;
const orders = new Map();

function buildOrder(id, title) {
  return {
    orderId: id,
    title,
    status: 'queued',
    solver: 'Test Solver',
    description: title,
    executionEstimate: 'about 2 hours',
    estimatedCost: 42,
    currency: 'USDC',
    paymentUrl: null,
    ownerUsername: 'pavel',
    ownerDisplayName: 'pavel',
    actorHandle: 'pavel',
    vcsEnabled: false,
    shareId: id,
    isPublicTask: false,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z'
  };
}

let createDelayMs = 0;
await page.route('**/create', async (route) => {
  createCounter += 1;
  const postData = route.request().postDataJSON() || {};
  const title = postData.title ?? postData.name ?? `Task ${createCounter}`;
  const order = buildOrder(`order-${createCounter}`, title);
  orders.set(order.orderId, order);
  if (createDelayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, createDelayMs));
  }
  await route.fulfill({
    status: 202,
    contentType: 'application/json',
    body: JSON.stringify({
      accepted: true,
      orderId: order.orderId,
      status: order.status,
      solver: order.solver,
      paymentUrl: null
    })
  });
});

async function orderLookup(route) {
  if (route.request().resourceType() === 'document') {
    await route.fallback();
    return;
  }
  const url = new URL(route.request().url());
  const segments = url.pathname.split('/').filter(Boolean);
  const last = segments.at(-1) ?? '';
  const orderId = decodeURIComponent(
    last === 'document' || last === 'settings' ? (segments.at(-2) ?? '') : last
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
    body: JSON.stringify(order)
  });
}

await page.route('**/order/**', orderLookup);
await page.route('**/status/**', orderLookup);

await page.route('**/api/kefine/templates/**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});

async function shoot(name, locator) {
  const path = resolve(outDir, name);
  if (locator) {
    await locator.screenshot({ path });
  } else {
    await page.screenshot({ path });
  }
  console.log(`saved ${path}`);
}

// ---------- 0: Initial main page ----------
await page.goto(BASE_URL + '/');
await page.waitForSelector('[data-testid="kefine-task-input"]');
await shoot('00-main-page.png');

// ---------- 4: Focused task input (calmer backlight) ----------
const input = page.locator('[data-testid="kefine-task-input"]');
await input.click();
await shoot('04-input-focused-empty.png');

// ---------- 5: Long text wraps inside the input ----------
const longTask = 'Refactor the kefine create page to remove repeated copy and add tests for the solver state reset so that a fresh task no longer renders stale solutions from the previous one even when the placeholder cycle is still running in the background.';
await input.fill(longTask);
await shoot('05-input-long-text-wraps.png');

// ---------- 10: Arrow animation while task in flight ----------
// Delay /create so the home page lingers on the in-flight search row with the
// flying arrow before SvelteKit navigates to /order/<id>.
createDelayMs = 6000;
await input.fill('hello world rust example');
await input.press('Enter');
await page.waitForSelector('lef-flying-arrow', { timeout: 5000 }).catch(() => undefined);
await page.waitForTimeout(400);
await shoot('10-arrow-animation.png');

// ---------- 2: Order overview as a separate page after submit ----------
createDelayMs = 0;
await page.waitForURL(/\/order\//, { timeout: 15000 }).catch(() => undefined);
await page.waitForTimeout(1500);
await shoot('02-task-screen-separate-page.png');

// ---------- 6 (default): Tasks aside shows <repo>: <author> ----------
const aside = page.locator('lef-tasks-aside').first();
if (await aside.count()) {
  await shoot('06-task-list-default.png', aside);
}

// ---------- 6 (hover): swaps to "Your task" ----------
const asideItem = page.locator('lef-tasks-aside-item').first();
if (await asideItem.count()) {
  await asideItem.hover();
  await page.waitForTimeout(200);
  await shoot('06-task-list-hover-your-task.png', aside);
}

// ---------- Repository rail (item 2 detail) ----------
const rail = page.locator('lef-task-rail').first();
if (await rail.count()) {
  await shoot('02-repository-rail.png', rail);
}

// ---------- 1 / 9: Apply button + Testing tab on solver detail page ----------
await page.goto(BASE_URL + '/order/demo-task/solver/5');
await page.waitForSelector('.lef-merge-btn', { timeout: 15000 });
// In dev mode SvelteKit lazy-compiles routes. Give Vite a beat to finish chunk
// generation and Svelte to hydrate before we drive interactions on the page.
await page.waitForLoadState('domcontentloaded');
await page.waitForTimeout(2500);
await shoot('01-09-solver-detail-apply-and-testing.png');

// ---------- 3: Diff source view (no per-row stripes) ----------
// Click the Source tab via Playwright's locator (waits for actionability,
// scrolls into view, and dispatches a real trusted click so Svelte 5's
// delegated event handlers fire).
const sourceTab = page.getByRole('tab', { name: /source/i });
let activated = false;
for (let attempt = 0; attempt < 3 && !activated; attempt += 1) {
  try {
    await sourceTab.click({ timeout: 4000 });
    activated = await page.waitForSelector('lef-solver-source', { timeout: 3000 })
      .then(() => true)
      .catch(() => false);
  } catch {
    // Likely HMR-triggered execution-context loss in dev; pause and retry.
    await page.waitForTimeout(800);
  }
}
console.log('source view activated:', activated);

await page.waitForTimeout(700);
await shoot('03-diff-no-stripes.png');

// ---------- 8: solver state reset — go back to create, then submit a new task ----------
await page.goto(BASE_URL + '/');
await page.waitForSelector('[data-testid="kefine-task-input"]');
const input2 = page.locator('[data-testid="kefine-task-input"]');
await input2.fill('first task');
await input2.press('Enter');
await page.waitForTimeout(800);
await shoot('08-before-reset-first-task.png');
// Navigate back to home, the reset effect should clear taskCompleted next time.
await page.goto(BASE_URL + '/');
await page.waitForSelector('[data-testid="kefine-task-input"]');
const input3 = page.locator('[data-testid="kefine-task-input"]');
await input3.fill('a different second task');
await page.waitForTimeout(300);
await shoot('08-after-reset-second-task.png');

await browser.close();
console.log('done');
