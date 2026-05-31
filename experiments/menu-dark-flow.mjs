import { chromium } from '@playwright/test';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));

  await page.addInitScript(() => localStorage.setItem('kefine-theme', 'dark'));
  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  const input = page.locator('[data-testid="kefine-task-input"]');
  await input.click();
  await input.fill('Нужен прокси сервер');
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'experiments/dark-01-typed.png' });

  const probe = async (l) => console.log(l, JSON.stringify(await page.evaluate(() => ({
    active: document.activeElement?.getAttribute('data-part') || document.activeElement?.tagName,
    chips: [...document.querySelectorAll("button[data-part='composer-chip']")].map(c=>c.textContent.trim()),
  }))));
  await probe('typed');

  // click ETA
  const eta = page.locator("button[data-part='composer-chip']", { hasText: '+ ETA' });
  const eb = await eta.boundingBox();
  await page.mouse.move(eb.x+eb.width/2, eb.y+eb.height/2); await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
  await page.waitForTimeout(250);
  console.log('ETA input visible:', await page.locator("input[data-part='execution-estimate-input']").isVisible().catch(()=>false));
  await probe('after ETA');
  await page.screenshot({ path: 'experiments/dark-02-eta.png' });

  // type in eta
  const etaInput = page.locator("input[data-part='execution-estimate-input']");
  if (await etaInput.count()) { await etaInput.click(); await etaInput.type('2 hours'); }
  await page.waitForTimeout(150);

  // click Add tag
  const tag = page.locator("button[data-part='composer-chip'][data-part-tag='true']");
  if (await tag.count()) {
    const tb = await tag.boundingBox();
    await page.mouse.move(tb.x+tb.width/2, tb.y+tb.height/2); await page.mouse.down(); await page.waitForTimeout(40); await page.mouse.up();
    await page.waitForTimeout(250);
    console.log('tag input visible:', await page.locator("input[data-part='tag-input']").isVisible().catch(()=>false));
    const ti = page.locator("input[data-part='tag-input']");
    if (await ti.count()) { await ti.type('urgent'); await ti.press('Enter'); }
    await page.waitForTimeout(250);
    console.log('tag pill present:', await page.locator("button[data-part='tag-pill']").count());
  }
  await page.screenshot({ path: 'experiments/dark-03-final.png' });

  await browser.close();
};
run().catch(e=>{console.error(e);process.exit(1);});
