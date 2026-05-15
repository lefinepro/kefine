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

const initial = await page.evaluate(() => ({
  testCase: document.querySelector('.testing-case')?.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  activeMode: document.querySelector('[data-body-mode][data-active="true"]')?.textContent?.trim() ?? '',
  fieldName: document.querySelector('input[aria-label="Request body field name"]')?.value ?? '',
  fieldValue: document.querySelector('input[aria-label="Request body ping value"]')?.value ?? '',
  formHidden: document.querySelector('.body-form')?.hidden ?? true,
  jsonHidden: document.querySelector('.body-input')?.hidden ?? false
}));

if (!initial.testCase.includes('Test 1') || !initial.testCase.includes('POST / returns proxy ready')) {
  throw new Error(`Expected short test case row, got "${initial.testCase}".`);
}

if (initial.activeMode !== 'Form' || initial.formHidden || !initial.jsonHidden) {
  throw new Error(`Expected request body to open in Form mode, got ${JSON.stringify(initial)}.`);
}

if (initial.fieldName !== 'ping' || initial.fieldValue !== 'hello') {
  throw new Error(`Expected filled ping=hello body field, got ${JSON.stringify(initial)}.`);
}

await page.locator('[data-body-mode="json"]').click();

const jsonMode = await page.evaluate(() => ({
  activeMode: document.querySelector('[data-body-mode][data-active="true"]')?.textContent?.trim() ?? '',
  formHidden: document.querySelector('.body-form')?.hidden ?? false,
  jsonHidden: document.querySelector('.body-input')?.hidden ?? true,
  jsonText: document.querySelector('.body-input')?.textContent?.trim() ?? ''
}));

if (jsonMode.activeMode !== '{} JSON' || !jsonMode.formHidden || jsonMode.jsonHidden) {
  throw new Error(`Expected request body to switch to JSON mode, got ${JSON.stringify(jsonMode)}.`);
}

if (!jsonMode.jsonText.includes('"ping": "hello"')) {
  throw new Error(`Expected JSON body to preserve ping=hello, got "${jsonMode.jsonText}".`);
}

await browser.close();

console.log('testing body form/json switch verified');
