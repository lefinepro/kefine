import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  const probe = async (l) => console.log(l, JSON.stringify(await page.evaluate(() => ({
    active: document.activeElement?.getAttribute('data-part') || document.activeElement?.tagName,
    chips: [...document.querySelectorAll("button[data-part='composer-chip']")].length,
    metaOpenGuess: !!document.querySelector("[data-part='input-meta']"),
  }))));

  const input = page.locator('[data-testid="kefine-task-input"]');
  await input.click();
  await page.waitForTimeout(150);
  await probe('after click (empty)');

  await page.keyboard.type('build a website', { delay: 20 });
  await page.waitForTimeout(200);
  await probe('after typing (keyboard)');

  // Now blur to body then click a chip if visible
  await page.screenshot({ path: 'experiments/type-01.png' });

  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
