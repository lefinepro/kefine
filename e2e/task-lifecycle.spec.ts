import { expect, test, type Locator, type Page } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

function normalizeFontFamily(value: string) {
  return value.replaceAll('"', '').replaceAll("'", '').replaceAll(/\s*,\s*/g, ', ').trim();
}

const ORDER_ID = 'order-1';

async function fillRichEditor(
  page: Page,
  editor: Locator,
  value: string,
  options: { sync?: boolean } = {}
): Promise<Locator> {
  const { sync = true } = options;
  const textbox = editor.getByRole('textbox');
  await expect(textbox).toBeVisible();

  const editable = editor.locator('[contenteditable="true"]').first();
  if ((await editable.count()) > 0) {
    await editable.fill(value);
    if (sync) {
      await editable.press('Control+Enter');
    }
    return editable;
  }

  await textbox.click();
  await page.keyboard.press('Control+A');
  await page.keyboard.insertText(value);
  if (sync) {
    await page.keyboard.press('Control+Enter');
  }
  return textbox;
}

async function submitRichEditor(page: Page, editor: Locator, value: string) {
  const target = await fillRichEditor(page, editor, value, { sync: false });
  await target.press('Enter');
}

async function expectRichEditorText(editor: Locator, value: string) {
  await expect(editor.getByRole('textbox')).toContainText(value);
}

