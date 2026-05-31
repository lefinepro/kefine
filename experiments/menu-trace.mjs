import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { const t=m.text(); if(t.includes('[menu]')) console.log('PAGE>', t); });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });
  console.log('=== CLICK INPUT ===');
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.waitForTimeout(500);
  console.log('chips after click:', await page.evaluate(()=>document.querySelectorAll("button[data-part='composer-chip']").length));
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
