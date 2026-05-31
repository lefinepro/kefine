import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  const chipsCount = () => page.evaluate(() => document.querySelectorAll("button[data-part='composer-chip']").length);
  const input = page.locator('[data-testid="kefine-task-input"]');
  await input.click();
  for (let i=0;i<10;i++){ console.log('t+'+(i*100)+'ms chips=', await chipsCount()); await page.waitForTimeout(100); }
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
