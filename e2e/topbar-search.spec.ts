import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Topbar search', () => {
  test('home screen keeps the sidebar focused on brand and legal links', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-brand-mark').click();

    await expect(page.locator('kefine-sidebar-popover kefine-sidebar-nav')).toBeVisible();
    await expect(page.locator('kefine-sidebar-nav a[data-part="link"] svg')).toHaveCount(2);
    await expect(page.getByTestId('kefine-topbar-theme-toggle')).toHaveCount(0);
    await expect(page.getByTestId('kefine-topbar-locale-toggle')).toHaveCount(0);
  });

  test('opens from the header and finds a queued lepo', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Need Redis backup script');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

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
    await createTask(page, 'Open widget command palette');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

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

    // The proxy / VPN widget is reachable from the same palette by query.
    await page.getByTestId('kefine-topbar-search-widget-back').click();
    await page.getByTestId('kefine-topbar-search-input').fill('vpn');
    await page.getByTestId('kefine-topbar-search-result-widget-proxy').click();
    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveAttribute(
      'data-widget',
      'proxy'
    );
    await expect(page.getByTestId('kefine-proxy-widget')).toBeVisible();
  });
});
