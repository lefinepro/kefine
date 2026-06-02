import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Topbar search', () => {
  test('opens from the header and finds a queued lepo', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Need Redis backup script');
    await page.getByTestId('kefine-task-input').press('Shift+Enter');

    await expect(page.locator('[data-order-id="order-1"]')).toBeVisible();

    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-input')).toBeFocused();

    await page.getByTestId('kefine-topbar-search-input').fill('redis');

    const result = page.getByTestId('kefine-topbar-search-result-order-1');
    await expect(result).toBeVisible();
    await expect(result).toContainText('Need Redis backup script');

    await result.click();
    await expect(page).toHaveURL(/(\/order\/order-1|\/@api\/order-1)$/);
  });

  test('surfaces developed widgets inline from the command palette', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();

    await page.getByTestId('kefine-topbar-search-input').fill('weather');

    const weatherResult = page.getByTestId('kefine-topbar-search-result-widget-weather');
    await expect(weatherResult).toBeVisible();
    await weatherResult.click();

    // The widget renders inline without leaving the page.
    const widgetHost = page.getByTestId('kefine-topbar-search-widget');
    await expect(widgetHost).toHaveAttribute('data-widget', 'weather');
    await expect(page.getByTestId('kefine-weather-widget')).toBeVisible();
    await expect(page).not.toHaveURL(/\/order\//);

    // Back returns to the results list, keeping the palette open.
    await page.getByTestId('kefine-topbar-search-widget-back').click();
    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveCount(0);
    await expect(page.getByTestId('kefine-topbar-search-result-widget-translate')).toBeVisible();

    // The translator widget is reachable from the same palette.
    await page.getByTestId('kefine-topbar-search-input').fill('translate');
    await page.getByTestId('kefine-topbar-search-result-widget-translate').click();
    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveAttribute(
      'data-widget',
      'translate'
    );
    await expect(page.getByTestId('kefine-translator-widget')).toBeVisible();
  });
});
