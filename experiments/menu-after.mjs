import { chromium } from '@playwright/test';

const shot = async (theme) => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    colorScheme: theme
  });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.addInitScript((t) => localStorage.setItem('kefine-theme', t), theme);
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.keyboard.type('Нужен hello world на rust', { delay: 8 });
  await page.waitForTimeout(350);
  const clip = { x: 140, y: 290, width: 1000, height: 170 };
  await page.screenshot({ path: `experiments/after-${theme}-rest.png`, clip });
  const tag = page.locator("button[data-part='composer-chip'][data-part-tag='true']");
  const b = await tag.boundingBox();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `experiments/after-${theme}-hover.png`, clip });
  await browser.close();
};

await shot('dark');
await shot('light');
console.log('done');
