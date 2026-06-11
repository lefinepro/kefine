import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi, seedAuthSession } from './helpers/kefine';

function normalizeFontFamily(value: string) {
  return value.replaceAll('"', '').replaceAll("'", '').replaceAll(/\s*,\s*/g, ', ').trim();
}

const ORDER_ID = 'order-1';

test.describe('Task Lifecycle', () => {
  const exchangeNodeId = `${ORDER_ID}-exchange-search`;

  test('brand mark uses the shared site font token', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    const brandMark = page.getByTestId('kefine-brand-mark');
    await expect(brandMark).toBeVisible();

    const fontData = await brandMark.evaluate((node) => {
      const element = node as HTMLElement;
      return {
        appFontToken: getComputedStyle(document.documentElement).getPropertyValue('--kef-font-family').trim(),
        brandFontToken: getComputedStyle(document.documentElement).getPropertyValue('--kef-font-family-brand').trim(),
        brandFontFamily: getComputedStyle(element).fontFamily
      };
    });

    expect(normalizeFontFamily(fontData.brandFontToken)).toBe(normalizeFontFamily(fontData.appFontToken));
    expect(normalizeFontFamily(fontData.brandFontFamily)).toBe(normalizeFontFamily(fontData.brandFontToken));
  });

  test('create task -> reach result -> reopen stages', async ({ page }) => {
    const api = await mockOrderApi(page);
    await seedAuthSession(page);
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
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await expect(page.locator("button[data-part='auth']")).toHaveAttribute(
      'data-authenticated',
      'true'
    );

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
    await expect(realRow).toContainText('Temporary optimistic order');

    const storedAfter = await page.evaluate(() => window.localStorage.getItem('kefine-created-orders-v1'));
    expect(storedAfter).not.toContain('temp-');
    expect(storedAfter).toContain('order-1');

    await realRow.getByTestId('kefine-open-order-order-1').click();
    await expect(page).toHaveURL(/\/@api\/order-1$/);
  });

  test('reloading a persisted order route keeps the executing flow mounted', async ({ page }) => {
    const api = await mockOrderApi(page);
    api.setCreateDelay(250);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Persisted route order');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.reload();

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Persisted route order' })).toBeVisible();
    await expect(page.getByTestId('kefine-wallet-tile')).toBeVisible();
  });

  test('custom slug survives reload and keeps executing flow mounted', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Custom slug order');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.getByTitle('Task settings').click();
    const settingsDialog = page.getByRole('dialog', { name: 'Task settings' });
    await settingsDialog.getByRole('textbox', { name: 'Slug' }).fill('custom-slug-order');
    await settingsDialog.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('kefine-created-orders-v1') ?? ''))
      .toContain('custom-slug-order');
    await expect(page).toHaveURL(/#\/orders\/custom-slug-order$/);
    await page.reload();

    await expect(page).toHaveURL(/#\/orders\/custom-slug-order$/);
    await expect(page.getByRole('heading', { name: 'Custom slug order' })).toBeVisible();
    await expect(page.getByTestId('kefine-wallet-tile')).toBeVisible();
  });

  test('solver workspace link shows past task history with repository names', async ({ page }) => {
    await mockOrderApi(page);

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem(
        'kefine-created-orders-v1',
        JSON.stringify([
          {
            id: 'order-1',
            solver: 'Test Solver',
            status: 'completed',
            title: 'Previous parser task',
            description: 'Previous parser task',
            createdAt: '2026-03-20T00:00:00.000Z',
            currency: 'USDC',
            ownerUsername: 'api',
            actorHandle: 'api',
            shareId: 'order-1',
            vcsEnabled: true,
            repository: {
              id: 'repo-order-1',
              ownerHandle: 'api',
              slug: 'legacy-tooling',
              visibility: 'public'
            }
          },
          {
            id: 'order-2',
            solver: 'Test Solver',
            status: 'queued',
            title: 'Нужен мини прокси на go',
            description: 'Нужен мини прокси на go',
            createdAt: '2026-03-21T00:00:00.000Z',
            currency: 'USDC',
            ownerUsername: 'api',
            actorHandle: 'api',
            shareId: 'order-2',
            vcsEnabled: true,
            repository: {
              id: 'repo-order-2',
              ownerHandle: 'api',
              slug: 'current-proxy',
              visibility: 'public'
            }
          }
        ])
      );
      window.localStorage.setItem(
        'kefine-order-order-2-solutions',
        JSON.stringify([
          {
            id: '5',
            solver: 'Go Proxy Basic',
            title: 'Simple HTTP Proxy',
            description: 'Minimal HTTP proxy with forward functionality',
            project: 'kefine/go-proxy',
            slug: 'feat/basic-forward',
            diffs: [],
            codeLines: []
          }
        ])
      );
    });

    await page.goto('/#/orders/order-2');

    await expect(page.locator('lef-solutions-list')).toHaveCount(0);
    const taskList = page.getByLabel('Tasks');
    await expect(taskList).toContainText('api/current-proxy');
    await expect(taskList).toContainText('Нужен мини прокси на go');
    await expect(taskList).toContainText('api/legacy-tooling');
    await expect(taskList).toContainText('Previous parser task');
    await expect(taskList.getByText('Go Proxy Basic')).toBeVisible();

    await taskList.getByRole('button', { name: /api\/legacy-tooling/ }).click();
    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.locator('kefine-thread-title').getByText('Previous parser task')).toBeVisible();
  });

  test('executing flow shows fallback solver info and hides standalone promo block', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Build a landing page');

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByTestId('kefine-solver-fallback')).toBeVisible();
    await expect(page.getByTestId('kefine-promo-toggle')).toHaveCount(0);
    await expect(page.getByTestId('kefine-promo-input')).toHaveCount(0);
  });

  test('next step from plus opens full editor and saves detailed step', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Build a landing page');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.locator('[data-part="next-step-trigger"]').first().click({ force: true });

    const editor = page.getByTestId(/kefine-inline-next-step-editor-/).first();
    await expect(editor).toBeVisible();
    await editor.locator('textarea[data-part="source"]').fill('QA handoff');
    await editor.getByRole('button', { name: 'Apply' }).click();

    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'QA handoff' })).toBeVisible();
  });

  test('plus near a node starts a new branch and survives reload', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Launch docs portal');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.locator('[data-part="comment-trigger-action"][data-kind="branch"]').first().evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

    const branchEditor = page.getByTestId(/kefine-branch-editor-/).first();
    const branchTextarea = branchEditor.locator('textarea[data-part="source"]');
    await expect(branchEditor).toBeVisible();
    await expect(branchTextarea).toBeVisible();
    await branchTextarea.fill('API migration');
    await branchEditor.getByRole('button', { name: 'Apply' }).click();

    await expect(page.getByText('Branch 1')).toBeVisible();
    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'API migration' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByText('Branch 1')).toBeVisible();
    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'API migration' })).toBeVisible();
  });

  test('expand and collapse branch children in ProseKit tree', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'ProseKit branch toggle');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    const branchButton = page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`);
    await branchButton.click();

    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await branchEditor.locator('textarea[data-part="source"]').fill('Expand/collapse path');
    await branchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    const branchNode = page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`);
    const toggle = page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`);

    await expect(branchNode).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(branchNode).toHaveCount(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(branchNode).toBeVisible();
  });

  test('create inline comment from ProseKit node context', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Task with inline comment');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.getByTestId(`kefine-thread-action-comment-${exchangeNodeId}`).click();
    const commentForm = page.getByTestId(`kefine-thread-comment-form-${exchangeNodeId}`);
    await commentForm.locator('textarea[data-part="source"]').fill('Inline comment in ProseKit node');
    await commentForm.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toContainText(
      'Inline comment in ProseKit node'
    );
  });

  test('edit branch source through ProseKit inline editor', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Task with editable branch');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    const branchButton = page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`);
    await branchButton.click();
    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await branchEditor.locator('textarea[data-part="source"]').fill('Original branch source');
    await branchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    const branchNodeId = `${exchangeNodeId}-insert-1`;
    const editButton = page.getByTestId(`kefine-thread-action-edit-${branchNodeId}`);
    await expect(editButton).toBeVisible();

    await editButton.click();
    const editEditor = page.getByTestId(`kefine-branch-editor-${branchNodeId}`);
    await editEditor.locator('textarea[data-part="source"]').fill('Updated branch source');
    await editEditor.getByTestId(`kefine-thread-action-apply-${branchNodeId}`).click();

    await expect(page.getByTestId(`kefine-task-node-${branchNodeId}`)).toContainText('Updated branch source');
  });

  test('create left and hidden parallel branches and toggle hidden visibility', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Parallel branch placement');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.getByTestId(`kefine-thread-action-branch-left-${exchangeNodeId}`).click();
    const leftBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await leftBranchEditor.locator('textarea[data-part="source"]').fill('Left branch path');
    await leftBranchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    await page.getByTestId(`kefine-thread-action-branch-hidden-${exchangeNodeId}`).click();
    const hiddenBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await hiddenBranchEditor.locator('textarea[data-part="source"]').fill('Hidden branch path');
    await hiddenBranchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    const leftBranchNode = page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`);
    const hiddenBranchNode = page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-2`);

    await expect(leftBranchNode).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-branch-left-${exchangeNodeId}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-branch-${exchangeNodeId}`)).toBeVisible();
    await expect(hiddenBranchNode).toHaveCount(0);

    await page.getByTestId(`kefine-thread-hidden-toggle-${exchangeNodeId}`).click();
    await expect(hiddenBranchNode).toBeVisible();
  });

  test('branch tree state is persisted across reloads', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Persistent branch layout');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`).click();
    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await branchEditor.locator('textarea[data-part="source"]').fill('Persisted branch');
    await branchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    await page.getByTestId(`kefine-thread-action-branch-hidden-${exchangeNodeId}`).click();
    const hiddenBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await hiddenBranchEditor.locator('textarea[data-part="source"]').fill('Persisted hidden branch');
    await hiddenBranchEditor.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`).click();

    await page.getByTestId(`kefine-thread-hidden-toggle-${exchangeNodeId}`).click();
    await page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`).click();

    await page.reload();

    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`)).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`)).toHaveCount(0);
    await page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`).click();
    await expect(page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-2`)).toBeVisible();

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('kefine-task-thread-ui-v1:order-1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(persisted).toBeTruthy();
    expect(persisted?.collapsed?.[exchangeNodeId]).toBe(true);
    expect(persisted?.hiddenVisible?.[exchangeNodeId]).toBe(true);
  });

  test('theme and locale switches do not close ProseKit inline editor', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Editor survives theme locale switches');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    await page.getByTestId(`kefine-thread-action-comment-${exchangeNodeId}`).click();
    const commentForm = page.getByTestId(`kefine-thread-comment-form-${exchangeNodeId}`);
    const commentInput = commentForm.locator('textarea[data-part="source"]');
    const commentText = 'Theme/locale keep this draft';
    await commentInput.fill(commentText);

    await page.locator('[data-part="brand"]').click();
    await page.getByTestId('kefine-topbar-theme-toggle').click();
    await page.getByTestId('kefine-topbar-theme-option-dark').click();

    await expect(commentForm).toBeVisible();
    await expect(commentInput).toHaveValue(commentText);

    await page.locator('[data-part="brand"]').click();
    await page.getByTestId('kefine-topbar-locale-toggle').click();
    await page.getByTestId('kefine-topbar-locale-option-ru').click();

    await expect(commentForm).toBeVisible();
    await expect(commentInput).toHaveValue(commentText);
    await expect(page.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`)).toBeVisible();
  });

  test('accessibility smoke: keyboard activation and ARIA labels', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Keyboard accessible task tree');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

    const nodeCopy = page.getByTestId(`kefine-task-node-copy-${exchangeNodeId}`);
    await nodeCopy.focus();
    await expect(nodeCopy).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.getByTestId(`kefine-thread-comment-form-${exchangeNodeId}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`)).toHaveAttribute(
      'aria-label',
      /Create branch/
    );
  });
});
