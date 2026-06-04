// Focused capture for the task document page only.
// Reuses the demo seeding from capture-project-pages.mjs but writes a single file
// so unrelated screenshots are left untouched.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5178';
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

const demoOrder = {
  id: 'order-1',
  solver: 'Release Solver',
  solverName: 'Release Solver',
  solverHandle: 'release-solver',
  solverProfileUrl: '/@api',
  status: 'active',
  title: 'Document import workflow',
  description: [
    '# Import plan',
    '',
    'Build the importer and keep the interface readable for reviewers.',
    '',
    '- Parse CSV input',
    '- Preserve validation errors',
    '',
    '```bash',
    'pnpm test -- task-document',
    '```'
  ].join('\n'),
  createdAt,
  assignedAt: createdAt,
  startedAt: createdAt,
  estimatedCost: 42,
  currency: 'USDC',
  executionEstimate: 'about 2 hours',
  labels: ['import', 'testing'],
  progressPercent: 45,
  ownerProfileId: demoProfile.id,
  ownerUsername: demoProfile.username,
  ownerDisplayName: demoProfile.displayName,
  actorHandle: demoProfile.username,
  actorDid: `did:key:${demoProfile.username}`,
  vcsEnabled: true,
  projectId: 'project-order-1',
  shareId: 'order-1',
  isPublicTask: true,
  repository: {
    id: 'repo-order-1',
    projectId: 'project-order-1',
    ownerHandle: demoProfile.username,
    slug: 'document-import',
    visibility: 'public',
    defaultBranch: 'main'
  },
  executionSteps: [
    { id: 'step-1', title: 'Map CSV columns', detail: 'Match incoming fields with the task schema.', state: 'completed' },
    { id: 'step-2', title: 'Run importer smoke test', detail: 'Verify successful import and error handling.', state: 'active' }
  ],
  document: {
    format: 'markdown',
    content: [
      '# Import plan',
      '',
      'Build the importer and keep the interface readable for reviewers.',
      '',
      '- Parse CSV input',
      '- Preserve validation errors',
      '',
      '```bash',
      'pnpm test -- task-document',
      '```'
    ].join('\n')
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
    const finish = () => { if (done) return; done = true; clearTimeout(timer); resolve(); };
    const timer = setTimeout(() => { terminate('SIGKILL'); finish(); }, 3_000);
    child.once('exit', finish);
  });
}

async function installRoutes(page) {
  await page.route('**/api/status/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(demoOrder)) });
  });
  await page.route('**/status/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(demoOrder)) });
  });
  await page.route('**/api/order/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(demoOrder)) });
  });
}

let server = null;
try {
  if (shouldStartServer) {
    if (!existsSync(path.join(root, 'node_modules'))) {
      throw new Error('node_modules is missing. Run `pnpm install --frozen-lockfile` first.');
    }
    server = startServer();
    await waitForServer(baseUrl);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light' });
  await context.addInitScript(seedStorage, { profile: demoProfile, order: demoOrder });
  const page = await context.newPage();
  await installRoutes(page);
  await page.goto(new URL('/task/order-1', baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="kefine-task-document-page"]');
  await page.waitForTimeout(900);
  const output = path.join(outDir, 'task-detail.png');
  await page.screenshot({ path: output, fullPage: false });
  console.log(`saved ${path.relative(root, output)}`);
  await context.close();
  await browser.close();
} finally {
  if (server) await stopServer(server);
}
