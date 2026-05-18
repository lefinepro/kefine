import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Issue 63 task results', () => {
  test('shows recognized mini proxy tasks as a separate solver results page', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Нужен мини прокси на go');
    await expect(page).toHaveURL(/\/order-1$/);

    const taskRow = page.locator('kefine-solver-results kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow.getByText('go-proxy: api')).toBeVisible();
    await expect(taskRow.locator('kefine-solver-search-indicator')).toBeVisible();

    const activeTask = page.locator('lef-tasks-aside-item[data-active="true"]');
    await expect(activeTask.getByText('go-proxy: api')).toBeVisible();
    await activeTask.hover();
    await expect(activeTask.getByText('Your task')).toBeVisible();

    const solutionList = page.locator('lef-solutions-list');
    await expect(solutionList.getByText('Go Proxy Basic', { exact: true })).toBeVisible();
    await expect(solutionList.getByText('Go Proxy Pro', { exact: true })).toBeVisible();
    await expect(solutionList.getByText('Go Reverse Proxy', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'View code' }).first().click();
    await expect(page).toHaveURL(/\/order\/order-1\/solver\/5$/);
    await expect(page.getByRole('button', { name: 'Apply' })).toBeVisible();
  });
});
