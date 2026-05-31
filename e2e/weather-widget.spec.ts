import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Weather widget', () => {
  test('appears for a weather prompt and switches units', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
    });
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    const input = page.getByTestId('kefine-task-input');
    await input.focus();
    await input.pressSequentially('Погода Гомель');

    const widget = page.getByTestId('kefine-weather-widget');
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('Гомель');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('14°');
    await expect(widget.locator("[data-part='weather-hour']")).toHaveCount(8);
    await expect(widget.locator("[data-part='weather-day']")).toHaveCount(7);

    const fahrenheitButton = widget.getByRole('button', { name: 'Fahrenheit' });
    await expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');
    await fahrenheitButton.click();
    await expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('57°');
  });
});
