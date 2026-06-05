import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import { createTask, gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

const execFileAsync = promisify(execFile);

async function runGit(args: string[], cwd?: string) {
  try {
    return await execFileAsync('git', args, { cwd });
  } catch (error) {
    const gitError = error as { message?: string; stdout?: string; stderr?: string };
    throw new Error(
      [
        `git ${args.join(' ')} failed`,
        gitError.message,
        gitError.stdout?.trim(),
        gitError.stderr?.trim()
      ]
        .filter(Boolean)
        .join('\n')
    );
  }
}

async function createSeededBareRepository(root: string) {
  const barePath = path.join(root, 'roundtrip.git');
  const seedPath = path.join(root, 'seed');

  await runGit(['init', '--bare', '--initial-branch=main', barePath]);
  await runGit(['init', '--initial-branch=main', seedPath]);
  await runGit(['config', 'user.name', 'Kefine E2E'], seedPath);
  await runGit(['config', 'user.email', 'e2e@kefine.local'], seedPath);
  await writeFile(path.join(seedPath, '.gitkeep'), 'seed\n');
  await runGit(['add', '.gitkeep'], seedPath);
  await runGit(['commit', '-m', 'Seed repository'], seedPath);
  await runGit(['remote', 'add', 'origin', barePath], seedPath);
  await runGit(['push', 'origin', 'main'], seedPath);

  return barePath;
}

function cloneUrlFromCommand(command: string) {
  const match = command.trim().match(/^git clone\s+(\S+)$/);
  if (!match) {
    throw new Error(`Unexpected clone command: ${command}`);
  }

  return match[1];
}

test.describe('Task Clone', () => {
  test('create git repo flow persists and exposes clone targets after reload', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await createTask(page, 'Repository creation flow');
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

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
    await expect(page).toHaveURL(/#\/orders\/order-1$/);
    await expect(page.locator('strong').filter({ hasText: 'Repository creation flow' })).toBeVisible();

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
    await expect(page).toHaveURL(/#\/orders\/order-1$/);

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

test.describe('Task Clone Git Round Trip', () => {
  test('clone command supports README push and pull round trip', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'git round trip only needs one browser project');

    const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'kefine-git-roundtrip-'));

    try {
      const barePath = await createSeededBareRepository(tempRoot);
      const cloneUrl = pathToFileURL(barePath).href;
      const api = await mockOrderApi(page);
      await gotoAndWaitForReady(page);

      await createTask(page, 'Repository git roundtrip');
      await expect(page).toHaveURL(/#\/orders\/order-1$/);

      await page.getByTitle('Task settings').click();
      const settingsDialog = page.getByRole('dialog', { name: 'Task settings' });
      await settingsDialog.getByRole('textbox', { name: 'Name' }).fill('Roundtrip repository');
      await settingsDialog.getByRole('textbox', { name: 'Slug' }).fill('roundtrip-repo');
      await settingsDialog.getByRole('checkbox', { name: 'Make public' }).check();
      await settingsDialog.getByRole('button', { name: 'Create git repo' }).click();

      await expect(page).toHaveURL(/#\/orders\/roundtrip-repo$/);

      api.setOrderRepository('order-1', {
        id: 'repo-order-1',
        projectId: 'roundtrip-repo-project',
        ownerHandle: 'api',
        slug: 'roundtrip-repo',
        visibility: 'public',
        defaultBranch: 'main',
        projectCloneUrl: cloneUrl,
        projectArchiveUrl: 'https://lefine.pro/@api/roundtrip-repo-project.zip',
        publicCloneUrl: cloneUrl
      });

      await page.reload();
      await page.getByRole('button', { name: 'Clone task' }).click();

      await expect(page.getByText('SSH clone')).toBeVisible();
      const cloneCommand = await page.locator('kefine-clone-target code').textContent();
      expect(cloneCommand).toBe(`git clone ${cloneUrl}`);

      if (process.env.KEFINE_CAPTURE_ISSUE_132_SCREENSHOT === '1') {
        await page.screenshot({
          path: 'docs/screenshots/issue-132-git-roundtrip.png',
          fullPage: true
        });
      }

      const writerPath = path.join(tempRoot, 'writer');
      const readerPath = path.join(tempRoot, 'reader');
      const readmeText = [
        'Repository git roundtrip',
        '',
        'This file was pushed from the clone command shown in the Kefine task menu.',
        ''
      ].join('\n');

      await runGit(['clone', cloneUrlFromCommand(cloneCommand ?? ''), writerPath]);
      await runGit(['clone', cloneUrl, readerPath]);
      await runGit(['config', 'user.name', 'Kefine E2E'], writerPath);
      await runGit(['config', 'user.email', 'e2e@kefine.local'], writerPath);
      await writeFile(path.join(writerPath, 'readme.txt'), readmeText);
      await runGit(['add', 'readme.txt'], writerPath);
      await runGit(['commit', '-m', 'Add readme roundtrip proof'], writerPath);
      await runGit(['push', 'origin', 'main'], writerPath);
      await runGit(['pull', '--ff-only', 'origin', 'main'], readerPath);

      await expect(readFile(path.join(readerPath, 'readme.txt'), 'utf8')).resolves.toBe(readmeText);
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
