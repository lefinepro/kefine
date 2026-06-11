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
  test('renders the legacy task route in the production document shell with sidebar navigation', async ({ page }) => {
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
    await expect(page.getByTestId('kefine-task-document-sidebar')).toBeVisible();
    await expect(page.getByTestId('kefine-task-document-sidebar').getByRole('link', { name: 'Overview' })).toBeVisible();
    await expect(page.getByTestId('kefine-task-document-sidebar').getByRole('link', { name: 'Details' })).toBeVisible();
    await expect(page.getByTestId('kefine-task-document-sidebar').getByRole('link', { name: 'Subtasks' })).toBeVisible();
    await expect(documentPage.getByRole('heading', { name: 'Document import workflow' })).toBeVisible();
    await expect(documentPage.getByRole('checkbox', { name: 'Task completion' })).not.toBeChecked();

    // Reviewer feedback: task identity moves into the shared search area, with
    // no extra solver header row on the overview document.
    await expect(page.locator('lef-solver-topbar')).toHaveCount(0);
    const topbarContext = page.getByTestId('kefine-topbar-search-context');
    await expect(topbarContext).toContainText('@api/document-import');
    await expect(topbarContext).toContainText('task:Document import workflow');
    const topbarContextSegments = page.getByTestId('kefine-topbar-search-context-segment');
    await expect(topbarContextSegments).toHaveCount(2);
    await expect(topbarContextSegments.nth(0)).toHaveAttribute('data-kind', 'project');
    await expect(topbarContextSegments.nth(1)).toHaveAttribute('data-kind', 'task');
    const titleAlignment = await documentPage.locator('lef-task-title-row').evaluate((row) => {
      const checkbox = row.querySelector('input')?.getBoundingClientRect();
      const title = row.querySelector('h1')?.getBoundingClientRect();
      if (!checkbox || !title) {
        return Number.POSITIVE_INFINITY;
      }

      return Math.abs((checkbox.top + checkbox.height / 2) - (title.top + title.height / 2));
    });
    expect(titleAlignment).toBeLessThanOrEqual(1);
    // The document is the first-step overview: no testing/source tabs or solver widget.
    await expect(page.locator('lef-view-tabs')).toHaveCount(0);
    await expect(page.locator('lef-task-panel')).toHaveCount(0);
    await expect(page.locator('lef-task-title-kicker')).toHaveCount(0);
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('Type');
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('Document');
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('Status');
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('Open');
    await expect(page.getByTestId('kefine-task-document-properties')).toContainText('42 USDC');
    await expect(page.getByTestId('kefine-task-document-properties')).not.toContainText('Document Solver');
    await expect(page.getByTestId('kefine-task-document-properties')).not.toContainText('@api/document-import');
    const propertyGap = await documentPage.locator('lef-task-property').first().evaluate((row) => {
      const label = row.querySelector('strong')?.getBoundingClientRect();
      const value = row.querySelector('lef-task-property-value')?.getBoundingClientRect();
      if (!label || !value) {
        return Number.NEGATIVE_INFINITY;
      }

      return value.left - label.right;
    });
    expect(propertyGap).toBeGreaterThanOrEqual(8);
    await expect(page.getByRole('heading', { name: 'Description' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Subtasks' })).toHaveCount(0);
    // The task description block was removed in #175; only the subtasks section
    // remains below the property grid.
    await expect(page.getByTestId('kefine-task-document-description')).toHaveCount(0);
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
