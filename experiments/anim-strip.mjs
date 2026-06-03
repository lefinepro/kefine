// Renders a horizontal strip of N frames captured at evenly spaced times
// during the solver-row animation, for both light and dark themes.
// Output: docs/screenshots/solver-rows-anim-strip-{light,dark}.png
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = `file://${path.resolve(__dirname, 'animation-demo.html')}`;
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1280, height: 720 };
const STAGES_MS = [0, 250, 500, 800, 1200];

async function captureStrip(theme) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(HTML);
  await page.evaluate((t) => document.documentElement.setAttribute('data-kefine-theme', t), theme);
  await page.addStyleTag({ content: `* { animation-play-state: paused !important; }` });
  await page.evaluate(() => window.replayAnimation());
  await page.waitForTimeout(50);

  const dataUrls = [];
  for (const t of STAGES_MS) {
    await page.evaluate((tMs) => {
      document.querySelectorAll('.solution-row').forEach((el, idx) => {
        const baseDelay = idx * 70;
        el.style.animationDelay = `${-tMs + baseDelay}ms`;
        el.style.animationPlayState = 'paused';
      });
    }, t);
    const buf = await page.screenshot({ type: 'png', fullPage: false });
    dataUrls.push(`data:image/png;base64,${buf.toString('base64')}`);
  }

  // Build a composite page: stages side-by-side with a label per frame.
  const stripWidth = STAGES_MS.length * VIEWPORT.width + (STAGES_MS.length - 1) * 24;
  const composite = `data:text/html;base64,${Buffer.from(`<!doctype html>
<html><head><style>
  body { margin:0; padding:24px; background:${theme === 'dark' ? '#161310' : '#ece4d2'}; font-family: 'Inter', system-ui, sans-serif; color:${theme === 'dark' ? '#ece4cd' : '#2b2415'}; }
  .strip { display:flex; gap:24px; align-items:flex-start; }
  .frame { display:flex; flex-direction:column; align-items:center; gap:8px; }
  .frame img { width:${VIEWPORT.width}px; height:${VIEWPORT.height}px; border:1px solid ${theme === 'dark' ? '#3a3528' : '#d6cdb6'}; border-radius:8px; }
  .label { font-size:18px; font-weight:600; }
</style></head><body>
<div class="strip">
  ${STAGES_MS.map((t, i) => `<div class="frame"><div class="label">t = ${t} ms</div><img src="${dataUrls[i]}" /></div>`).join('')}
</div>
</body></html>`).toString('base64')}`;

  await page.setViewportSize({ width: stripWidth + 48, height: VIEWPORT.height + 100 });
  await page.goto(composite);
  await page.waitForLoadState('networkidle');
  const out = path.join(OUT_DIR, `solver-rows-anim-strip-${theme}.png`);
  await page.screenshot({ path: out, fullPage: false });
  console.log(`wrote ${out}`);
  await browser.close();
}

await captureStrip('light');
await captureStrip('dark');
