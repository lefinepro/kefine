import { chromium } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

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
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('kefine-theme', 'light');
  });
  await prepare(page);
  await page.goto(new URL(routePath, baseURL).toString(), { waitUntil: 'networkidle' });
  await page.getByTestId('kefine-search-page-mode').waitFor({ state: 'visible' });
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
