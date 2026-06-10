import { expect, test } from '@playwright/test';

import { authenticate, gotoAndWaitForReady, mockOrderApi, waitForHydratedElement } from './helpers/kefine';

test.describe('New frontend task results', () => {
  test('submitted Go proxy task opens solvers as a task list with variants', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);
    await authenticate(page);

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

    await expect(page).toHaveURL(/\/@api\/order-1\?task=/);
    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    // The repository name now lives in the header search bar instead of a right-side card.
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveAttribute('data-context', 'project');
    await expect(page.getByTestId('kefine-topbar-search-context')).toHaveText('@kefine/go-proxy');
    await expect(page.getByTestId('solver-task-list')).toBeVisible();
    // The repository README and checklist are rendered by default on the main
    // screen, while settings move to the topbar modal and folder layout is
    // not part of the main content.
    await expect(page.getByTestId('repo-readme')).toBeVisible();
    await expect(page.getByTestId('repo-readme-title')).toContainText('@kefine/go-proxy');
    await expect(page.getByTestId('repo-brief')).toBeVisible();
    await expect(page.getByTestId('repo-brief-label')).toHaveCount(0);
    await expect(page.getByTestId('repo-readme')).not.toContainText('Live demo app');
    await expect(page.getByTestId('repo-demonstration')).toHaveCount(0);
    await expect(page.getByTestId('repo-readme')).not.toContainText('Settings');
    await expect(page.getByTestId('repo-readme')).not.toContainText('Folder layout');
    await expect(page.getByTestId('repo-checklist')).toBeVisible();
    await expect(page.getByTestId('repo-checklist-item')).toHaveCount(4);
    await expect(page.getByTestId('repo-checklist-item').nth(0)).toHaveAttribute('data-state', 'todo');
    await expect(page.getByTestId('repo-checklist-item').nth(1)).toHaveAttribute('data-state', 'in-progress');
    await expect(page.getByTestId('repo-checklist-item').last()).toHaveAttribute('data-state', 'done');
    await expect(page.locator('lef-repo-todo-status')).toHaveCount(0);
    await expect(page.getByTestId('repo-checklist-status').nth(0)).toHaveAttribute('title', 'TODO');
    await expect(page.getByTestId('repo-checklist-status').nth(1)).toHaveAttribute('title', 'IN PROGRESS');
    await expect(page.getByTestId('repo-checklist-status').last()).toHaveAttribute('title', 'DONE');
    await expect(page.getByTestId('task-toggle-active')).toHaveCount(0);
    await expect(page.locator('lef-solutions-list')).toHaveCount(0);
    // Clone and repository settings now live as icons beside the shared header search.
    await expect(page.getByTestId('solver-clone-rail')).toHaveCount(0);
    await expect(page.getByTestId('repo-clone-trigger')).toBeVisible();
    await expect(page.getByTestId('repo-clone-trigger')).toHaveAttribute('data-icon', 'download');
    await page.getByTestId('repo-clone-trigger').click();
    await expect(page).toHaveURL(/[?&]view=clone/);
    await expect(page.getByTestId('repo-clone-page')).toBeVisible();
    await expect(page.getByTestId('repo-clone-page')).toContainText(
      'git clone https://kefine.pro/kefine/go-proxy.git'
    );
    await expect(page.getByTestId('repo-clone-copy')).toBeVisible();
    await page.getByRole('link', { name: 'Back to repository' }).click();
    await expect(page).not.toHaveURL(/[?&]view=clone/);
    await expect(page.getByTestId('repo-readme')).toBeVisible();

    await expect(page.getByTestId('repo-settings-trigger')).toBeVisible();
    await page.getByTestId('repo-settings-trigger').click();
    await expect(page).toHaveURL(/[?&]view=settings/);
    await expect(page.getByTestId('repo-settings-page')).toBeVisible();
    await expect(page.getByTestId('repo-settings-page')).toContainText('Default branch');
    await expect(page.getByTestId('repo-settings-dialog')).toHaveCount(0);
    await page.getByRole('link', { name: 'Back to repository' }).click();
    await expect(page).not.toHaveURL(/[?&]view=settings/);
    await expect(page.getByTestId('todo-solvers-block')).toHaveCount(0);
    await expect(page.getByTestId('todo-solver-select')).toHaveCount(4);
    await expect(page.getByTestId('todo-solver-select').first()).not.toContainText('Go Proxy Basic');
    await expect(page.getByTestId('todo-solver-select').first().locator('lef-solver-avatar')).toHaveText('GB');
    await expect(page.locator('lef-todo-solver-chevron')).toHaveCount(0);
    await page.getByTestId('todo-solver-select').first().click();
    await expect(page.getByTestId('task-solver-variants')).toBeVisible();
    await expect(page.getByTestId('task-solver-variants').locator('[data-variant]')).toHaveCount(3);
    await expect(page.getByRole('button', { name: 'Apply solution' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);

    await expect(page.getByTestId('repo-new-task-row')).toBeVisible();
    await expect(page.getByTestId('repo-new-task-search')).toHaveCount(0);
    await page.getByTestId('repo-new-task-input').fill('Add gzip middleware');
    await page.getByTestId('repo-new-task-input').press('Enter');

    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('Add gzip middleware');
    const createTaskResult = page.getByTestId('kefine-topbar-search-result-create-task');
    await expect(createTaskResult).toBeVisible();
    await expect(createTaskResult).toContainText('Add gzip middleware');

    await createTaskResult.click();
    await expect(page.getByTestId('kefine-task-input')).toHaveValue('Add gzip middleware');
  });

  test('solver detail topbar uses Apply instead of Merge', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    await expect(page.getByRole('button', { name: 'Apply solution' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Merge/ })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tab', { name: 'Testing' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Checkpoints' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Source' })).toBeVisible();
    await expect(page.getByTestId('solution-overview')).toBeVisible();
    // The overview no longer carries a left solver sidebar or the metrics column;
    // solver switching now lives in the flying menu at the bottom of the page.
    await expect(page.getByTestId('solution-solver-sidebar')).toHaveCount(0);
    await expect(page.locator('lef-solver-metrics-col')).toHaveCount(0);
    await expect(page.locator('lef-task-head strong', { hasText: 'Task' })).toHaveCount(0);
  });

  test('solver detail page exposes a flying solver menu that switches solvers', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    // The flying-menu custom element must upgrade in the browser before its
    // trigger is usable.
    await waitForHydratedElement(page, 'flying-menu');

    const trigger = page.locator('flying-menu [slot="trigger"]');
    await expect(trigger).toBeVisible();

    // The collapsed trigger shows the specific solver icons it switches between.
    await expect(trigger.locator('lef-fm-stack-avatar')).toHaveCount(3);
    await expect(trigger.locator('lef-fm-stack-avatar').first()).toHaveText('GB');

    // The menu list is hidden until the trigger is tapped.
    const menu = page.getByTestId('solver-flying-menu');
    await expect(menu).toBeHidden();

    await trigger.click();
    await expect(menu).toBeVisible();
    await expect(menu).toContainText('Go Proxy Basic');
    await expect(menu).toContainText('Go Proxy Pro');

    // Choosing a different solver navigates to that solver's detail page.
    await menu.locator('[data-solver-id="6"]').click();
    await expect(page).toHaveURL(/\/order\/order-1\/solver\/6/);
  });

  test('solution source file search opens and filters modified files', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/order/order-1/solver/5');

    await waitForHydratedElement(page, '[data-testid="solution-view-tab-source"]');
    await page.getByTestId('solution-view-tab-source').click();
    await expect(page.getByTestId('solution-view-tab-source')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('solution-file-outline-item')).toHaveCount(3);

    await page.getByTestId('solution-file-search-trigger').click();
    await expect(page.getByTestId('solution-file-search-input')).toBeVisible();
    await expect(page.getByTestId('solution-file-search-input')).toBeFocused();
    const searchBox = await page.locator('lef-file-search').boundingBox();
    expect(searchBox).not.toBeNull();
    expect(searchBox!.height).toBeLessThanOrEqual(30);

    await page.getByTestId('solution-file-search-input').fill('config');
    await expect(page.getByTestId('solution-file-outline-item')).toHaveCount(1);
    await expect(page.getByTestId('solution-file-outline-item').first()).toContainText(
      'config.yaml'
    );

    await page.getByTestId('solution-file-outline-item').first().click();
    await expect(page.locator('lef-code-path')).toHaveText('config.yaml');
  });

  test('canonical profile order route opens the order page without a task query', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/@api/order-1');

    await expect(page).toHaveURL(/\/@api\/order-1$/);
    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    await expect(page.getByTestId('solver-task-list')).toBeVisible();
    await expect(page.getByTestId('repo-readme')).toBeVisible();
    await expect(page.getByTestId('repo-checklist')).toBeVisible();
  });

  test('checklist task solver selector shows avatars and lets you choose a variant', async ({ page }) => {
    await mockOrderApi(page);
    await page.goto('/@api/order-1?task=Build%20a%20Go%20mini%20proxy');
    await page.waitForLoadState('networkidle');

    await expect(page.getByTestId('solution-list-page')).toBeVisible();
    await expect(page.locator('lef-tasks-aside')).toHaveCount(0);
    await expect(page.getByTestId('task-toggle-active')).toHaveCount(0);
    await expect(page.getByTestId('todo-solvers-block')).toHaveCount(0);
    await expect(page.getByTestId('todo-solver-select')).toHaveCount(4);

    // Each checklist task owns a compact solver selector.
    await expect(page.getByTestId('todo-solver-select').first()).not.toContainText('Go Proxy Basic');
    await expect(page.getByTestId('todo-solver-select').first().locator('lef-solver-avatar')).toHaveText('GB');
    await page.getByTestId('todo-solver-select').first().click();
    const variants = page.getByTestId('task-solver-variants');
    await expect(variants).toBeVisible();
    const compareButton = page.getByTestId('open-solvers-compare');
    await expect(compareButton).toBeVisible();

    const compareBox = await compareButton.boundingBox();
    expect(compareBox, 'compare solvers button should render as a horizontal pill').not.toBeNull();
    expect(compareBox!.width).toBeGreaterThan(compareBox!.height * 2);
    expect(compareBox!.height).toBeLessThan(48);

    // Each solver renders a small avatar with deterministic initials.
    await expect(variants.locator('[data-variant="5"] lef-solver-avatar')).toHaveText('GB');
    await expect(variants.locator('[data-variant="6"] lef-solver-avatar')).toHaveText('GP');

    // Choosing a variant opens that solver's detail page.
    await variants.getByRole('button', { name: /Go Proxy Pro/ }).click();
    await expect(page).toHaveURL(/\/order\/order-1\/solver\/6/);
  });
});
