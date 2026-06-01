import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

const EXAMPLE_REPO = '@example/proxy-on-go/release';

test.describe('New frontend task results', () => {
  test('command center opens a demo video after creating the example proxy task', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await expect(page.getByTestId('kefine-command-center')).toBeVisible();
    await expect(page.getByTestId('kefine-repo-url')).toHaveValue(EXAMPLE_REPO);

    await page.getByRole('button', { name: 'Make a go Proxy' }).first().click();

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText(`${EXAMPLE_REPO}#Make a go Proxy`);

    const demoVideo = page.getByTestId('kefine-demo-video-trigger');
    await expect(demoVideo).toBeEnabled({ timeout: 6000 });
    await demoVideo.click();

    const dialog = page.getByTestId('kefine-demo-video-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Metrics' })).toBeVisible();
    await expect(dialog.locator('video')).toBeVisible();
    await expect(dialog.locator('video source')).toHaveAttribute('src', /\/assets\/issue-114-example-task\.webm$/);
  });

  test('submitted Go proxy task opens solvers on a separate page with Apply actions', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Нужен мини прокси на go');
    await page.getByTestId('kefine-task-input').press('Enter');

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText('Нужен мини прокси на go');
    await expect(taskRow).not.toContainText(EXAMPLE_REPO);
    await expect(page.getByTestId('kefine-inline-solver-list')).toHaveCount(0);

    const openSolvers = page.getByRole('button', { name: 'Open solver list' });
    await expect(openSolvers).toBeEnabled({ timeout: 6000 });
    await expect(taskRow).toContainText(EXAMPLE_REPO);
    await openSolvers.click();

    await expect(page).toHaveURL(/\/order\/order-1\/solutions/);
    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    await expect(page.getByTestId('solution-list-task-label')).toContainText(EXAMPLE_REPO);
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
