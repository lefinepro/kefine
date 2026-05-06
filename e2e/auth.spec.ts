import { expect, test } from '@playwright/test';

import { actorPrivateKeyExists, gotoAndWaitForReady, mockPrivateKeyAuth, readActorPrivateKeyCompact } from './helpers/kefine';

test.describe('Auth Flows', () => {
  test('privatekey login works with compact pqsk key and sends only local public key string to auth', async ({ page }) => {
    test.skip(!actorPrivateKeyExists(), 'actor-privatekey.pem not available in this environment');
    await mockPrivateKeyAuth(page);

    await gotoAndWaitForReady(page);

    await page.locator("button[data-part='auth']").click();
    await page.getByTestId('kefine-privatekey-auth-tile').click();
    await page.getByTestId('kefine-privatekey-input').fill(readActorPrivateKeyCompact());
    await page.getByTestId('kefine-privatekey-submit').click();

    await expect(page).toHaveURL(/\/@api$/);
    await expect(page.getByTestId('kefine-profile-first-name')).toBeVisible();
    await expect(page.getByTestId('kefine-profile-surname')).toBeVisible();
    await expect(page.getByTestId('kefine-profile-handle')).toHaveValue('api');
  });

  test('privatekey dialog accepts multiline key text input', async ({ page }) => {
    await gotoAndWaitForReady(page);

    await page.locator("button[data-part='auth']").click();
    await page.getByTestId('kefine-privatekey-auth-tile').click();

    const pemKey = `-----BEGIN PRIVATE KEY-----
line-1
line-2
-----END PRIVATE KEY-----`;

    await page.getByTestId('kefine-privatekey-input').fill(pemKey);
    await expect(page.getByTestId('kefine-privatekey-input')).toHaveValue(pemKey);
  });
});
