import { expect, test, type Page } from '@playwright/test';

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
const SEED_SSH_PUBLIC_KEYS = [
  'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDemoKeyOne demo-one',
  'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDemoKeyTwo demo-two'
].join('\n');

async function seedPublicProfile(page: Page) {
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
    {
      handle: SEED_HANDLE,
      tasksOrg: SEED_TASKS_ORG,
      widgetsOrg: SEED_WIDGETS_ORG
    }
  );
}

async function seedOwnerProfile(page: Page) {
  await page.addInitScript(
    ({ handle, tasksOrg, widgetsOrg, sshPublicKeys }) => {
      const profile = {
        id: 'profile-demo',
        userId: 'user-demo',
        username: handle,
        primaryHandle: handle,
        primaryHandleType: 'email',
        displayName: 'Demo Builder',
        bio: 'Building reliable solver flows.',
        isPublic: true,
        socialLinks: [
          {
            id: 'social-github',
            type: 'github',
            label: 'GitHub',
            value: 'https://github.com/demo'
          }
        ],
        referralPercent: 10,
        bonusBalanceUsd: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        metadata: {
          tasksOrg,
          widgetsOrg,
          profileSetupCompleted: true,
          sshPublicKeys: sshPublicKeys.split('\n')
        }
      };
      window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
      window.localStorage.setItem(
        'auth-session',
        JSON.stringify({
          address: null,
          chainId: null,
          email: 'demo@example.test',
          userId: 'user-demo',
          handle,
          displayName: 'Demo Builder',
          authType: 'email',
          connectedAt: Date.now()
        })
      );
    },
    {
      handle: SEED_HANDLE,
      tasksOrg: SEED_TASKS_ORG,
      widgetsOrg: SEED_WIDGETS_ORG,
      sshPublicKeys: SEED_SSH_PUBLIC_KEYS
    }
  );
}

test.describe('Profile repository public view', () => {
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

test.describe('Profile repository owner editor', () => {
  test('keeps owner social link editor rows compact', async ({ page }) => {
    await seedOwnerProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-editor')).toBeVisible();
    const socialInput = page.getByTestId('profile-social-link-input').first();
    await expect(socialInput).toHaveValue('https://github.com/demo');

    const metrics = await socialInput.evaluate((element) => {
      const inputStyle = window.getComputedStyle(element);
      const row = element.closest('[data-testid="profile-social-link-row"]') as HTMLElement | null;
      return {
        fontSize: Number.parseFloat(inputStyle.fontSize),
        rowHeight: row?.getBoundingClientRect().height ?? 0
      };
    });

    expect(metrics.fontSize).toBeLessThanOrEqual(15);
    expect(metrics.rowHeight).toBeLessThanOrEqual(44);
  });

  test('moves SSH public keys into owner settings and removes private key fields', async ({
    page
  }) => {
    await seedOwnerProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-editor')).toBeVisible();
    await expect(page.getByTestId('profile-settings-panel')).toHaveCount(0);
    await page.getByTestId('profile-settings-trigger').click();
    const settingsZone = page.locator('lef-profile-zone[data-zone="settings"]');
    await expect(settingsZone.getByTestId('profile-ssh-public-keys')).toHaveValue(SEED_SSH_PUBLIC_KEYS);
    await expect(page.locator('lef-profile-zone[data-zone="private"]')).toHaveCount(0);
    await expect(page.getByText('Private key', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Short info', { exact: true })).toHaveCount(0);
  });

  test('keeps profile export in a header menu and exposes owner settings controls', async ({
    page
  }) => {
    await seedOwnerProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await expect(page.getByTestId('profile-editor')).toBeVisible();
    await expect(page.getByTestId('profile-social-download')).toHaveCount(0);

    await page.getByTestId('profile-social-menu-trigger').click();
    await expect(page.getByTestId('profile-social-open')).toBeVisible();
    await expect(page.getByTestId('profile-social-copy')).toBeVisible();
    await expect(page.getByTestId('profile-social-download')).toBeVisible();

    await expect(page.getByTestId('profile-settings-panel')).toHaveCount(0);
    await page.getByTestId('profile-settings-trigger').click();
    await expect(page.getByTestId('profile-settings-modal')).toBeVisible();
    await expect(page.getByTestId('profile-settings-panel')).toBeVisible();
    await expect(page.getByTestId('profile-theme-settings')).toBeVisible();
    await expect(page.getByTestId('profile-language-settings')).toBeVisible();
    await expect(page.getByTestId('profile-ssh-public-keys')).toBeVisible();

    await page.getByTestId('profile-theme-option-dark').click();
    await expect(page.locator('html')).toHaveAttribute('data-kefine-theme', 'dark');

    await page.getByTestId('profile-locale-option-ru').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ru');
  });

  test('saves multiple SSH public keys as a plural payload', async ({ page }) => {
    let sshPayload: { publicKeys?: string[] } | null = null;
    await page.route(`**/actor/${SEED_HANDLE}/keys/ssh`, async (route) => {
      sshPayload = route.request().postDataJSON() as { publicKeys?: string[] };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          actorHandle: SEED_HANDLE,
          publicKey: sshPayload.publicKeys?.[0] ?? '',
          publicKeys: sshPayload.publicKeys ?? []
        })
      });
    });

    await seedOwnerProfile(page);
    await page.goto(`/@${SEED_HANDLE}`);

    await page.getByTestId('profile-settings-trigger').click();
    const publicKeys = page.getByTestId('profile-ssh-public-keys');
    await publicKeys.fill(`${SEED_SSH_PUBLIC_KEYS}\n${SEED_SSH_PUBLIC_KEYS.split('\n')[0]}`);
    await page.getByTestId('profile-settings-panel').getByRole('button', { name: 'Save workspace' }).click();

    await expect
      .poll(() => sshPayload?.publicKeys?.length ?? 0)
      .toBe(2);
    expect(sshPayload?.publicKeys).toEqual(SEED_SSH_PUBLIC_KEYS.split('\n'));

    const storedMetadata = await page.evaluate(() => {
      const [profile] = JSON.parse(window.localStorage.getItem('kefine-profiles-v1') ?? '[]');
      return profile?.metadata;
    });
    expect(storedMetadata.sshPublicKeys).toEqual(SEED_SSH_PUBLIC_KEYS.split('\n'));
    expect(storedMetadata.sshPublicKey).toBe(SEED_SSH_PUBLIC_KEYS.split('\n')[0]);
  });
});
