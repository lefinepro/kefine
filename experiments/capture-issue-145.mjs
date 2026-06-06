// Focused captures for issue #145 frontend fixes.
// Writes only issue-145-* files so the broader screenshot set stays unchanged.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5185';
const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartServer = process.env.START_SERVER !== '0';

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // The dev server is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startServer() {
  const command = path.join(
    root,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'vite.cmd' : 'vite'
  );
  const child = spawn(command, ['dev', '--host', '127.0.0.1', '--port', port, '--strictPort'], {
    cwd: root,
    detached: process.platform !== 'win32',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0', KEFINE_FEATURE_REPOSITORIES: 'true' }
  });

  child.stdout.on('data', (chunk) => process.stdout.write(chunk));
  child.stderr.on('data', (chunk) => process.stderr.write(chunk));
  return child;
}

async function stopServer(child) {
  const terminate = (signal) => {
    try {
      if (process.platform === 'win32') {
        child.kill(signal);
      } else {
        process.kill(-child.pid, signal);
      }
    } catch {
      // Process already exited.
    }
  };

  terminate('SIGTERM');

  await new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      terminate('SIGKILL');
      finish();
    }, 3_000);
    child.once('exit', finish);
  });
}

async function installRoutes(page) {
  await page.route('**/api/health', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.route('**/create', async (route) => {
    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        accepted: true,
        orderId: 'order-1',
        status: 'queued',
        solver: 'Go Proxy Basic',
        paymentUrl: null
      })
    });
  });
}

async function waitForHydratedElement(page, selector) {
  await page.waitForFunction((selector) => {
    const element = document.querySelector(selector);
    return element && Object.getOwnPropertySymbols(element).length > 0;
  }, selector);
}

async function capture(page, file) {
  const output = path.join(outDir, file);
  await page.waitForTimeout(400);
  await page.screenshot({ path: output, fullPage: false });
  console.log(`saved ${path.relative(root, output)}`);
}

async function openPage(context, route) {
  const page = await context.newPage();
  await installRoutes(page);
  await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  return page;
}

let server = null;

try {
  mkdirSync(outDir, { recursive: true });

  if (shouldStartServer) {
    if (!existsSync(path.join(root, 'node_modules'))) {
      throw new Error('node_modules is missing. Run `pnpm install --frozen-lockfile` first.');
    }
    server = startServer();
    await waitForServer(baseUrl);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  });
  await context.addInitScript(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('kefine-theme', 'light');
    window.localStorage.setItem(
      'kefine-completed-solver-searches',
      JSON.stringify(['proxy server', 'repository cleanup'])
    );
  });

  const uploadPage = await openPage(context, '/');
  await uploadPage.waitForSelector('[data-testid="kefine-task-input"]');
  await waitForHydratedElement(uploadPage, '[data-testid="kefine-task-input"]');
  await uploadPage.getByTestId('kefine-task-input').click();
  await uploadPage.getByTestId('kefine-task-input').fill('Review attached notes');
  await uploadPage.getByTestId('kefine-task-input').click();
  await uploadPage.waitForSelector('[data-testid="composer-upload-trigger"]');
  await uploadPage.locator('[data-part="file-input"]').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello from issue 145 screenshot')
  });
  await uploadPage.waitForSelector('[data-part="file-pill"]');
  await capture(uploadPage, 'issue-145-upload-attachment.png');
  await uploadPage.close();

  const clonePage = await openPage(
    context,
    '/@api/order-1?task=Build%20a%20Go%20mini%20proxy&view=clone'
  );
  await clonePage.waitForSelector('[data-testid="repo-clone-page"]');
  await capture(clonePage, 'issue-145-repo-clone-page.png');
  await clonePage.close();

  const settingsPage = await openPage(
    context,
    '/@api/order-1?task=Build%20a%20Go%20mini%20proxy&view=settings'
  );
  await settingsPage.waitForSelector('[data-testid="repo-settings-page"]');
  await capture(settingsPage, 'issue-145-repo-settings-page.png');
  await settingsPage.close();

  const sourcePage = await openPage(context, '/order/order-1/solver/5');
  await sourcePage.waitForSelector('[data-testid="solution-view-tab-source"]');
  await waitForHydratedElement(sourcePage, '[data-testid="solution-view-tab-source"]');
  await sourcePage.getByTestId('solution-view-tab-source').click();
  await sourcePage
    .getByTestId('solution-view-tab-source')
    .waitFor({ state: 'visible' });
  await sourcePage.waitForFunction(() => {
    return document
      .querySelector('[data-testid="solution-view-tab-source"]')
      ?.getAttribute('aria-selected') === 'true';
  });
  await sourcePage.waitForSelector('[data-testid="solution-file-search-trigger"]');
  await sourcePage.getByTestId('solution-file-search-trigger').click();
  await sourcePage.getByTestId('solution-file-search-input').fill('config');
  await sourcePage.waitForSelector('[data-testid="solution-file-outline-item"]');
  await sourcePage.getByTestId('solution-file-outline-item').first().click();
  await sourcePage.waitForFunction(() => {
    return document.querySelector('lef-code-path')?.textContent?.trim() === 'config.yaml';
  });
  await capture(sourcePage, 'issue-145-source-file-search.png');
  await sourcePage.close();

  await context.close();
  await browser.close();
} finally {
  if (server) {
    await stopServer(server);
  }
}
