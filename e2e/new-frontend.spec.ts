import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

const EXAMPLE_REPO = '@example/proxy-on-go/release';

test.describe('New frontend task results', () => {
  test('command center keeps search in the header and opens solver charts from the test block', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await expect(page.getByTestId('kefine-command-center')).toBeVisible();
    await expect(page.getByTestId('kefine-command-center')).toHaveCSS('animation-name', /repo-command-enter/);
    await expect(page.getByTestId('kefine-header-search')).toBeVisible();
    await expect(page.getByTestId('kefine-header-search')).toHaveAttribute('data-search-active', 'false');
    await expect(page.getByTestId('kefine-task-input')).toHaveAttribute(
      'placeholder',
      `${EXAMPLE_REPO}#Make a go Proxy`
    );
    await expect(page.getByTestId('kefine-header-search-status')).toContainText(EXAMPLE_REPO);
    await expect(page.getByTestId('kefine-test-block').locator('input, textarea')).toHaveCount(0);

    const repoApply = page.getByTestId('kefine-repo-apply');
    await expect(repoApply).toHaveAttribute('data-tone', 'success');
    const applyBackground = await repoApply.evaluate((element) => getComputedStyle(element).backgroundColor);
    const applyRgb = applyBackground.match(/\d+(\.\d+)?/g)?.map(Number) ?? [];
    expect(applyRgb[1]).toBeGreaterThan(applyRgb[0]);
    expect(applyRgb[1]).toBeGreaterThan(applyRgb[2]);
    const tabsRadius = await page.locator('.repo-tabs').evaluate((element) => parseFloat(getComputedStyle(element).borderRadius));
    expect(tabsRadius).toBeLessThanOrEqual(4);

    await page.getByRole('button', { name: 'Make a go Proxy' }).first().click();

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText(EXAMPLE_REPO);
    await expect(taskRow).toContainText('Make a go Proxy');
    await expect(page.getByTestId('kefine-header-search')).toHaveAttribute('data-search-active', 'true');
    await expect(page.getByTestId('kefine-header-search')).toHaveAttribute('data-search-completed', 'true', {
      timeout: 6000
    });
    await expect(page.getByTestId('kefine-task-input')).toHaveValue(`${EXAMPLE_REPO}#Make a go Proxy`);
    await expect(page.getByTestId('kefine-test-block').locator('input, textarea')).toHaveCount(0);

    const selectSolver = page.getByTestId('kefine-solver-select-trigger');
    await expect(selectSolver).toBeEnabled({ timeout: 6000 });
    await selectSolver.click();

    const dialog = page.getByTestId('kefine-solver-metrics-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Select solver' })).toBeVisible();
    await expect(dialog.getByTestId('kefine-solver-options')).toContainText('Dragon A');
    await expect(dialog.getByLabel('Execution time chart')).toBeVisible();
    await expect(dialog.getByLabel('Solution weight chart')).toBeVisible();
    await expect(dialog.locator('video')).toHaveCount(0);
  });

  test('submitted Go proxy task stays in the command center and uses the solver modal', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Нужен мини прокси на go');
    await page.getByTestId('kefine-task-input').press('Enter');

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText('Нужен мини прокси на go');
    await expect(page.getByTestId('kefine-inline-solver-list')).toHaveCount(0);

    const selectSolver = page.getByTestId('kefine-solver-select-trigger');
    await expect(selectSolver).toBeEnabled({ timeout: 6000 });
    await selectSolver.click();

    await expect(page).not.toHaveURL(/\/solutions/);
    await expect(page.getByTestId('solution-list-page')).toHaveCount(0);
    await expect(page.getByTestId('kefine-solver-metrics-dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });

  test('solver detail topbar uses Apply instead of Merge', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    await expect(page.getByRole('button', { name: 'Apply solution' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });
});
