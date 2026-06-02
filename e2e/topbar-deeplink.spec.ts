import { expect, test } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

// Clears persisted state, then lands on a deep link so the palette auto-opens.
async function gotoDeepLink(page: import('@playwright/test').Page, path: string) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto(path);
  await expect(page.getByTestId('kefine-task-input')).toBeVisible();
}

test.describe('Search deep links', () => {
  test('opens the palette seeded from the ?q= search URL', async ({ page }) => {
    await mockOrderApi(page);
    await gotoDeepLink(page, '/?q=redis');

    const dialog = page.getByTestId('kefine-topbar-search-dialog');
    await expect(dialog).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('redis');
  });

  test('opens the weather widget from a profile short link', async ({ page }) => {
    await mockOrderApi(page);
    await gotoDeepLink(page, '/@api/weather');

    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveAttribute(
      'data-widget',
      'weather'
    );
    await expect(page.getByTestId('kefine-weather-widget')).toBeVisible();
  });

  test('opens the translator widget from a profile short link alias', async ({ page }) => {
    await mockOrderApi(page);
    await gotoDeepLink(page, '/@api/translator');

    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveAttribute(
      'data-widget',
      'translate'
    );
    await expect(page.getByTestId('kefine-translator-widget')).toBeVisible();
  });
});
