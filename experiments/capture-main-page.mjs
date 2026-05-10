import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });

const fileUrl = 'file://' + resolve(here, 'main-page-layout-demo.html');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1380, height: 980 }, deviceScaleFactor: 2 });
const page = await context.newPage();

for (const theme of ['light', 'dark']) {
  await page.goto(fileUrl);
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-kefine-theme', t);
  }, theme);
  await page.waitForTimeout(200);
  const canonical = resolve(outDir, `main-page-${theme}.png`);
  const round = resolve(outDir, `main-page-r7-${theme}.png`);
  await page.screenshot({ path: canonical, fullPage: true });
  await page.screenshot({ path: round, fullPage: true });
  console.log('saved', canonical);
  console.log('saved', round);
}

await browser.close();
