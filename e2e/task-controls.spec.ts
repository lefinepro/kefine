import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi, seedAuthSession } from './helpers/kefine';

test.describe('Task Controls', () => {
  test('expanded topbar menu does not overlap the create card on narrow chromium viewport', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'viewport geometry is asserted only on chromium');

    await mockOrderApi(page);
    await page.setViewportSize({ width: 453, height: 470 });
    await gotoAndWaitForReady(page);

    const brandMark = page.getByTestId('kefine-brand-mark');
    await brandMark.click();

    const menu = page.locator('kefine-sidebar-stack');
    await expect(menu).toBeVisible();

    const metrics = await page.evaluate(() => {
      const menu = document.querySelector('kefine-sidebar-stack') as HTMLElement | null;
      const createCard = document.querySelector('.kefine-card') as HTMLElement | null;
      const body = document.body;

      if (!menu || !createCard) {
        return null;
      }

      const menuRect = menu.getBoundingClientRect();
      const cardRect = createCard.getBoundingClientRect();

      return {
        menuRight: menuRect.right,
        menuBottom: menuRect.bottom,
        viewportWidth: window.innerWidth,
        cardLeft: cardRect.left,
        cardTop: cardRect.top,
        scrollWidth: body.scrollWidth,
        clientWidth: body.clientWidth
      };
    });

    expect(metrics).not.toBeNull();
    expect(metrics!.menuRight).toBeLessThanOrEqual(metrics!.viewportWidth);
    expect(metrics!.menuBottom).toBeLessThanOrEqual(metrics!.cardTop - 8);
    expect(metrics!.scrollWidth).toBeLessThanOrEqual(metrics!.clientWidth + 1);
  });

  test('desktop stop keeps task stopped in the shared list', async ({ page }) => {
    const api = await mockOrderApi(page);
    await seedAuthSession(page);
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
    await seedAuthSession(page);
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
