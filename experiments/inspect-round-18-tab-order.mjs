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

async function inspectDemo(fileName, expectedActive) {
  await page.goto('file://' + resolve(here, fileName));

  const result = await page.evaluate(() => {
    const tabs = [...document.querySelectorAll('.view-tab')];
    return tabs.map((tab) => {
      const rect = tab.getBoundingClientRect();
      return {
        label: tab.textContent?.trim() ?? '',
        selected: tab.getAttribute('aria-selected') === 'true',
        left: rect.left
      };
    });
  });

  const labels = result.map((tab) => tab.label);
  if (labels.join('|') !== 'Testing|Source') {
    throw new Error(`${fileName}: expected tab order Testing|Source, got ${labels.join('|')}`);
  }

  if (!(result[0].left < result[1].left)) {
    throw new Error(`${fileName}: Testing is not visually before Source.`);
  }

  const active = result.find((tab) => tab.selected)?.label;
  if (active !== expectedActive) {
    throw new Error(`${fileName}: expected active tab ${expectedActive}, got ${active ?? 'none'}.`);
  }
}

await inspectDemo('solver-detail-testing-demo.html', 'Testing');
await inspectDemo('solver-detail-layout-demo.html', 'Source');

console.log('tab order verified: Testing appears before Source in both demos');

await browser.close();