test.describe('Task Lifecycle', () => {
  const exchangeNodeId = `${ORDER_ID}-exchange-search`;

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

  test('create task -> reach task tree -> reload completed state', async ({ page }) => {
    const api = await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Optimize database queries');

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Optimize database queries' })).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-${ORDER_ID}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toContainText('Find solvers');
    await expect(page.getByTestId(`kefine-task-node-${ORDER_ID}-solver`)).toContainText('Test Solver');
    await expect(page.getByRole('button', { name: 'Open actions for Find solvers' })).toBeVisible();

    api.setOrderStatus('order-1', 'completed');
    await page.reload();

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Optimize database queries' })).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toHaveAttribute('data-tone', 'completed');
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

    const openOrderButton = realRow.getByTestId('kefine-open-order-order-1');
    await openOrderButton.focus();
    await expect(openOrderButton).toBeFocused();
    await openOrderButton.press('Enter');
    await expect(page).toHaveURL(/\/(?:@api\/)?order-1$/);
  });

  test('reloading a persisted order route keeps the executing flow mounted', async ({ page }) => {
    const api = await mockOrderApi(page);
    api.setCreateDelay(250);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Persisted route order');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.reload();

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Persisted route order' })).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-${ORDER_ID}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toContainText('Find solvers');
  });

  test('custom slug survives reload and keeps executing flow mounted', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Custom slug order');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTitle('Task settings').click();
    const settingsDialog = page.getByRole('dialog', { name: 'Task settings' });
    await settingsDialog.getByRole('textbox', { name: 'Slug' }).fill('custom-slug-order');
    await settingsDialog.getByRole('button', { name: 'Save' }).click();

    await expect
      .poll(() => page.evaluate(() => window.localStorage.getItem('kefine-created-orders-v1') ?? ''))
      .toContain('custom-slug-order');
    await expect(page).toHaveURL(/\/custom-slug-order$/);
    await page.reload();

    await expect(page).toHaveURL(/\/custom-slug-order$/);
    await expect(page.getByRole('heading', { name: 'Custom slug order' })).toBeVisible();
    await expect(page.getByTestId(`kefine-thread-${ORDER_ID}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toContainText('Find solvers');
  });

  test('executing flow shows fallback solver info and hides standalone promo block', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Build a landing page');

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByTestId(`kefine-task-node-${ORDER_ID}-solver`)).toContainText('Test Solver');
    await expect(page.getByTestId('kefine-promo-toggle')).toHaveCount(0);
    await expect(page.getByTestId('kefine-promo-input')).toHaveCount(0);
  });

  test('next step from plus opens full editor and saves detailed step', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Build a landing page');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.locator('[data-part="next-step-trigger"]').first().click({ force: true });

    const editor = page.getByTestId(/kefine-inline-next-step-editor-/).first();
    await expect(editor).toBeVisible();
    await submitRichEditor(page, editor, 'QA handoff');

    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'QA handoff' })).toBeVisible();
  });

  test('plus near a node starts a new branch and survives reload', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Launch docs portal');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.locator('[data-part="comment-trigger-action"][data-kind="branch"]').first().evaluate((element) => {
      (element as HTMLButtonElement).click();
    });

    const branchEditor = page.getByTestId(/kefine-branch-editor-/).first();
    await expect(branchEditor).toBeVisible();
    await submitRichEditor(page, branchEditor, 'API migration');

    await expect(page.getByText('Branch 1')).toBeVisible();
    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'API migration' })).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByText('Branch 1')).toBeVisible();
    await expect(page.locator('kefine-thread-line strong').filter({ hasText: 'API migration' })).toBeVisible();
  });

  test('expand and collapse branch children in ProseKit tree', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'ProseKit branch toggle');
    await expect(page).toHaveURL(/\/order-1$/);

    const branchButton = page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`);
    await branchButton.click();

    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, branchEditor, 'Expand/collapse path');

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
    await gotoAndWaitForReady(page);

    await createTask(page, 'Task with inline comment');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTestId(`kefine-thread-action-comment-${exchangeNodeId}`).click();
    const commentForm = page.getByTestId(`kefine-thread-comment-form-${exchangeNodeId}`);
    await fillRichEditor(page, commentForm, 'Inline comment in ProseKit node');
    const applyComment = commentForm.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`);
    await expect(applyComment).toBeEnabled();
    await applyComment.click();

    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}`)).toContainText(
      'Inline comment in ProseKit node'
    );
  });

  test('edit branch source through ProseKit inline editor', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Task with editable branch');
    await expect(page).toHaveURL(/\/order-1$/);

    const branchButton = page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`);
    await branchButton.click();
    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, branchEditor, 'Original branch source');

    const branchNodeId = `${exchangeNodeId}-insert-1`;
    const editButton = page.getByTestId(`kefine-thread-action-edit-${branchNodeId}`);
    await expect(editButton).toBeVisible();

    await editButton.click();
    const editEditor = page.getByTestId(`kefine-branch-editor-${branchNodeId}`);
    await submitRichEditor(page, editEditor, 'Updated branch source');

    await expect(page.getByTestId(`kefine-task-node-${branchNodeId}`)).toContainText('Updated branch source');
  });

  test('create left and hidden parallel branches and toggle hidden visibility', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Parallel branch placement');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTestId(`kefine-thread-action-branch-left-${exchangeNodeId}`).click();
    const leftBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, leftBranchEditor, 'Left branch path');

    await page.getByTestId(`kefine-thread-action-branch-hidden-${exchangeNodeId}`).click();
    const hiddenBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, hiddenBranchEditor, 'Hidden branch path');

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
    await gotoAndWaitForReady(page);

    await createTask(page, 'Persistent branch layout');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`).click();
    const branchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, branchEditor, 'Persisted branch');

    await page.getByTestId(`kefine-thread-action-branch-hidden-${exchangeNodeId}`).click();
    const hiddenBranchEditor = page.getByTestId(`kefine-branch-editor-${exchangeNodeId}`);
    await submitRichEditor(page, hiddenBranchEditor, 'Persisted hidden branch');

    await page.getByTestId(`kefine-thread-hidden-toggle-${exchangeNodeId}`).click();
    await page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`).click();

    await page.reload();

    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`)).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`)).toHaveCount(0);

    const persisted = await page.evaluate(() => {
      const raw = localStorage.getItem('kefine-task-thread-ui-v1:order-1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(persisted).toBeTruthy();
    expect(persisted?.collapsed?.[exchangeNodeId]).toBe(true);
    expect(persisted?.hiddenVisible?.[exchangeNodeId]).toBe(true);

    await page.getByTestId(`kefine-thread-branch-toggle-${exchangeNodeId}`).click();
    await expect(page.getByTestId(`kefine-thread-action-branch-${exchangeNodeId}`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-1`)).toBeVisible();
    await expect(page.getByTestId(`kefine-task-node-${exchangeNodeId}-insert-2`)).toBeVisible();
  });

  test('theme and locale switches do not close ProseKit inline editor', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Editor survives theme locale switches');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTestId(`kefine-thread-action-comment-${exchangeNodeId}`).click();
    const commentForm = page.getByTestId(`kefine-thread-comment-form-${exchangeNodeId}`);
    const commentText = 'Theme/locale keep this draft';
    await fillRichEditor(page, commentForm, commentText);

    const topbar = page.locator('kefine-topbar');

    await page.locator('[data-part="brand"]').click();
    await expect(topbar).toHaveAttribute('data-expanded', 'true');
    await page.getByTestId('kefine-topbar-theme-toggle').click();
    await expect(page.getByTestId('kefine-topbar-theme-option-dark')).toBeVisible();
    await page.getByTestId('kefine-topbar-theme-option-dark').click();

    await expect(commentForm).toBeVisible();
    await expectRichEditorText(commentForm, commentText);

    await page.getByTestId('kefine-topbar-locale-toggle').click();
    await expect(page.getByTestId('kefine-topbar-locale-option-ru')).toBeVisible();
    await page.getByTestId('kefine-topbar-locale-option-ru').click();

    await expect(commentForm).toBeVisible();
    await expectRichEditorText(commentForm, commentText);
    await expect(page.getByTestId(`kefine-thread-action-apply-${exchangeNodeId}`)).toBeVisible();
  });

  test('accessibility smoke: keyboard activation and ARIA labels', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Keyboard accessible task tree');
    await expect(page).toHaveURL(/\/order-1$/);

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
