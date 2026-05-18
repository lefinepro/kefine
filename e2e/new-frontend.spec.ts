import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('New frontend task results', () => {
  test('submitted Go proxy task opens solvers on a separate page with Apply actions', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Нужен мини прокси на go');
    await page.getByTestId('kefine-task-input').press('Enter');

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText('kefine/go-proxy');
    await expect(page.getByTestId('kefine-inline-solver-list')).toHaveCount(0);

    const openSolvers = page.getByRole('button', { name: 'Open solver list' });
    await expect(openSolvers).toBeEnabled({ timeout: 6000 });
    await openSolvers.click();

    await expect(page).toHaveURL(/\/order\/order-1\/solutions/);
    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    await expect(page.getByTestId('solution-list-task-label')).toContainText('kefine/go-proxy');
    await expect(page.getByRole('button', { name: 'Apply solution' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });

  test('solver detail topbar uses Apply instead of Merge', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    await expect(page.getByRole('button', { name: 'Apply solution' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });
});
