import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => console.log('PAGE>', m.type(), m.text().slice(0,120)));
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });
  console.log('=== dispatch native focus+click via dispatchEvent ===');
  await page.evaluate(() => {
    const ta = document.getElementById('order-title');
    ta.focus();
  });
  await page.waitForTimeout(300);
  console.log('chips:', await page.evaluate(()=>document.querySelectorAll("button[data-part='composer-chip']").length));
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
