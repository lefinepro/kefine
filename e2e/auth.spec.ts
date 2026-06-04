import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockPrivateKeyAuth, readActorPrivateKeyCompact } from './helpers/kefine';

test.describe('Auth Flows', () => {
  test('privatekey login works with compact pqsk key and sends only local public key string to auth', async ({ page }) => {
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

  test('workspace owner can create and copy a solver profile token', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await mockPrivateKeyAuth(page);

    await gotoAndWaitForReady(page);

    await page.locator("button[data-part='auth']").click();
    await page.getByTestId('kefine-privatekey-auth-tile').click();
    await page.getByTestId('kefine-privatekey-input').fill(readActorPrivateKeyCompact());
    await page.getByTestId('kefine-privatekey-submit').click();

    await expect(page).toHaveURL(/\/@api$/);
    await page.getByRole('button', { name: 'Continue to social links' }).click();
    await page.getByRole('button', { name: 'Finish setup' }).click();

    const solverPanel = page.getByTestId('kefine-solver-profile-panel');
    await expect(solverPanel).toBeVisible();
    await expect(solverPanel).toContainText('Connect a local inference endpoint');

    await page.getByTestId('kefine-solver-profile-create').click();

    const tokenField = page.getByTestId('kefine-solver-profile-token');
    await expect(tokenField).toBeVisible();
    const token = await tokenField.inputValue();
    expect(token).toMatch(/^lepos_solver_[a-z0-9]+$/);

    // The solver (inbox identity) is created automatically with a random handle.
    const solverHandle = (await page.getByTestId('kefine-solver-profile-handle').innerText()).trim();
    expect(solverHandle).toMatch(/^@solver-[a-z0-9]{8}$/);

    // The local inbox is derived from that random solver handle.
    await expect(page.getByTestId('kefine-solver-profile-inbox')).toContainText(
      `http://127.0.0.1:4501/solvers/${solverHandle.slice(1)}/inbox`
    );

    // The solver returns its processed results to the platform's /api/responses.
    await expect(page.getByTestId('kefine-solver-profile-responses')).toContainText(
      'http://127.0.0.1:4501/api/responses'
    );

    await page.getByTestId('kefine-solver-profile-copy').click();
    await expect(page.getByTestId('kefine-solver-profile-copy')).toContainText('Token copied');
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(token);

    await page.reload();
    await expect(page.getByTestId('kefine-solver-profile-token')).toHaveValue(token);
    await expect(page.getByTestId('kefine-solver-profile-handle')).toHaveText(solverHandle);
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

  test('sign in button recovers when the auth drawer lazy load fails', async ({ page }) => {
    await gotoAndWaitForReady(page);

    let blockedAuthDrawerModule = false;
    await page.route(/\/src\/lib\/components\/kefine\/KefineAuthDialog\.svelte(?:\?|$)/, async (route) => {
      blockedAuthDrawerModule = true;
      await route.abort('failed');
    });

    const authButton = page.locator("button[data-part='auth']");
    await authButton.click();

    await expect.poll(() => blockedAuthDrawerModule).toBe(true);
    await expect(authButton).toBeEnabled();
    await expect(authButton).toHaveAttribute('data-loading', 'false');
  });
});
