import { expect, test } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

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
// The profile declares widgets in Org block form, but they must NOT render
// statically on the public profile — they are only surfaced through the command
// palette when a visitor types a matching query.
const SEED_WIDGETS_ORG = [
  '#+begin_weather',
  '#+end_weather',
  '',
  '#+begin_music',
  '#+end_music'
].join('\n');

async function seedPublicProfile(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ handle, tasksOrg, widgetsOrg }) => {
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
        metadata: { tasksOrg, widgetsOrg, profileSetupCompleted: true }
      };
      window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
    },
    { handle: SEED_HANDLE, tasksOrg: SEED_TASKS_ORG, widgetsOrg: SEED_WIDGETS_ORG }
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

  test('sidebar menu shows handle context instead of repository cards or display names', async ({ page }) => {
    await page.setViewportSize({ width: 576, height: 433 });
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await page.getByTestId('kefine-brand-mark').click();

    const profileSummary = page.getByTestId('kefine-sidebar-profile');
    await expect(profileSummary).toBeVisible();
    await expect(profileSummary).toContainText(`@${SEED_HANDLE}`);
    await expect(profileSummary).toContainText('Building reliable solver flows.');
    await expect(profileSummary.locator('kefine-sidebar-profile-avatar')).toHaveCount(0);
    await expect(page.locator('kefine-sidebar-popover')).not.toContainText('Demo Builder');
    await expect(page.locator('kefine-sidebar-popover')).not.toContainText('Latest repos');
    await expect(page.locator('kefine-sidebar-popover')).not.toContainText('Repos');

    const sidebarPopoverBox = await page.locator('kefine-sidebar-popover').boundingBox();
    const dockControlsBox = await page.locator('kefine-sidebar-toolbar').last().boundingBox();
    if (!sidebarPopoverBox || !dockControlsBox) {
      throw new Error('Expected sidebar popover and dock controls to be measurable');
    }

    await expect(page.getByTestId('kefine-topbar-theme-toggle')).toBeVisible();
    await expect(page.getByTestId('kefine-topbar-locale-toggle')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Write to us' })).toBeVisible();
    expect(dockControlsBox.x).toBeGreaterThanOrEqual(sidebarPopoverBox.x - 1);
    expect(dockControlsBox.x + dockControlsBox.width).toBeLessThanOrEqual(
      sidebarPopoverBox.x + sidebarPopoverBox.width + 1
    );
  });

  test('new-task row deeplinks into the topbar search to create a task', async ({ page }) => {
    await mockOrderApi(page);
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

    await createTaskResult.click();
    await expect(page).toHaveURL(/\/order-1$/);
  });

  test('declared widgets are not shown statically but are surfaced by a matching query', async ({
    page
  }) => {
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-repo')).toBeVisible();

    // No widget renders statically on the public profile.
    await expect(page.getByTestId('kefine-weather-widget')).toHaveCount(0);
    await expect(page.getByTestId('kefine-music-widget')).toHaveCount(0);

    // The declared weather widget only appears once the visitor searches for it.
    await page.getByTestId('kefine-topbar-search-trigger').click();
    await expect(page.getByTestId('kefine-topbar-search-dialog')).toBeVisible();
    await page.getByTestId('kefine-topbar-search-input').fill('weather');

    const weatherResult = page.getByTestId('kefine-topbar-search-result-widget-weather');
    await expect(weatherResult).toBeVisible();
    await weatherResult.click();

    await expect(page.getByTestId('kefine-topbar-search-widget')).toHaveAttribute(
      'data-widget',
      'weather'
    );
    await expect(page.getByTestId('kefine-weather-widget')).toBeVisible();

    // A widget the profile did not declare (translate) is not offered.
    await page.getByTestId('kefine-topbar-search-widget-back').click();
    await page.getByTestId('kefine-topbar-search-input').fill('translate');
    await expect(page.getByTestId('kefine-topbar-search-result-widget-translate')).toHaveCount(0);
  });
});
