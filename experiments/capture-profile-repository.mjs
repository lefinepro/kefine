import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Regenerates the profile-as-repository screenshots after the widgets were moved
// out of the static profile body and behind the command palette (issue #130).
// The public profile must show only the README + checklist + new-task row; the
// declared widgets are surfaced exclusively when a visitor types a matching
// query into the topbar search.

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5178';
const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartServer = process.env.START_SERVER !== '0';

const createdAt = '2026-06-04T12:00:00.000Z';

const demoProfile = {
  id: 'profile-demo',
  userId: 'user-demo',
  username: 'demo',
  primaryHandle: 'demo',
  primaryHandleType: 'email',
  displayName: 'Demo Builder',
  email: 'demo@lefine.pro',
  bio: 'Freelance Go and SwiftUI builder. I ship reliable solver flows.',
  isPublic: true,
  socialLinks: [],
  referralPercent: 10,
  bonusBalanceUsd: 0,
  followersCount: 0,
  followingCount: 0,
  createdAt,
  updatedAt: createdAt,
  metadata: {
    profileSetupCompleted: true,
    profileSetupStep: 'done',
    tasksOrg: [
      '* TODO Introduce yourself in the bio',
      '* TODO Add a link people can follow',
      '* IN PROGRESS Publish your first service',
      '* DONE Claim your handle'
    ].join('\n'),
    // The profile declares widgets in Org block form, but they are no longer
    // rendered statically — they only appear from the command palette on a
    // matching query.
    widgetsOrg: [
      '#+begin_weather',
      '#+end_weather',
      '',
      '#+begin_clock',
      '#+end_clock',
      '',
      '#+begin_translate',
      '#+end_translate',
      '',
      '#+begin_music',
      '#+end_music',
      '',
      '#+begin_proxy',
      '#+end_proxy'
    ].join('\n')
  }
};

function seedStorage(profile) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
}

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
      if (done) return;
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

async function newProfilePage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1365, height: 1100 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  });
  await context.addInitScript(seedStorage, demoProfile);
  const page = await context.newPage();
  await page.goto(new URL('/@demo', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="profile-repo"]');
  await page.waitForTimeout(700);
  return { context, page };
}

let server = null;

try {
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  if (shouldStartServer) {
    if (!existsSync(path.join(root, 'node_modules'))) {
      throw new Error('node_modules is missing. Run `pnpm install --frozen-lockfile` first.');
    }
    server = startServer();
    await waitForServer(baseUrl);
  }

  const browser = await chromium.launch();

  // 1. Public repository view — README + checklist + new-task row, no widgets.
  {
    const { context, page } = await newProfilePage(browser);
    const output = path.join(outDir, 'profile-repository-public.png');
    await page.screenshot({ path: output, fullPage: true });
    console.log(`saved ${path.relative(root, output)}`);
    await context.close();
  }

  // 2. Checklist close-up.
  {
    const { context, page } = await newProfilePage(browser);
    const checklist = page.getByTestId('profile-repo');
    const output = path.join(outDir, 'profile-repository-checklist.png');
    await checklist.screenshot({ path: output });
    console.log(`saved ${path.relative(root, output)}`);
    await context.close();
  }

  // 3. A declared widget surfaced from the command palette on a matching query.
  // The translator renders fully offline and is one of the reviewer's own
  // examples ("showing a translator when the query matches it").
  {
    const { context, page } = await newProfilePage(browser);
    await page.getByTestId('kefine-topbar-search-trigger').click();
    await page.getByTestId('kefine-topbar-search-dialog').waitFor();
    await page.getByTestId('kefine-topbar-search-input').fill('translate');
    await page.getByTestId('kefine-topbar-search-result-widget-translate').click();
    await page.getByTestId('kefine-translator-widget').waitFor();
    await page.waitForTimeout(700);
    const output = path.join(outDir, 'profile-widget-search.png');
    await page.screenshot({ path: output, fullPage: false });
    console.log(`saved ${path.relative(root, output)}`);
    await context.close();
  }

  await browser.close();
} finally {
  if (server) {
    await stopServer(server);
  }
}
