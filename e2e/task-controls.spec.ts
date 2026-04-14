import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Task Controls', () => {
  test('desktop stop keeps task stopped in the shared list', async ({ page }) => {
    const api = await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Need access to Telegram');
    await page.getByTestId('kefine-task-input').press('Shift+Enter');

    const row = page.locator('[data-order-id="order-1"]');
    await expect(row).toBeVisible();
    await row.getByTestId('kefine-stop-order-order-1').dispatchEvent('click');
    await expect(row).toHaveAttribute('data-status', 'stopped');

    api.setOrderStatus('order-1', 'completed');
    await page.waitForTimeout(1800);
    await expect(row).toHaveAttribute('data-status', 'stopped');
  });

  test('mobile long press stops task without horizontal overflow', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'pointer duration checks are only asserted on chromium project setup');

    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    const input = page.getByTestId('kefine-task-input');
    await input.fill('A very long background task title that should still wrap correctly on very narrow screens');
    await input.press('Shift+Enter');

    const row = page.locator('[data-order-id="order-1"]');
    await expect(row).toBeVisible();

    const stopButton = row.getByTestId('kefine-stop-order-order-1');
    await stopButton.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
    await page.waitForTimeout(650);
    await stopButton.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
    await expect(row).toHaveAttribute('data-status', 'stopped');

    const scrollWidth = await page.locator('body').evaluate((node) => node.scrollWidth);
    const clientWidth = await page.locator('body').evaluate((node) => node.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
  });
});
