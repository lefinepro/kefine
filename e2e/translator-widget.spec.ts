import { expect, test } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

test.describe('Translator widget', () => {
  test('appears for generic translation prompts and preselects requested languages', async ({ page }) => {
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    const input = page.getByTestId('kefine-task-input');
    await input.focus();
    await input.pressSequentially('Перевод');

    const widget = page.getByTestId('kefine-translator-widget');
    await expect(widget).toBeVisible();
    await expect(widget.locator("[data-part='translator-source-pane']")).toBeVisible();
    await expect(widget.locator("[data-part='translator-target-pane']")).toBeVisible();
    await expect(widget.locator("[data-part='translator-source-input']")).toHaveValue('');
    await expect(widget.locator("[data-part='translator-target-output']")).toHaveValue('');

    await input.fill('');
    await input.pressSequentially('Перевод с китайского на английский');

    await expect(widget.locator("[data-part='translator-source-language']")).toContainText(/Chinese|Китайский/);
    await expect(widget.locator("[data-part='translator-target-language']")).toContainText(/English|Английский/);

    await widget.locator("[data-part='translator-source-input']").fill('你好');
    await expect(widget.locator("[data-part='translator-target-output']")).toHaveValue('hello');
  });
});
