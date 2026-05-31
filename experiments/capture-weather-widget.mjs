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

async function capture({ path, viewport }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('kefine-theme', 'dark');
  });
  await prepare(page);
  await page.goto(baseURL);
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
  await page.getByTestId('kefine-task-input').fill('Погода Гомель');
  await page.getByTestId('kefine-weather-widget').waitFor({ state: 'visible' });
  await page.waitForTimeout(700);
  await page.screenshot({ path, fullPage: false });
  await browser.close();
}

await capture({
  path: 'docs/screenshots/issue-101-weather-widget-desktop.png',
  viewport: { width: 1440, height: 900 }
});

await capture({
  path: 'docs/screenshots/issue-101-weather-widget-mobile.png',
  viewport: { width: 390, height: 844 }
});
