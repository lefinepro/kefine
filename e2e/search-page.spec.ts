import { expect, test, type Page } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

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
  test('opens root query as anonymous results controlled by the topbar search', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/?q=redis%20backup');

    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-page-results')).toHaveAttribute(
      'data-mode',
      'anonymous'
    );
    await expect(page.getByTestId('kefine-search-order-order-redis')).toContainText('Redis backup script');
    await expect(page.getByTestId('kefine-topbar-search-dialog')).not.toBeVisible();

    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('redis backup');

    await page.getByTestId('kefine-topbar-search-input').fill('postgres restore');
    await expect(page).toHaveURL(/\/\?q=postgres\+restore$/);
    await expect(page.getByTestId('kefine-search-order-order-redis')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-results-empty')).toBeVisible();
  });

  test('opens profile query as saved results controlled by the topbar search', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/@staff?q=ci%20rollback');

    await expect(page.getByTestId('kefine-task-input')).toHaveCount(0);
    await expect(page.getByTestId('kefine-search-page-results')).toHaveAttribute('data-mode', 'saved');
    await expect(page.getByTestId('kefine-search-order-order-ci')).toContainText('CI rollback checklist');
    await expect(page).toHaveURL(/\/@staff\?q=ci\+rollback$/);

    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('ci rollback');

    await page.getByTestId('kefine-topbar-search-input').fill('vpn access');
    await expect(page).toHaveURL(/\/@staff\?q=vpn\+access$/);
  });

  test('places the mobile search trigger next to the sign-in button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await mockOrderApi(page);
    await page.goto('/');
    await expect(page.getByTestId('kefine-topbar-search-trigger')).toBeVisible();

    const searchBox = await page.getByTestId('kefine-topbar-search-trigger').boundingBox();
    const authBox = await page.locator("button[data-part='auth']").boundingBox();

    expect(searchBox).not.toBeNull();
    expect(authBox).not.toBeNull();
    expect(searchBox!.x).toBeLessThan(authBox!.x);
    expect(authBox!.x - (searchBox!.x + searchBox!.width)).toBeLessThanOrEqual(10);
  });
});
