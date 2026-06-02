import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('New frontend task results', () => {
  test('submitted Go proxy task opens solvers as a task list with variants', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Нужен мини прокси на go');
    await page.getByTestId('kefine-task-input').press('Enter');

    const taskRow = page.getByTestId('kefine-solver-search-row');
    await expect(taskRow).toBeVisible();
    await expect(taskRow).toContainText('Нужен мини прокси на go');
    await expect(taskRow).not.toContainText('@kefine/go-proxy');
    await expect(page.getByTestId('kefine-inline-solver-list')).toHaveCount(0);

    const openSolvers = page.getByRole('button', { name: 'Open solver list' });
    await expect(openSolvers).toBeEnabled({ timeout: 6000 });
    await expect(taskRow).toContainText('@kefine/go-proxy');
    await openSolvers.click();

    await expect(page).toHaveURL(/\/order\/order-1\/solutions/);
    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    // The repository name now lives in the header search bar instead of a right-side card.
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toContainText('@kefine/go-proxy');
    await expect(page.getByTestId('solver-task-list')).toBeVisible();
    // The repository README and checklist are rendered by default on the main
    // screen, while settings move to the right-rail modal and folder layout is
    // not part of the main content.
    await expect(page.getByTestId('repo-readme')).toBeVisible();
    await expect(page.getByTestId('repo-readme-title')).toContainText('@kefine/go-proxy');
    await expect(page.getByTestId('repo-brief')).toBeVisible();
    await expect(page.getByTestId('repo-brief-label')).toHaveCount(0);
    await expect(page.getByTestId('repo-readme')).not.toContainText('Live demo app');
    await expect(page.getByTestId('repo-demonstration')).toContainText('Live demo app');
    await expect(page.getByTestId('repo-readme')).not.toContainText('Settings');
    await expect(page.getByTestId('repo-readme')).not.toContainText('Folder layout');
    await expect(page.getByTestId('repo-checklist')).toBeVisible();
    await expect(page.getByTestId('solver-task-list').getByText('TODO', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('repo-checklist-item')).toHaveCount(4);
    await expect(page.getByTestId('repo-checklist-status').first()).toContainText('Open');
    await expect(page.getByTestId('repo-checklist-status').last()).toContainText('Done');
    const checklistBox = await page.getByTestId('repo-checklist').boundingBox();
    const demonstrationBox = await page.getByTestId('repo-demonstration').boundingBox();
    expect(demonstrationBox?.y ?? 0).toBeGreaterThan(checklistBox?.y ?? 0);
    await expect(page.getByTestId('task-toggle-active')).toHaveCount(0);
    await expect(page.locator('lef-solutions-list')).toHaveCount(0);
    // The right rail keeps clone controls and exposes repository settings from
    // an icon-triggered modal, then shows solvers when the checklist has a completed item.
    await expect(page.getByTestId('solver-clone-rail')).toBeVisible();
    await page.getByTestId('repo-settings-trigger').click();
    await expect(page.getByTestId('repo-settings-dialog')).toBeVisible();
    await expect(page.getByTestId('repo-settings-dialog')).toContainText('Default branch');
    await page.getByRole('button', { name: 'Close repository settings' }).click();
    await expect(page.getByTestId('todo-solvers-block')).toBeVisible();
    await expect(page.getByTestId('completed-todo-source')).toContainText('Project scaffolding');
    await expect(page.getByTestId('task-solver-variants')).toBeVisible();
    await expect(page.getByTestId('task-solver-variants').locator('[data-variant]')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Apply solution' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });

  test('solver detail topbar uses Apply instead of Merge', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    await expect(page.getByRole('button', { name: 'Apply solution' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
  });

  test('right rail solver block shows solver avatars and lets you choose a variant', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solutions?task=Build%20a%20Go%20mini%20proxy');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    await expect(page.locator('lef-tasks-aside')).toHaveCount(0);
    await expect(page.getByTestId('task-toggle-active')).toHaveCount(0);
    await expect(page.getByTestId('todo-solvers-block')).toBeVisible();

    // Completed checklist work unlocks the right-rail solver variants.
    const variants = page.getByTestId('task-solver-variants');
    await expect(variants).toBeVisible();

    // Each solver renders a small avatar with deterministic initials.
    await expect(variants.locator('[data-variant="5"] lef-solver-avatar')).toHaveText('GB');
    await expect(variants.locator('[data-variant="6"] lef-solver-avatar')).toHaveText('GP');

    // Choosing a variant opens that solver's detail page.
    await variants.getByRole('button', { name: /Go Proxy Pro/ }).click();
    await expect(page).toHaveURL(/\/order\/order-1\/solver\/6/);
  });
});
