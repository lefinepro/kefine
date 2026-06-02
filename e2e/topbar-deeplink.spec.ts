import { expect, test } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

// Clears persisted state, then lands on a deep link.
async function gotoDeepLink(page: import('@playwright/test').Page, path: string) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto(path);
}

test.describe('Search deep links', () => {
  test('opens the search page seeded from the ?q= search URL', async ({ page }) => {
    await mockOrderApi(page);
    await gotoDeepLink(page, '/?q=redis');

    await expect(page.getByTestId('kefine-search-page-input')).toBeVisible();
    await expect(page.getByTestId('kefine-search-page-input')).toHaveValue('redis');
    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-page-results')).toHaveAttribute(
      'data-mode',
      'anonymous'
    );
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveCount(0);
    await expect(page.getByTestId('kefine-topbar-search-dialog')).not.toBeVisible();
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
