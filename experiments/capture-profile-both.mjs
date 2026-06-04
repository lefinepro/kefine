import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Capture BOTH the anonymous (public/visitor) and owner views of the profile so
// we can compare against the reviewer's target and verify flatness.

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'experiments', 'shots');
const port = process.env.PORT ?? '5179';
const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;

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
  socialLinks: [{ id: 'link-1', label: 'GitHub', url: 'https://github.com/demo' }],
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
    ].join('\n')
  }
};

const authSession = {
  address: null,
  chainId: null,
  email: 'demo@lefine.pro',
  userId: 'user-demo',
  handle: 'demo',
  displayName: 'Demo Builder',
  authType: 'email',
  connectedAt: 1717502400000
};

function seedPublic(payload) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([payload.profile]));
}

function seedOwner(payload) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([payload.profile]));
  window.localStorage.setItem('auth-session', JSON.stringify(payload.session));
}

async function waitForServer(url) {
  const deadline = Date.now() + 40_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      /* booting */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startServer() {
  const command = path.join(root, 'node_modules', '.bin', 'vite');
  const child = spawn(command, ['dev', '--host', '127.0.0.1', '--port', port, '--strictPort'], {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: '0', KEFINE_FEATURE_REPOSITORIES: 'true' }
  });
  child.stdout.on('data', (c) => process.stdout.write(c));
  child.stderr.on('data', (c) => process.stderr.write(c));
  return child;
}

async function stopServer(child) {
  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    /* gone */
  }
}

let server = null;
try {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  server = startServer();
  await waitForServer(baseUrl);

  const browser = await chromium.launch();

  // Public / anonymous view
  {
    const context = await browser.newContext({
      viewport: { width: 1365, height: 1100 },
      deviceScaleFactor: 1,
      colorScheme: 'light'
    });
    await context.addInitScript(seedPublic, { profile: demoProfile });
    const page = await context.newPage();
    await page.goto(new URL('/@demo', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="profile-repo"]');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(outDir, 'public.png'), fullPage: true });
    console.log('saved public.png');
    await context.close();
  }

  // Owner view
  {
    const context = await browser.newContext({
      viewport: { width: 1365, height: 1400 },
      deviceScaleFactor: 1,
      colorScheme: 'light'
    });
    await context.addInitScript(seedOwner, { profile: demoProfile, session: authSession });
    const page = await context.newPage();
    await page.goto(new URL('/@demo', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="profile-editor"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, 'owner.png'), fullPage: true });
    console.log('saved owner.png');
    await context.close();
  }

  await browser.close();
} finally {
  if (server) await stopServer(server);
}
