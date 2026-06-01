import { chromium } from '@playwright/test';
const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', m => { const t=m.text(); if(t.includes('[menu]')) console.log('PAGE>', t.slice(0,160)); });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  // What element is at the textarea's center point?
  const info = await page.evaluate(() => {
    const ta = document.getElementById('order-title');
    const r = ta.getBoundingClientRect();
    const cx = r.x + r.width/2, cy = r.y + r.height/2;
    const top = document.elementFromPoint(cx, cy);
    return { rect: {x:r.x,y:r.y,w:r.width,h:r.height}, topTag: top?.tagName, topId: top?.id, topPart: top?.getAttribute?.('data-part'), sameAsTextarea: top === ta };
  });
  console.log('elementFromPoint at textarea center:', JSON.stringify(info));

  console.log('=== real click ===');
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.waitForTimeout(300);
  console.log('active after click:', await page.evaluate(()=> document.activeElement?.id || document.activeElement?.tagName));
  console.log('chips:', await page.evaluate(()=>document.querySelectorAll("button[data-part='composer-chip']").length));
  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
