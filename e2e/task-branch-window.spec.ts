import { expect, test } from '@playwright/test';

import { mockOrderApi, waitForHydratedElement } from './helpers/kefine';

// Issue #165: clicking the branch chip on a task history row must open that
// task's document view (/task/<id>) in a new browser window, independently from
// the row link that leads to the solver list.
const createdAt = '2026-06-03T12:00:00.000Z';

const documentOrder = {
  id: 'order-1',
  solver: 'Document Solver',
  solverName: 'Document Solver',
  status: 'completed',
  title: 'Document import workflow',
  description: 'Build the importer and verify the result with automated checks.',
  createdAt,
  estimatedCost: 42,
  currency: 'USDC',
  executionEstimate: 'about 2 hours',
  ownerUsername: 'api',
  actorHandle: 'api',
  shareId: 'order-1',
  vcsEnabled: true,
  repository: {
    id: 'repo-order-1',
    ownerHandle: 'api',
    slug: 'document-import',
    visibility: 'public'
  }
};

test.describe('Task branch chip opens task document in a new window', () => {
  test.beforeEach(async ({ page }) => {
    // mockOrderApi mocks /api/health so the composer stays mounted, and
    // /api/status/** so the popped-out document page can resolve the order.
    await mockOrderApi(page);
    await page.addInitScript((order) => {
      window.localStorage.clear();
      window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify([order]));
    }, documentOrder);
    await page.goto('/');
    await expect(page.getByTestId('kefine-task-input')).toBeVisible();
    // The composer must hydrate before its focus handler can reveal the history.
    await waitForHydratedElement(page, '[data-testid="kefine-task-input"]');
  });

  async function revealBranchChip(page: import('@playwright/test').Page) {
    // Focusing the composer reveals the persistent task history list.
    await page.getByTestId('kefine-task-input').click();
    const branch = page.getByTestId('kefine-task-branch-order-1');
    await expect(branch).toBeVisible();
    return branch;
  }

  test('clicking the branch chip opens the task document page in a new window', async ({ page }) => {
    const branch = await revealBranchChip(page);

    // The chip is an accessible button advertising the new-window behaviour.
    await expect(branch).toHaveAttribute('role', 'button');
    await expect(branch).toHaveAttribute('aria-label', /Open task document.*new window/i);

    // window.open(..., '_blank', 'noopener') surfaces as a new page on the context.
    const popupPromise = page.context().waitForEvent('page');
    await branch.click();
    const popup = await popupPromise;

    await popup.waitForURL(/\/task\/order-1/);
    expect(popup.url()).toContain('/task/order-1');

    // The row link to the solver list must NOT have fired: we stay on home.
    await expect(page).toHaveURL(/\/$/);

    await popup.close();
  });

  test('keyboard activation of the branch chip also opens a new window', async ({ page }) => {
    const branch = await revealBranchChip(page);
    await branch.focus();
    await expect(branch).toBeFocused();

    const popupPromise = page.context().waitForEvent('page');
    await page.keyboard.press('Enter');
    const popup = await popupPromise;

    await popup.waitForURL(/\/task\/order-1/);
    expect(popup.url()).toContain('/task/order-1');
    await expect(page).toHaveURL(/\/$/);

    await popup.close();
  });
});
