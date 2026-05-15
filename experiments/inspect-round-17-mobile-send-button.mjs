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
const page = await browser.newPage({ viewport: { width: 414, height: 896 } });

await page.goto('file://' + resolve(here, 'solver-detail-testing-demo.html'));

const metrics = await page.evaluate(() => {
  const button = document.querySelector('.send-btn');
  const row = document.querySelector('.testing-row');
  if (!(button instanceof HTMLElement) || !(row instanceof HTMLElement)) return null;

  const buttonRect = button.getBoundingClientRect();
  const rowStyles = getComputedStyle(row);
  const buttonStyles = getComputedStyle(button);

  return {
    buttonHeight: buttonRect.height,
    buttonWidth: buttonRect.width,
    rowColumns: rowStyles.gridTemplateColumns,
    paddingBlock: `${buttonStyles.paddingTop} ${buttonStyles.paddingBottom}`
  };
});

if (!metrics) {
  throw new Error('Mobile Testing send button was not found in the demo.');
}

if (metrics.rowColumns.trim() !== `${metrics.buttonWidth}px`) {
  throw new Error(`Expected stacked one-column mobile row, got ${metrics.rowColumns}`);
}

if (metrics.buttonHeight < 40) {
  throw new Error(
    `Expected mobile Send button to be at least 40px tall, got ${metrics.buttonHeight}px (${metrics.paddingBlock}).`
  );
}

console.log(`mobile send button verified: ${metrics.buttonWidth}x${metrics.buttonHeight}`);

await browser.close();
