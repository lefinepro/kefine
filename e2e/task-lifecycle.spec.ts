import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

function normalizeFontFamily(value: string) {
  return value.replaceAll('"', '').replaceAll("'", '').replaceAll(/\s*,\s*/g, ', ').trim();
}

test.describe('Task Lifecycle', () => {
  test('brand mark uses the shared magical lefine font token', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    const brandMark = page.getByTestId('kefine-brand-mark');
    await expect(brandMark).toBeVisible();

    const fontData = await brandMark.evaluate((node) => {
      const element = node as HTMLElement;
      return {
        brandFontToken: getComputedStyle(document.documentElement).getPropertyValue('--kef-font-family-brand').trim(),
        brandFontFamily: getComputedStyle(element).fontFamily
      };
    });

    expect(normalizeFontFamily(fontData.brandFontToken)).toBe('Papyrus, Copperplate, Apple Chancery, fantasy');
    expect(normalizeFontFamily(fontData.brandFontFamily)).toBe(normalizeFontFamily(fontData.brandFontToken));
  });

  test('create task -> reach result -> reopen stages', async ({ page }) => {
    const api = await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Optimize database queries');

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Optimize database queries' })).toBeVisible();
    await expect(page.getByTestId('kefine-subtask-list')).toBeVisible();
    await expect(page.getByTestId('kefine-price-metric')).toBeVisible();

    await page.getByTestId('kefine-anonymous-tile').click();
    await expect(page.getByTestId('kefine-anonymous-payment')).toBeVisible();
    await expect(page.getByTestId('kefine-result-panel')).toBeVisible();
    await expect(page.getByTestId('kefine-save-result')).toBeVisible();

    api.setOrderStatus('order-1', 'completed');
    await page.getByRole('button', { name: 'View stages' }).click();

    await expect(page).toHaveURL(/#\/orders\/order-1\/stages$/);
    await expect(page.getByTestId('kefine-subtask-list')).toBeVisible();
    await expect(page.getByTestId('kefine-result-panel')).toHaveCount(0);
  });

  test('shift+enter keeps create screen while optimistic item is replaced by real order', async ({ page }) => {
    const api = await mockOrderApi(page);
    api.setCreateDelay(1200);
    await gotoAndWaitForReady(page);

    const input = page.getByTestId('kefine-task-input');
    await input.fill('Temporary optimistic order');
    await input.press('Shift+Enter');

    const optimisticRow = page.locator('[data-order-id^="temp-"]').first();
    await expect(optimisticRow).toBeVisible();
    await expect(page).toHaveURL(/\/$/);

    await page.waitForFunction(() => {
      const raw = window.localStorage.getItem('kefine-created-orders-v1');
      return raw && raw.includes('temp-');
    });

    const realRow = page.locator('[data-order-id="order-1"]');
    await expect(realRow).toBeVisible();
    await expect(realRow.getByTestId('kefine-order-eta-order-1')).toContainText('about 2 hours');

    const storedAfter = await page.evaluate(() => window.localStorage.getItem('kefine-created-orders-v1'));
    expect(storedAfter).not.toContain('temp-');
    expect(storedAfter).toContain('order-1');

    await realRow.getByTestId('kefine-open-order-order-1').click();
    await expect(page).toHaveURL(/#\/orders\/order-1$/);
  });

  test('reloading a persisted order route keeps the executing flow mounted', async ({ page }) => {
    const api = await mockOrderApi(page);
    api.setCreateDelay(250);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Persisted route order');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.reload();

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Persisted route order' })).toBeVisible();
    await expect(page.getByTestId('kefine-wallet-tile')).toBeVisible();
  });

  test('executing flow shows fallback solver info and hides standalone promo block', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Build a landing page');

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByTestId('kefine-solver-fallback')).toBeVisible();
    await expect(page.getByTestId('kefine-promo-toggle')).toHaveCount(0);
    await expect(page.getByTestId('kefine-promo-input')).toHaveCount(0);
  });
});
