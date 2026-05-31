import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.addInitScript(() => localStorage.setItem('kefine-theme', 'dark'));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });
  await page.waitForFunction(() => { const el=document.querySelector('[data-testid="kefine-task-input"]'); return el && Object.getOwnPropertySymbols(el).length>0; });
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.keyboard.type('Нужен hello world на rust', { delay: 10 });
  await page.waitForTimeout(300);
  // crop to the menu region
  await page.screenshot({ path: 'experiments/dark-rest.png', clip: { x: 140, y: 290, width: 1000, height: 170 } });
  // hover the tag chip
  const tag = page.locator("button[data-part='composer-chip'][data-part-tag='true']");
  const b = await tag.boundingBox();
  await page.mouse.move(b.x+b.width/2, b.y+b.height/2);
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'experiments/dark-rest-hover.png', clip: { x: 140, y: 290, width: 1000, height: 170 } });
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
