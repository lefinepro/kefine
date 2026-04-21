import { expect, test } from '@playwright/test';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Task Clone', () => {
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
    api.setOrderRepository('order-1', {
      id: 'repo-1',
      projectId: '445bff36-ed69-4927-b36b-e3dd39f1f72a',
      ownerHandle: 'miihsjalbglghkgbzqmeaxid',
      slug: 'download-https-github-com-openclaw-docs-and-list-the-files-on-answer-445bff36',
      visibility: 'public',
      defaultBranch: 'main',
      projectCloneUrl: 'ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.git',
      projectArchiveUrl: 'https://lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.zip',
      publicCloneUrl: 'https://lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.git',
      sshCloneUrl: 'ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/445bff36-ed69-4927-b36b-e3dd39f1f72a.git'
    });

    await page.reload();
    await expect(page).toHaveURL(/\/order-1$/);

    await page.getByRole('button', { name: 'Clone task' }).click();

    await expect(page.getByText('SSH clone')).toBeVisible();
    await expect(
      page.getByText('git clone ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/order-1.git')
    ).toBeVisible();
    await expect(
      page.getByText('ssh://git@lefine.pro/@miihsjalbglghkgbzqmeaxid/order-1.git')
    ).toBeVisible();

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
