// Focused capture for the created task workspace requested in issue #141.
// Writes only docs/screenshots/created-task.png so the shared page capture
// list stays unchanged.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5179';
const baseUrl = process.env.BASE_URL ?? `http://127.0.0.1:${port}`;
const shouldStartServer = process.env.START_SERVER !== '0';

const createdAt = '2026-06-03T12:00:00.000Z';

const demoProfile = {
  id: 'profile-api',
  userId: 'user-api',
  username: 'api',
  primaryHandle: 'api',
  primaryHandleType: 'publickey',
  displayName: 'API Maintainer',
  email: 'api@lefine.pro',
  isPublic: true,
  createdAt,
  updatedAt: createdAt,
  metadata: { firstName: 'API', surname: 'Maintainer', profileSetupCompleted: true, profileSetupStep: 'done' }
};

const createdTaskOrder = {
  id: 'order-1',
  solver: 'Release Solver',
  solverName: 'Release Solver',
  solverHandle: 'release-solver',
  solverProfileUrl: '/@api',
  status: 'running',
  title: 'Optimize database queries',
  description: 'Identify slow SQL paths, tune indexes, and prepare a concise handoff for review.',
  createdAt,
  assignedAt: createdAt,
  startedAt: createdAt,
  estimatedCost: 0,
  currency: 'USD',
  executionEstimate: 'about 2 hours',
  paymentUrl: null,
  labels: ['database', 'performance'],
  progressPercent: 67,
  ownerProfileId: demoProfile.id,
  ownerUsername: demoProfile.username,
  ownerDisplayName: demoProfile.displayName,
  actorHandle: demoProfile.username,
  actorDid: `did:key:${demoProfile.username}`,
  vcsEnabled: true,
  projectId: 'project-order-1',
  shareId: 'order-1',
  isClosedCompleted: false,
  isPublicTask: false,
  repository: {
    id: 'repo-order-1',
    projectId: 'project-order-1',
    ownerHandle: demoProfile.username,
    slug: 'database-queries',
    visibility: 'private',
    defaultBranch: 'main',
    projectCloneUrl: 'ssh://git@lefine.pro/@api/database-queries.git',
    projectArchiveUrl: 'https://lefine.pro/@api/database-queries.zip',
    publicCloneUrl: 'https://lefine.pro/@api/database-queries.git',
    sshCloneUrl: 'ssh://git@lefine.pro/@api/database-queries.git'
  },
  result: null,
  executionSteps: [
    { id: 'step-1', title: 'Profile slow queries', detail: 'Collect traces and rank the highest-cost requests.', state: 'completed' },
    { id: 'step-2', title: 'Tune indexes', detail: 'Adjust schema and verify the query plans.', state: 'active' },
    { id: 'step-3', title: 'Prepare delivery notes', detail: 'Document before/after latency and rollout steps.', state: 'upcoming' }
  ],
  document: {
    format: 'markdown',
    content: '# Optimize database queries\n\nIdentify slow SQL paths, tune indexes, and prepare a concise handoff for review.'
  }
};

function orderPayload(order) {
  return { orderId: order.id, ...order };
}

function seedStorage({ profile, order }) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
  window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify([order]));
  window.localStorage.setItem('lefine-session', JSON.stringify({
    userId: profile.userId,
    email: profile.email,
    handle: profile.username,
    displayName: profile.displayName
  }));
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      // still booting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function startServer() {
  const command = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite');
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
      if (process.platform === 'win32') child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch {
      // already exited
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
        orderId: createdTaskOrder.id,
        status: createdTaskOrder.status,
        solver: createdTaskOrder.solver,
        paymentUrl: null
      })
    });
  });
  await page.route('**/api/order/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(createdTaskOrder)) });
  });
  await page.route('**/status/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(createdTaskOrder)) });
  });
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
  const context = await browser.newContext({ viewport: { width: 1365, height: 1020 }, deviceScaleFactor: 1, colorScheme: 'light' });
  await context.addInitScript(seedStorage, { profile: demoProfile, order: createdTaskOrder });
  const page = await context.newPage();
  await installRoutes(page);
  await page.goto(new URL('/@api/order-1', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="solution-list-page"]');
  await page.waitForTimeout(900);
  const output = path.join(outDir, 'created-task.png');
  await page.screenshot({ path: output, fullPage: false });
  console.log(`saved ${path.relative(root, output)}`);
  await context.close();
  await browser.close();
} finally {
  if (server) await stopServer(server);
}
