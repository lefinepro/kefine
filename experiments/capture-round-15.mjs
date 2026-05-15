import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

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

const pages = [
  { name: 'solver-detail', file: 'solver-detail-layout-demo.html' },
  { name: 'solver-testing', file: 'solver-detail-testing-demo.html' }
];

const viewports = [
  { tag: 'desktop', width: 1280, height: 908 },
  { tag: 'mobile', width: 414, height: 896 }
];

const browser = await chromium.launch();

for (const { tag, width, height } of viewports) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await context.newPage();

  for (const { name, file } of pages) {
    const fileUrl = 'file://' + resolve(here, file);
    for (const theme of ['light', 'dark']) {
      await page.goto(fileUrl);
      await page.evaluate((t) => {
        document.documentElement.setAttribute('data-kefine-theme', t);
      }, theme);
      await page.waitForTimeout(150);
      const out = resolve(outDir, `${name}-r15-${tag}-${theme}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log('saved', out);
    }
  }

  await context.close();
}

await browser.close();
