import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

// Captures the OWNER view of the profile-as-repository: the flat repository
// panel, the header social.org menu, and the owner settings panel with public
// SSH keys. Private-key profile fields are intentionally absent.

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5179';
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
  socialLinks: [{ id: 'link-1', label: 'GitHub', value: 'https://github.com/demo' }],
  referralPercent: 10,
  bonusBalanceUsd: 0,
  followersCount: 0,
  followingCount: 0,
  createdAt,
  updatedAt: createdAt,
  metadata: {
    profileSetupCompleted: true,
    profileSetupStep: 'done',
    sshPublicKeys: [
      'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDemoKeyOne demo-one',
      'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDemoKeyTwo demo-two'
    ],
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

function seedStorage(payload) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([payload.profile]));
  window.localStorage.setItem('auth-session', JSON.stringify(payload.session));
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
  const context = await browser.newContext({
    viewport: { width: 1365, height: 1400 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  });
  await context.addInitScript(seedStorage, { profile: demoProfile, session: authSession });
  const page = await context.newPage();
  await page.goto(new URL('/@demo', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="profile-editor"]');
  await page.getByTestId('profile-social-menu-trigger').click();
  await page.waitForTimeout(800);

  // Full owner view: flat repo panel, export menu, compact social rows, and
  // owner settings with plural SSH public keys.
  const overview = path.join(outDir, 'profile-owner-editor.png');
  await page.screenshot({ path: overview, fullPage: true });
  console.log(`saved ${path.relative(root, overview)}`);
  const prOverview = path.join(outDir, 'owner-profile.png');
  copyFileSync(overview, prOverview);
  console.log(`saved ${path.relative(root, prOverview)}`);

  await browser.close();
} finally {
  if (server) {
    await stopServer(server);
  }
}
