import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

async function loadChromium() {
  const candidates = [
    'playwright',
    '/home/box/.nvm/versions/node/v20.20.2/lib/node_modules/playwright/index.js'
  ];
  for (const id of candidates) {
    try {
      const mod = require(id);
      const browser = await mod.chromium.launch();
      await browser.close();
      return mod.chromium;
    } catch {
      // try next candidate
    }
  }
  throw new Error('No working playwright installation found. Run "npx playwright install chromium".');
}

const chromium = await loadChromium();
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const outDir = resolve(root, 'docs/screenshots');
mkdirSync(outDir, { recursive: true });

const demos = [
  { name: 'testing', file: 'solver-detail-testing-demo.html' },
  { name: 'source', file: 'solver-detail-layout-demo.html' }
];
const viewports = [
  { tag: 'desktop', width: 1280, height: 908 },
  { tag: 'mobile', width: 414, height: 896 }
];

const browser = await chromium.launch();

for (const demo of demos) {
  for (const { tag, width, height } of viewports) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const fileUrl = 'file://' + resolve(here, demo.file);

    for (const theme of ['light', 'dark']) {
      await page.goto(fileUrl);
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-kefine-theme', t);
      }, theme);
      await page.waitForTimeout(150);
      const out = resolve(outDir, `solver-tabs-r18-${demo.name}-${tag}-${theme}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log('saved', out);
    }

    await context.close();
  }
}

await browser.close();
