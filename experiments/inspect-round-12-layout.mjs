import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

async function loadChromium() {
  const candidates = ['playwright', '/home/box/.nvm/versions/node/v20.20.2/lib/node_modules/playwright/index.js'];
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

const here = dirname(fileURLToPath(import.meta.url));
const chromium = await loadChromium();
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1380, height: 980 }, deviceScaleFactor: 2 });
const page = await context.newPage();

await page.goto('file://' + resolve(here, 'main-page-layout-demo.html'));
await page.evaluate(() => {
  document.documentElement.setAttribute('data-kefine-theme', 'dark');
});

const layout = await page.evaluate(() => {
  const aside = document.querySelector('.aside')?.getBoundingClientRect();
  const solutions = document.querySelector('.solutions-list')?.getBoundingClientRect();
  const rail = document.querySelector('.rail')?.getBoundingClientRect();
  if (!aside || !solutions || !rail) {
    throw new Error('Missing layout column for measurement.');
  }
  return {
    asideWidth: Math.round(aside.width),
    solutionsWidth: Math.round(solutions.width),
    railWidth: Math.round(rail.width)
  };
});

console.log(layout);

if (layout.asideWidth <= layout.railWidth) {
  throw new Error(`Expected Tasks column to absorb free width. Got tasks=${layout.asideWidth}, rail=${layout.railWidth}.`);
}

if (Math.abs(layout.solutionsWidth - 608) > 2) {
  throw new Error(`Expected solver cards to stay near 38rem/608px. Got ${layout.solutionsWidth}.`);
}

await context.close();
await browser.close();
