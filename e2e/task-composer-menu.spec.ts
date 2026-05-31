import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Task composer menu', () => {
  test('composer chips are clickable and reveal their editors', async ({ page }) => {
    // Keep the backend health check green so the create screen (which hosts the
    // composer menu) stays mounted instead of fading to the "unavailable" screen.
    await page.route('**/api/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    // Focusing the task input opens the composer strip ("menu").
    await page.getByTestId('kefine-task-input').focus();

    const chips = page.locator("button[data-part='composer-chip']");
    await expect(chips.first()).toBeVisible();

    // Every menu item must look clickable (pointer cursor), not like static text.
    const count = await chips.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let index = 0; index < count; index += 1) {
      const style = await chips.nth(index).evaluate((node) => {
        const computed = getComputedStyle(node);
        return {
          cursor: computed.cursor,
          borderStyle: computed.borderTopStyle,
          borderWidth: computed.borderTopWidth
        };
      });
      expect(style.cursor).toBe('pointer');
      // A clickable chip must have a visible outline/border at rest so it reads
      // as a button, not flat text (the original "Bad" feedback on the menu).
      expect(style.borderStyle).not.toBe('none');
      expect(Number.parseFloat(style.borderWidth)).toBeGreaterThan(0);
    }

    // The tag chip is clickable: clicking it swaps in the tag editor input.
    await page.locator("button[data-part='composer-chip'][data-part-tag='true']").click();
    await expect(page.locator("input[data-part='tag-input']")).toBeVisible();

    // The ETA chip is clickable: clicking it swaps in the execution-estimate input.
    await page.locator("button[data-part='composer-chip']", { hasText: '+ ETA' }).click();
    await expect(page.locator("input[data-part='execution-estimate-input']")).toBeVisible();
  });
});
