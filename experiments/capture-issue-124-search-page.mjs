import { chromium } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';
const fixtureOrders = [
  {
    id: 'order-redis',
    title: 'Redis backup script',
    description: 'Automate Redis snapshots and restore checks',
    status: 'completed',
    solver: 'Storage Solver',
    createdAt: '2026-03-20T00:00:00.000Z',
    executionEstimate: 'about 2 hours',
    currency: 'USDC',
    actorHandle: 'staff',
    shareId: 'redis-backup'
  },
  {
    id: 'order-ci',
    title: 'CI rollback checklist',
    description: 'Rollback failed deploys from CI',
    status: 'queued',
    solver: 'Release Solver',
    createdAt: '2026-03-21T00:00:00.000Z',
    executionEstimate: 'about 1 hour',
    currency: 'USDC',
    actorHandle: 'staff',
    shareId: 'ci-rollback'
  }
];

async function prepare(page) {
  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}'
    });
  });
}

async function capture({ path, routePath, viewport }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  await page.addInitScript((orders) => {
    window.localStorage.clear();
    window.localStorage.setItem('kefine-theme', 'light');
    window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify(orders));
  }, fixtureOrders);
  await prepare(page);
  await page.goto(new URL(routePath, baseURL).toString(), { waitUntil: 'networkidle' });
  await page.getByTestId('kefine-search-page-results').waitFor({ state: 'visible' });
  await page.waitForTimeout(500);
  await page.screenshot({ path, fullPage: false });
  await browser.close();
}

await capture({
  path: 'docs/screenshots/issue-124-search-page-desktop.png',
  routePath: '/?q=redis%20backup',
  viewport: { width: 1440, height: 900 }
});

await capture({
  path: 'docs/screenshots/issue-124-search-page-mobile.png',
  routePath: '/@staff?q=ci%20rollback',
  viewport: { width: 390, height: 844 }
});
