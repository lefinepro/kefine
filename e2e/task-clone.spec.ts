import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Task Clone', () => {
  test('create git repo flow persists and exposes clone targets after reload', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Repository creation flow');
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByTitle('Task settings').click();
    const settingsDialog = page.getByRole('dialog', { name: 'Task settings' });
    await expect(settingsDialog.getByRole('button', { name: 'Create git repo' })).toBeVisible();

    await settingsDialog.getByRole('button', { name: 'Create git repo' }).click();

    await expect(page.getByTitle('Task settings')).toBeVisible();

    await page.getByTitle('Task settings').click();
    const reopenedSettings = page.getByRole('dialog', { name: 'Task settings' });
    await expect(reopenedSettings.getByRole('checkbox', { name: 'Enable VCS' })).toBeChecked();
    await expect(reopenedSettings.getByText('Git access')).toBeVisible();
    await reopenedSettings.getByRole('button', { name: 'Save' }).click();

    await page.reload();
    await expect(page).toHaveURL(/\/order-1$/);
    await expect(page.getByRole('heading', { name: 'Repository creation flow' })).toBeVisible();

    await page.getByRole('button', { name: 'Clone task' }).click();

    await expect(page.getByText('SSH clone')).toBeVisible();
    await expect(page.locator('kefine-clone-target code')).toHaveText(
      'git clone ssh://git@lefine.pro/@api/order-1.git'
    );
    await expect(page.locator('kefine-clone-target small')).toHaveText(
      'ssh://git@lefine.pro/@api/order-1.git'
    );

    const archiveLinks = page.locator('kefine-clone-popover a');
    await expect(archiveLinks).toHaveCount(3);
    await expect(archiveLinks.nth(0)).toHaveAttribute(
      'href',
      'https://lefine.pro/@api/order-1-project.zip'
    );
    await expect(archiveLinks.nth(1)).toHaveAttribute(
      'href',
      'https://lefine.pro/@api/order-1-project.tar.gz'
    );
    await expect(archiveLinks.nth(2)).toHaveAttribute(
      'href',
      'https://lefine.pro/@api/order-1-project.tar.zst'
    );
  });

  test('clone menu shows owner-scoped repository clone and archive URLs', async ({ page }) => {
    const api = await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Cloneable repository task');
    await expect(page).toHaveURL(/\/order-1$/);

    api.setOrderOwner('order-1', {
      ownerUsername: 'miihsjalbglghkgbzqmeaxid',
      ownerDisplayName: 'miihsjalbglghkgbzqmeaxid',
      actorHandle: 'miihsjalbglghkgbzqmeaxid'
    });
    api.setOrderProjectId('order-1', '445bff36-ed69-4927-b36b-e3dd39f1f72a');

    await page.getByTitle('Task settings').click();
    const settingsDialog = page.getByRole('dialog', { name: 'Task settings' });
    await settingsDialog.getByRole('button', { name: 'Create git repo' }).click();

    await page.getByRole('button', { name: 'Clone task' }).click();

    await expect(page.getByText('SSH clone')).toBeVisible();
    await expect(page.locator('kefine-clone-target code')).toHaveText(
      'git clone ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/order-1.git'
    );
    await expect(page.locator('kefine-clone-target small')).toHaveText(
      'ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/order-1.git'
    );

    const archiveLinks = page.locator('kefine-clone-popover a');
    await expect(archiveLinks).toHaveCount(3);
    await expect(archiveLinks.nth(0)).toHaveText('zip');
    await expect(archiveLinks.nth(0)).toHaveAttribute(
      'href',
      'https://lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.zip'
    );
    await expect(archiveLinks.nth(1)).toHaveText('tar.gz');
    await expect(archiveLinks.nth(1)).toHaveAttribute(
      'href',
      'https://lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.tar.gz'
    );
    await expect(archiveLinks.nth(2)).toHaveText('tar.zst');
    await expect(archiveLinks.nth(2)).toHaveAttribute(
      'href',
      'https://lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.tar.zst'
    );
  });
});
