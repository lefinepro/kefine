import { expect, test } from '@playwright/test';

// A profile is a repository: the public profile renders the handle as a README
// header. Tasks, however, are private — the checklist and the "new task" row only
// render for the owner, so an anonymous viewer sees the README without any task
// list. Widgets the owner declares in the profile's Org document render directly
// inside the public profile (not behind the command palette). We seed a public
// profile into local storage and visit it as an anonymous viewer to exercise the
// public repository view.
const SEED_HANDLE = 'demo';
const SEED_TASKS_ORG = [
  '* TODO Introduce yourself in the bio',
  '* TODO Add a link people can follow',
  '* IN PROGRESS Publish your first service',
  '* DONE Claim your handle'
].join('\n');
// The profile declares two widgets in Org block form; both must render inline on
// the public profile. The music widget renders deterministically whenever it is
// active (no network or geolocation), so it anchors the inline-rendering check.
const SEED_WIDGETS_ORG = [
  '#+begin_music',
  '#+end_music',
  '',
  '#+begin_weather',
  '#+end_weather'
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
  test('renders the handle as a README and keeps tasks private in the public view', async ({
    page
  }) => {
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-repo')).toBeVisible();
    await expect(page.getByTestId('profile-readme')).toBeVisible();
    await expect(page.getByTestId('profile-readme-title')).toContainText(`@${SEED_HANDLE}`);
    await expect(page.getByTestId('profile-brief')).toContainText('Building reliable solver flows.');

    // Tasks are private: the public view never renders the checklist, the task
    // items, or the "new task" row, even though the profile declares tasks.
    await expect(page.getByTestId('profile-checklist')).toHaveCount(0);
    await expect(page.getByTestId('profile-checklist-item')).toHaveCount(0);
    await expect(page.getByTestId('profile-new-task-row')).toHaveCount(0);
    await expect(page.getByTestId('profile-new-task-input')).toHaveCount(0);
  });

  test('renders declared widgets directly inside the public profile', async ({ page }) => {
    await seedPublicProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-repo')).toBeVisible();

    // Widgets live directly inside the profile (not behind the command palette):
    // both declared blocks render statically, and the music widget — which needs
    // no network or geolocation — is visible inline.
    await expect(page.getByTestId('profile-widgets')).toBeVisible();
    await expect(page.getByTestId('profile-widget')).toHaveCount(2);
    await expect(page.getByTestId('kefine-music-widget')).toBeVisible();
  });
});
