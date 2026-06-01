import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { const t=m.text(); if(t.includes('[menu]')) console.log('PAGE>', t.slice(0,160)); });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });
  // Wait for Svelte hydration like the e2e helper does
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
  console.log('=== hydrated, real click ===');
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.waitForTimeout(300);
  console.log('chips after click:', await page.evaluate(()=>document.querySelectorAll("button[data-part='composer-chip']").length));

  // Now type text (real human flow), then click each chip
  await page.keyboard.type('Build a Go proxy', { delay: 15 });
  await page.waitForTimeout(200);
  console.log('chips after typing:', await page.evaluate(()=>document.querySelectorAll("button[data-part='composer-chip']").length));
  await page.screenshot({ path: 'experiments/hyd-01-typed.png' });

  const clickChip = async (sel, label) => {
    const c = page.locator(sel);
    if (!await c.count()) { console.log(label, 'NOT FOUND'); return; }
    const b = await c.boundingBox();
    await page.mouse.move(b.x+b.width/2, b.y+b.height/2); await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
    await page.waitForTimeout(250);
  };
  await clickChip("button[data-part='composer-chip']:has-text('+ ETA')", 'ETA');
  console.log('ETA input visible:', await page.locator("input[data-part='execution-estimate-input']").isVisible().catch(()=>false));
  await clickChip("button[data-part='composer-chip'][data-part-tag='true']", 'tag');
  console.log('tag input visible:', await page.locator("input[data-part='tag-input']").isVisible().catch(()=>false));
  await page.screenshot({ path: 'experiments/hyd-02-after.png' });
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
