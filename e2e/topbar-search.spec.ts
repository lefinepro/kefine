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
});
