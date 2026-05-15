import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

async function loadChromium() {
  const candidates = ['playwright', '/home/box/.nvm/versions/node/v20.20.2/lib/node_modules/playwright/index.js'];
  for (const id of candidates) {
    try {
      const mod = require(id);
      const browser = await mod.chromium.launch();
      await browser.close();
      return mod.chromium;
    } catch {}
  }
  throw new Error('No working playwright installation found.');
}

const chromium = await loadChromium();

const html = `<!doctype html>
<html data-kefine-theme="dark">
  <head><meta charset="utf-8" /><style>
    :root { --kef-bg:#17110d; --kef-bg-card:#1d1510; --kef-primary:#c89a5a; --lefine-text:#e7d6b7; }
    body { background:#17110d; color:#e7d6b7; padding:32px; font-family:'Inter',system-ui,sans-serif; }
    kefine-solver-search-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      gap: 0.72rem;
      min-height: 2.85rem;
      padding: 0.42rem 0.5rem 0.42rem 0.78rem;
      border-radius: 0.38rem;
      background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    }
    kefine-solver-search-row lefine-text {
      min-width: 0;
      overflow: hidden;
      color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
      font-size: 0.92rem;
      font-weight: 650;
      line-height: 1;
      padding-block: 0.15rem 0;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    kefine-solver-search-indicator {
      position: relative;
      display: inline-grid;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      color: color-mix(in oklab, var(--kef-primary) 88%, #166534);
      background: color-mix(in oklab, var(--kef-primary) 9%, var(--kef-bg-card));
    }
    kefine-solver-search-dot {
      display: block;
      width: 0.42rem;
      height: 0.42rem;
      border-radius: 999px;
      background: currentColor;
    }
  </style></head>
<body>
  <kefine-solver-search-row id="row">
    <lefine-text id="text">Нужен мини прокси на go</lefine-text>
    <kefine-solver-search-indicator id="indicator">
      <kefine-solver-search-dot></kefine-solver-search-dot>
    </kefine-solver-search-indicator>
  </kefine-solver-search-row>
</body></html>`;

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1380, height: 240 }, deviceScaleFactor: 2 });
const page = await context.newPage();
await page.setContent(html);
await page.waitForTimeout(120);
const info = await page.evaluate(() => {
  const row = document.getElementById('row');
  const text = document.getElementById('text');
  const indicator = document.getElementById('indicator');
  const rowRect = row.getBoundingClientRect();
  const textRect = text.getBoundingClientRect();
  const indicatorRect = indicator.getBoundingClientRect();
  return {
    rowCenterY: rowRect.top + rowRect.height / 2,
    textCenterY: textRect.top + textRect.height / 2,
    textTop: textRect.top,
    textBottom: textRect.bottom,
    textHeight: textRect.height,
    indicatorCenterY: indicatorRect.top + indicatorRect.height / 2,
    rowHeight: rowRect.height,
    indicatorHeight: indicatorRect.height,
  };
});
console.log(JSON.stringify(info, null, 2));
await page.screenshot({ path: '/tmp/gh-issue-solver-1778656622408/experiments/prod-search-row.png', fullPage: true });
await browser.close();
