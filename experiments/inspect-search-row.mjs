import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const fileUrl = 'file://' + resolve(here, 'main-page-layout-demo.html');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1380, height: 980 }, deviceScaleFactor: 2 });
const page = await context.newPage();
await page.goto(fileUrl);
await page.evaluate(() => document.documentElement.setAttribute('data-kefine-theme', 'dark'));
await page.waitForTimeout(120);

const info = await page.evaluate(() => {
  const row = document.querySelector('.search-row');
  const text = row.querySelector('.text');
  const indicator = row.querySelector('.indicator');
  const rowRect = row.getBoundingClientRect();
  const textRect = text.getBoundingClientRect();
  const indicatorRect = indicator.getBoundingClientRect();
  const textCS = getComputedStyle(text);
  const rowCS = getComputedStyle(row);
  return {
    rowRect,
    textRect,
    indicatorRect,
    rowPadding: rowCS.padding,
    textLineHeight: textCS.lineHeight,
    textFontSize: textCS.fontSize,
    textCenterY: textRect.top + textRect.height / 2,
    rowCenterY: rowRect.top + rowRect.height / 2,
    indicatorCenterY: indicatorRect.top + indicatorRect.height / 2,
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
