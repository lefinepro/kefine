import { createRequire } from 'node:module';
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
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 908 } });

await page.goto('file://' + resolve(here, 'solver-detail-testing-demo.html'));

const result = await page.evaluate(() => {
  const select = document.querySelector('.method-select');
  const shell = document.querySelector('.method-select-shell');
  if (!(select instanceof HTMLSelectElement) || !shell) return null;

  return {
    methods: Array.from(select.options).map((option) => option.value),
    selected: select.value,
    chevronBorderRight: getComputedStyle(shell, '::after').borderRightWidth,
    chevronBorderBottom: getComputedStyle(shell, '::after').borderBottomWidth
  };
});

if (!result) {
  throw new Error('Method select was not found in the testing demo.');
}

const expected = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
if (result.methods.join(',') !== expected.join(',')) {
  throw new Error(`Unexpected methods: ${result.methods.join(', ')}`);
}

if (result.selected !== 'POST') {
  throw new Error(`Expected POST to be selected by default, got ${result.selected}`);
}

if (result.chevronBorderRight === '0px' || result.chevronBorderBottom === '0px') {
  throw new Error('Method dropdown chevron is not visible.');
}

await page.selectOption('.method-select', 'PATCH');
const selected = await page.locator('.method-select').inputValue();
if (selected !== 'PATCH') {
  throw new Error(`Method select did not update to PATCH, got ${selected}`);
}

console.log('method select options and chevron verified');

await browser.close();
