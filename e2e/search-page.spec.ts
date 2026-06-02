import { expect, test, type Page } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

async function gotoSearchPage(page: Page, path: string) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.goto(path);
  await expect(page.getByTestId('kefine-task-input')).toBeVisible();
}

test.describe('Search page URLs', () => {
  test('opens root query as anonymous search and keeps the URL filled from the composer', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/?q=redis%20backup');

    await expect(page.getByTestId('kefine-task-input')).toHaveValue('redis backup');
    await expect(page.getByTestId('kefine-search-page-mode')).toHaveAttribute(
      'data-mode',
      'anonymous'
    );
    await expect(page.getByTestId('kefine-topbar-search-dialog')).not.toBeVisible();
    await expect(page.getByTestId('kefine-search-save-link')).toHaveAttribute(
      'href',
      /\/@staff\?q=redis\+backup$/
    );

    await page.getByTestId('kefine-task-input').fill('postgres restore');
    await expect(page).toHaveURL(/\/\?q=postgres\+restore$/);
    await expect(page.getByTestId('kefine-search-open-page')).toHaveAttribute(
      'href',
      /\?q=postgres\+restore$/
    );

    await page.getByTestId('kefine-task-input').fill('');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByTestId('kefine-search-page-mode')).toBeHidden();
    await expect(page.getByTestId('kefine-topbar-search-dialog')).not.toBeVisible();
  });

  test('opens profile query as saved search with an anonymous switch', async ({ page }) => {
    await mockOrderApi(page);
    await gotoSearchPage(page, '/@staff?q=ci%20rollback');

    await expect(page.getByTestId('kefine-task-input')).toHaveValue('ci rollback');
    await expect(page.getByTestId('kefine-search-page-mode')).toHaveAttribute('data-mode', 'saved');
    await expect(page).toHaveURL(/\/@staff\?q=ci\+rollback$/);
    await expect(page.getByTestId('kefine-search-anonymous-link')).toHaveAttribute(
      'href',
      /\/\?q=ci\+rollback$/
    );

    await page.getByTestId('kefine-task-input').fill('vpn access');
    await expect(page).toHaveURL(/\/@staff\?q=vpn\+access$/);
  });
});
