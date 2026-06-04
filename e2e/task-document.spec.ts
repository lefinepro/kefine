import { expect, test } from '@playwright/test';

const createdAt = '2026-06-03T12:00:00.000Z';

const documentOrder = {
  id: 'order-1',
  solver: 'Document Solver',
  solverName: 'Document Solver',
  status: 'queued',
  title: 'Document import workflow',
  description: 'Build the importer and verify the result with automated checks.',
  createdAt,
  estimatedCost: 42,
  currency: 'USDC',
  executionEstimate: 'about 2 hours',
  labels: ['import', 'testing'],
  ownerUsername: 'api',
  actorHandle: 'api',
  shareId: 'order-1',
  repository: {
    id: 'repo-order-1',
    ownerHandle: 'api',
    slug: 'document-import',
    visibility: 'public'
  },
  executionSteps: [
    {
      id: 'step-1',
      title: 'Map CSV columns',
      detail: 'Match incoming fields with the task schema.',
      state: 'completed'
    },
    {
      id: 'step-2',
      title: 'Run importer smoke test',
      detail: 'Verify successful import and error handling.',
      state: 'active'
    }
  ],
  document: {
    format: 'markdown',
    content: [
      '# Import plan',
      '',
      'Build the importer and keep the interface readable for reviewers.',
      '',
      '- Parse CSV input',
      '- Preserve validation errors',
      '',
      '```bash',
      'pnpm test -- task-document',
      '```'
    ].join('\n')
  }
};

test.describe('Task document page', () => {
  test('renders the legacy task route as a compact document', async ({ page }) => {
    await page.route('**/api/status/order-1', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId: documentOrder.id,
          ...documentOrder
        })
      });
    });

    await page.addInitScript((order) => {
      window.localStorage.clear();
      window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify([order]));
    }, documentOrder);

    await page.goto('/task/order-1');

    const documentPage = page.getByTestId('kefine-task-document-page');
    await expect(documentPage).toBeVisible();
    await expect(documentPage.getByRole('heading', { name: 'Document import workflow' })).toBeVisible();
    await expect(documentPage.getByRole('checkbox', { name: 'Task completion' })).not.toBeChecked();

    // Unified solver-style chrome: shared topbar plus the solver topbar breadcrumb.
    await expect(page.locator('lef-solver-topbar')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back' })).toBeVisible();
    await expect(page.locator('lef-solver-topbar')).toContainText('Document Solver');
    // The document is the first-step overview: no testing/source tabs or solver widget.
    await expect(page.locator('lef-view-tabs')).toHaveCount(0);
    await expect(page.locator('lef-task-panel')).toHaveCount(0);
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('Document Solver');
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('42 USDC');
    await expect(page.getByTestId('kefine-task-document-description')).toContainText('Import plan');
    await expect(page.getByTestId('kefine-task-document-description')).toContainText('Parse CSV input');
    await expect(page.locator('lef-task-markdown-code code')).toContainText('pnpm test -- task-document');
    await expect(page.getByTestId('kefine-task-document-subtasks')).toContainText('Map CSV columns');
    await expect(page.getByTestId('kefine-task-document-subtasks')).toContainText('Run importer smoke test');
    await expect(page.locator('kefine-thread-title')).toHaveCount(0);
    await expect(page.getByTestId('kefine-wallet-tile')).toHaveCount(0);
  });

  test('does not serve the removed shared task page', async ({ page }) => {
    const response = await page.goto('/shared/tasks/order-1');
    expect(response?.status()).toBe(404);
  });
});
