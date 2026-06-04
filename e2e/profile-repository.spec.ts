import { expect, test } from '@playwright/test';

// A profile is a repository: the public profile renders the handle as a README
// header and the profile tasks as an Org TODO checklist, mirroring the solvers
// screen. We seed a public profile into local storage and visit it as an
// anonymous viewer to exercise the public repository view.
const SEED_HANDLE = 'demo';
const SEED_TASKS_ORG = [
  '* TODO Introduce yourself in the bio',
  '* TODO Add a link people can follow',
  '* IN PROGRESS Publish your first service',
  '* DONE Claim your handle'
].join('\n');

async function seedPublicProfile(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ handle, tasksOrg }) => {
      const profile = {
        id: 'profile-demo',
        userId: 'user-demo',
        username: handle,
        primaryHandle: handle,
        primaryHandleType: 'email',
        displayName: 'Demo Builder',
        bio: 'Building reliable solver flows.',
        isPublic: true,
        socialLinks: [],
        referralPercent: 10,
        bonusBalanceUsd: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        metadata: { tasksOrg, profileSetupCompleted: true }
      };
      window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
    },
    { handle: SEED_HANDLE, tasksOrg: SEED_TASKS_ORG }
  );
}

test.describe('Profile repository view', () => {
  test('renders the handle as a README and the tasks as a checklist', async ({ page }) => {
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-repo')).toBeVisible();
    await expect(page.getByTestId('profile-readme')).toBeVisible();
    await expect(page.getByTestId('profile-readme-title')).toContainText(`@${SEED_HANDLE}`);
    await expect(page.getByTestId('profile-brief')).toContainText('Building reliable solver flows.');

    // The seeded task list has four items spanning every TODO state.
    const items = page.getByTestId('profile-checklist-item');
    await expect(items).toHaveCount(4);
    await expect(items.nth(0)).toHaveAttribute('data-state', 'todo');
    await expect(items.nth(2)).toHaveAttribute('data-state', 'in-progress');
    await expect(items.last()).toHaveAttribute('data-state', 'done');
  });

  test('new-task row deeplinks into the topbar search to create a task', async ({ page }) => {
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-new-task-row')).toBeVisible();
    await page.getByTestId('profile-new-task-input').fill('Ship the landing page');
    await page.getByTestId('profile-new-task-input').press('Enter');

    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-search-input')).toHaveValue('Ship the landing page');
    const createTaskResult = page.getByTestId('kefine-topbar-search-result-create-task');
    await expect(createTaskResult).toBeVisible();
    await expect(createTaskResult).toContainText('Ship the landing page');
  });
});
