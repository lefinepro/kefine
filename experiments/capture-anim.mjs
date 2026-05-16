// Render the standalone solver-row animation and capture frames -> GIF.
// Does NOT launch the kefine app — just opens a single static HTML file.
import { chromium } from 'playwright';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML = `file://${path.resolve(__dirname, 'animation-demo.html')}`;
const FRAMES = path.resolve(__dirname, 'frames');
const OUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
const FFMPEG = path.join(os.homedir(), '.cache', 'ms-playwright', 'ffmpeg-1011', 'ffmpeg-linux');

if (existsSync(FRAMES)) rmSync(FRAMES, { recursive: true });
mkdirSync(FRAMES, { recursive: true });
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORT = { width: 1280, height: 720 };
const FPS = 30;
const DURATION_MS = 1300;
const TOTAL = Math.ceil((DURATION_MS / 1000) * FPS);

async function captureTheme(theme, outBase) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(HTML);
  await page.evaluate((t) => document.documentElement.setAttribute('data-kefine-theme', t), theme);

  // Pause animation immediately so we can step through it deterministically.
  await page.addStyleTag({
    content: `* { animation-play-state: paused !important; }`
  });
  await page.evaluate(() => window.replayAnimation());
  await page.waitForTimeout(50);

  for (let i = 0; i < TOTAL; i++) {
    const t = (i / FPS) * 1000;
    // Set negative animation-delay relative to a "fresh" start, advancing the clock.
    await page.evaluate((tMs) => {
      document.querySelectorAll('.solution-row').forEach((el, idx) => {
        const baseDelay = idx * 70;
        el.style.animationDelay = `${-tMs + baseDelay}ms`;
        el.style.animationPlayState = 'paused';
      });
    }, t);
    const f = path.join(FRAMES, `${theme}-${String(i).padStart(4, '0')}.jpg`);
    await page.screenshot({ path: f, fullPage: false, type: 'jpeg', quality: 92 });
  }

  await browser.close();

  // Playwright's bundled ffmpeg only enables image2pipe (not image2) demuxer,
  // so we have to feed the concatenated PNG bytes via stdin.
  const webm = path.resolve(OUT_DIR, `${outBase}.webm`);
  const frames = Array.from({ length: TOTAL }, (_, i) =>
    path.join(FRAMES, `${theme}-${String(i).padStart(4, '0')}.jpg`)
  );
  const concatenated = Buffer.concat(frames.map((p) => readFileSync(p)));

  const r = spawnSync(FFMPEG, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-framerate', String(FPS),
    '-i', 'pipe:0',
    '-c:v', 'libvpx', '-b:v', '1500k', '-pix_fmt', 'yuv420p',
    '-vf', 'pad=ceil(iw/2)*2:ceil(ih/2)*2',
    webm
  ], { input: concatenated, stdio: ['pipe', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${r.status})`);
  console.log(`wrote ${webm}`);
}

await captureTheme('light', 'solver-rows-anim-light');
await captureTheme('dark', 'solver-rows-anim-dark');
