import { chromium } from '@playwright/test';

const run = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.route('**/api/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' })
  );
  // Mock orders list minimal
  await page.route('**/api/profile**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"orders":[]}' }));

  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));

  await page.goto('http://localhost:5173/');
  await page.waitForSelector('[data-testid="kefine-task-input"]', { timeout: 10000 });

  // Focus input to open the composer menu
  await page.locator('[data-testid="kefine-task-input"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'experiments/01-menu-open.png' });

  const chipsBefore = await page.locator("button[data-part='composer-chip']").allInnerTexts();
  console.log('CHIPS:', JSON.stringify(chipsBefore));

  // Realistic click on the "Add tag" chip (real mouse down/up at coordinates)
  const tagChip = page.locator("button[data-part='composer-chip'][data-part-tag='true']");
  const box = await tagChip.boundingBox();
  console.log('tag chip box:', JSON.stringify(box));
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await page.mouse.down();
  await page.waitForTimeout(50);
  await page.mouse.up();
  await page.waitForTimeout(300);
  const tagInputVisible = await page.locator("input[data-part='tag-input']").isVisible().catch(()=>false);
  const menuStillOpen = await page.locator("button[data-part='composer-chip']").first().isVisible().catch(()=>false);
  console.log('After tag chip click -> tagInputVisible:', tagInputVisible, 'menuStillOpen:', menuStillOpen);
  await page.screenshot({ path: 'experiments/02-after-tag.png' });

  await browser.close();
  console.log('CONSOLE LOGS:\n' + logs.join('\n'));
};
run().catch((e)=>{ console.error(e); process.exit(1); });
