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

const layout = await page.evaluate(() => {
  const field = document.querySelector('.body-field');
  const nameInput = document.querySelector('input[aria-label="Request body field name"]');
  const valueInput = document.querySelector('input[aria-label="Request body ping value"]');
  if (!(field instanceof HTMLElement) || !(nameInput instanceof HTMLElement) || !(valueInput instanceof HTMLElement)) {
    return null;
  }

  const style = getComputedStyle(field);
  const nameRect = nameInput.getBoundingClientRect();
  const valueRect = valueInput.getBoundingClientRect();

  return {
    display: style.display,
    flexDirection: style.flexDirection,
    nameBottom: nameRect.bottom,
    nameTop: nameRect.top,
    valueTop: valueRect.top,
    valueLeft: valueRect.left,
    nameLeft: nameRect.left
  };
});

if (!layout) {
  throw new Error('Expected request body form field controls to exist.');
}

if (layout.display !== 'flex' || layout.flexDirection !== 'column') {
  throw new Error(`Expected body field group to be a vertical flex stack, got ${JSON.stringify(layout)}.`);
}

if (layout.valueTop <= layout.nameBottom) {
  throw new Error(`Expected value input below field input, got ${JSON.stringify(layout)}.`);
}

if (Math.abs(layout.valueLeft - layout.nameLeft) > 1) {
  throw new Error(`Expected stacked inputs to align on the same left edge, got ${JSON.stringify(layout)}.`);
}

await browser.close();

console.log('vertical request body fields verified');
