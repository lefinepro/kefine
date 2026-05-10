import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });

const fileUrl = 'file://' + resolve(here, 'solver-detail-layout-demo.html');
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1380, height: 980 }, deviceScaleFactor: 2 });
const page = await context.newPage();

for (const theme of ['light', 'dark']) {
  await page.goto(fileUrl);
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-kefine-theme', t);
  }, theme);
  await page.waitForTimeout(120);
  const out = resolve(outDir, `solver-detail-r7-${theme}.png`);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
}

await browser.close();
