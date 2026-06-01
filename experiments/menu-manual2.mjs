import { chromium } from '@playwright/test';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  const probe = async (label) => {
    const r = await page.evaluate(() => {
      const active = document.activeElement;
      const chips = [...document.querySelectorAll("button[data-part='composer-chip']")];
      const meta = document.querySelector("[data-part='input-meta']");
      return {
        active: active ? (active.tagName + '#' + active.id + '.' + active.getAttribute('data-part')) : null,
        chipCount: chips.length,
        chipText: chips.map(c=>c.textContent.trim()),
        metaPresent: !!meta,
      };
    });
    console.log(label, JSON.stringify(r));
  };

  await probe('initial');
  // Use focus like the e2e test
  await page.locator('[data-testid="kefine-task-input"]').focus();
  await page.waitForTimeout(200);
  await probe('after focus()');

  // Now try a real mouse click instead
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.waitForTimeout(200);
  await probe('after click()');

  await page.screenshot({ path: 'experiments/03-after-focus-click.png' });

  // Now click the tag chip with real mouse if present
  const tag = page.locator("button[data-part='composer-chip'][data-part-tag='true']");
  if (await tag.count()) {
    const box = await tag.boundingBox();
    await page.mouse.move(box.x+box.width/2, box.y+box.height/2);
    await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
    await page.waitForTimeout(250);
    await probe('after tag mousedown/up');
    console.log('tagInput visible:', await page.locator("input[data-part='tag-input']").isVisible().catch(()=>false));
    await page.screenshot({ path: 'experiments/04-after-tagclick.png' });
  }

  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
