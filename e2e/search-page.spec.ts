import { expect, test, type Page } from '@playwright/test';

import { mockOrderApi, seedAuthSession } from './helpers/kefine';

const SEARCH_FIXTURE_ORDERS = [
  {
    id: 'order-redis',
    title: 'Redis backup script',
    description: 'Automate Redis snapshots and restore checks',
    status: 'completed',
    solver: 'Storage Solver',
    createdAt: '2026-03-20T00:00:00.000Z',
    executionEstimate: 'about 2 hours',
    currency: 'USDC',
    actorHandle: 'staff',
    shareId: 'redis-backup'
  },
  {
    id: 'order-ci',
    title: 'CI rollback checklist',
    description: 'Rollback failed deploys from CI',
    status: 'queued',
    solver: 'Release Solver',
    createdAt: '2026-03-21T00:00:00.000Z',
    executionEstimate: 'about 1 hour',
    currency: 'USDC',
    actorHandle: 'staff',
    shareId: 'ci-rollback'
  }
];

async function gotoSearchPage(page: Page, path: string) {
  await page.goto('/');
  await page.evaluate((orders) => {
    window.localStorage.clear();
    window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify(orders));
  }, SEARCH_FIXTURE_ORDERS);
  await page.goto(path);
  await expect(page.getByTestId('kefine-search-page-results')).toBeVisible();
}

test.describe('Search page URLs', () => {
  test('opens root query as anonymous results controlled by the page search', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/?q=redis%20backup');

    await expect(page.getByTestId('kefine-search-page-input')).toBeVisible();
    await expect(page.getByTestId('kefine-search-page-input')).toHaveValue('redis backup');
    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-page-results')).toHaveAttribute(
      'data-mode',
      'anonymous'
    );
    await expect(page.getByTestId('kefine-search-order-order-redis')).toContainText('Redis backup script');
    await expect(page.getByTestId('kefine-order-snippet-order-redis')).toContainText('Automate Redis snapshots');
    await expect(page.getByTestId('kefine-search-page-mode')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-save-link')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-open-page')).toHaveCount(0);
    await expect(page.getByText('Resolved repos')).toHaveCount(0);
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveCount(0);
    await expect(page.getByTestId('kefine-topbar-search-dialog')).toHaveCount(0);

    const titleBox = await page.locator('[data-testid="kefine-search-order-order-redis"] kefine-order-title').boundingBox();
    const snippetBox = await page.locator('[data-testid="kefine-search-order-order-redis"] kefine-order-snippet').boundingBox();
    expect(titleBox).not.toBeNull();
    expect(snippetBox).not.toBeNull();
    const titleCenterY = (titleBox?.y ?? 0) + (titleBox?.height ?? 0) / 2;
    const snippetCenterY = (snippetBox?.y ?? 0) + (snippetBox?.height ?? 0) / 2;
    expect(Math.abs(titleCenterY - snippetCenterY)).toBeLessThan(4);

    await page.getByTestId('kefine-search-page-input').fill('postgres restore');
    await expect(page).toHaveURL(/\/\?q=postgres\+restore$/);
    await expect(page.getByTestId('kefine-search-order-order-redis')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-results-empty')).toHaveCount(0);
    await expect(page.getByText('No matching results')).toHaveCount(0);
    const createHint = page.getByTestId('kefine-search-create-hint');
    await expect(createHint).toBeVisible();
    await expect(createHint).toContainText('Press Enter to create a task');
    await expect(createHint).toContainText('postgres restore');
  });

  test('creates and starts executing a task by pressing Enter on the search page', async ({ page }) => {
    await mockOrderApi(page);
    await seedAuthSession(page);
    await gotoSearchPage(page, '/?q=postgres%20restore');

    await expect(page.getByTestId('kefine-search-create-hint')).toBeVisible();
    await page.getByTestId('kefine-search-page-input').press('Enter');
    await expect(page).toHaveURL(/\/order-1$/);
  });

  test('opens profile query as saved results controlled by the topbar search', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/@staff?q=ci%20rollback');

    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-page-results')).toHaveAttribute('data-mode', 'saved');
    await expect(page.getByTestId('kefine-search-order-order-ci')).toContainText('CI rollback checklist');
    await expect(page.getByTestId('kefine-order-snippet-order-ci')).toContainText('Rollback failed deploys');
    await expect(page.getByTestId('kefine-search-page-mode')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-anonymous-link')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-open-page')).toHaveCount(0);
    await expect(page.getByText('Resolved repos')).toHaveCount(0);
    await expect(page).toHaveURL(/\/@staff\?q=ci\+rollback$/);

    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('ci rollback');

    await page.getByTestId('kefine-topbar-search-input').fill('vpn access');
    await expect(page).toHaveURL(/\/@staff\?q=vpn\+access$/);
  });

  test('renders site snippets and widgets on search result pages', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/?q=git%20hub');

    await expect(page.getByTestId('kefine-search-page-input')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveCount(0);
    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-instant-description-github')).toBeVisible();
    await expect(page.getByTestId('kefine-search-create-hint')).toBeVisible();

    await gotoSearchPage(page, '/?q=translate%20from%20english%20to%20russian');
    await expect(page.getByTestId('kefine-search-page-input')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveCount(0);
    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-translator-widget')).toBeVisible();
  });

  test('does not render a mobile header search trigger on anonymous search pages', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockOrderApi(page);
    await gotoSearchPage(page, '/?q=redis%20backup');

    await expect(page.getByTestId('kefine-search-page-input')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toHaveCount(0);
    await expect(page.locator("button[data-part='auth']")).toBeVisible();
  });
});
