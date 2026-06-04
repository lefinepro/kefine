import { expect, test } from '@playwright/test';

// The profile owner can verify a bank card to claim the workspace bonus. The
// owner editor posts the card number to /api/profile/bin-lookup and renders the
// verification verdict the endpoint returns. We seed the demo profile together
// with a matching auth session so the page renders as the owner, then mock the
// BIN endpoint so the integration is exercised deterministically (the live
// endpoint proxies binlist.net).
const SEED_HANDLE = 'demo';
const SEED_TASKS_ORG = [
  '* TODO Introduce yourself in the bio',
  '* DONE Claim your handle'
].join('\n');

async function seedOwnerProfile(page: import('@playwright/test').Page) {
  await page.addInitScript(
    ({ handle, tasksOrg }) => {
      const profile = {
        id: 'profile-demo',
        userId: 'user-demo',
        username: handle,
        primaryHandle: handle,
        primaryHandleType: 'email',
        displayName: 'Demo Builder',
        email: 'demo@lefine.pro',
        bio: 'Building reliable solver flows.',
        isPublic: true,
        socialLinks: [],
        referralPercent: 10,
        bonusBalanceUsd: 0,
        followersCount: 0,
        followingCount: 0,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        metadata: { tasksOrg, profileSetupCompleted: true, profileSetupStep: 'done' }
      };
      window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
      window.localStorage.setItem(
        'auth-session',
        JSON.stringify({
          address: null,
          chainId: null,
          email: 'demo@lefine.pro',
          userId: 'user-demo',
          handle,
          displayName: 'Demo Builder',
          authType: 'email',
          connectedAt: 1717502400000
        })
      );
    },
    { handle: SEED_HANDLE, tasksOrg: SEED_TASKS_ORG }
  );
}

test.describe('Profile card bonus verification', () => {
  test('an Armenian-bank card verifies and shows the issuer', async ({ page }) => {
    await seedOwnerProfile(page);
    await page.route('**/api/profile/bin-lookup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bin: '40830600',
          scheme: 'visa',
          cardType: 'debit',
          bankName: 'Ameriabank CJSC',
          countryAlpha2: 'AM',
          countryName: 'Armenia',
          isArmenianBank: true,
          bonusEligible: true
        })
      });
    });

    await page.goto(`/@${SEED_HANDLE}`);
    await expect(page.getByTestId('profile-editor')).toBeVisible();

    await page.getByTestId('profile-card-number').fill('4083 0600 0000 0000');
    await page.getByTestId('profile-card-verify').click();

    const status = page.getByTestId('profile-card-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-status', 'verified');
    await expect(status).toContainText('Ameriabank CJSC');
    await expect(status).toContainText('Armenia');
  });

  test('a non-allowlisted card is rejected', async ({ page }) => {
    await seedOwnerProfile(page);
    await page.route('**/api/profile/bin-lookup', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          bin: '41111100',
          scheme: 'visa',
          cardType: 'credit',
          bankName: 'JPMORGAN CHASE BANK N.A.',
          countryAlpha2: 'US',
          countryName: 'United States',
          isArmenianBank: false,
          bonusEligible: false
        })
      });
    });

    await page.goto(`/@${SEED_HANDLE}`);
    await expect(page.getByTestId('profile-editor')).toBeVisible();

    await page.getByTestId('profile-card-number').fill('4111 1100 0000 0000');
    await page.getByTestId('profile-card-verify').click();

    const status = page.getByTestId('profile-card-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveAttribute('data-status', 'rejected');
  });
});
