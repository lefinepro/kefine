import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const outDir = path.resolve(root, 'docs', 'screenshots');
const port = process.env.PORT ?? '5177';
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
  bio: 'Maintains solver workflows, repository tasks, and public implementation templates.',
  isPublic: true,
  socialLinks: [
    { id: 'github', type: 'github', label: 'GitHub', value: 'lefinepro' },
    { id: 'website', type: 'website', label: 'Website', value: 'https://lefine.pro' }
  ],
  referralPercent: 10,
  bonusBalanceUsd: 24,
  followersCount: 128,
  followingCount: 9,
  createdAt,
  updatedAt: createdAt,
  metadata: {
    firstName: 'API',
    surname: 'Maintainer',
    profileSetupCompleted: true,
    profileSetupStep: 'done',
    // Org-social widget blocks rendered inline on the public profile.
    widgetsOrg: '#+begin_clock Tokyo\n#+end_clock\n\n#+begin_clock\n#+end_clock\n\n#+begin_weather\n#+end_weather'
  }
};

const demoOrder = {
  id: 'order-1',
  solver: 'Release Solver',
  solverName: 'Release Solver',
  solverHandle: 'release-solver',
  solverProfileUrl: '/@api',
  status: 'completed',
  title: 'Document current workspace pages',
  description: 'Refresh project screenshots and verify the main task, profile, widget, solution, and legal pages.',
  createdAt,
  assignedAt: createdAt,
  startedAt: createdAt,
  estimatedCost: 42,
  currency: 'USDC',
  executionEstimate: 'about 2 hours',
  paymentUrl: null,
  labels: ['screenshots', 'cleanup'],
  progressPercent: 100,
  ownerProfileId: demoProfile.id,
  ownerUsername: demoProfile.username,
  ownerDisplayName: demoProfile.displayName,
  actorHandle: demoProfile.username,
  actorDid: `did:key:${demoProfile.username}`,
  vcsEnabled: true,
  projectId: 'project-order-1',
  shareId: 'order-1',
  isClosedCompleted: true,
  isPublicTask: true,
  repository: {
    id: 'repo-order-1',
    projectId: 'project-order-1',
    ownerHandle: demoProfile.username,
    slug: 'project-pages',
    visibility: 'public',
    defaultBranch: 'main',
    projectCloneUrl: 'ssh://git@lefine.pro/@api/project-pages.git',
    projectArchiveUrl: 'https://lefine.pro/@api/project-pages.zip',
    publicCloneUrl: 'https://lefine.pro/@api/project-pages.git',
    sshCloneUrl: 'ssh://git@lefine.pro/@api/project-pages.git'
  },
  result: {
    title: 'Screenshot refresh complete',
    description: 'The visible pages have been recaptured from the current Svelte app.',
    items: ['Workspace', 'Profile', 'Widgets', 'Solutions', 'Legal pages']
  },
  document: {
    format: 'markdown',
    content: '# Screenshot refresh\n\nCapture current route surfaces after repository cleanup.'
  }
};

const pages = [
  { file: 'home.png', route: '/', waitFor: '[data-testid="kefine-task-input"]' },
  { file: 'profile.png', route: '/@api', waitFor: '.profile-page' },
  { file: 'profile-search.png', route: '/@api?q=proxy%20server', waitFor: '[data-testid="kefine-search-page-results"]' },
  { file: 'weather-widget.png', route: '/@api/weather', waitFor: '[data-testid="kefine-weather-widget"]' },
  { file: 'clock-widget.png', route: '/@api/time', waitFor: '[data-testid="kefine-clock-widget"]' },
  { file: 'translator-widget.png', route: '/@api/translate', waitFor: '[data-testid="kefine-translator-widget"]' },
  { file: 'music-widget.png', route: '/@api/music', waitFor: '[data-testid="kefine-music-widget"]' },
  { file: 'task-detail.png', route: '/task/order-1', waitFor: 'body' },
  { file: 'shared-task.png', route: '/shared/tasks/order-1', waitFor: 'body' },
  {
    file: 'solutions.png',
    route: '/@api/order-1?task=Document%20current%20workspace%20pages',
    waitFor: '[data-testid="solution-list-page"]'
  },
  { file: 'solver-detail.png', route: '/order/order-1/solver/1', waitFor: 'lef-solver-page' },
  {
    file: 'oauth-authorize.png',
    route: '/oauth/authorize?client_id=octra&redirect_uri=https%3A%2F%2Foctra.example%2Foauth&state=demo',
    waitFor: 'lef-oauth-screen'
  },
  { file: 'privacy.png', route: '/privacy', waitFor: 'main, body' },
  { file: 'terms.png', route: '/terms', waitFor: 'main, body' }
];

function orderPayload(order) {
  return {
    orderId: order.id,
    title: order.title,
    status: order.status,
    solver: order.solver,
    solverName: order.solverName,
    solverHandle: order.solverHandle,
    solverProfileUrl: order.solverProfileUrl,
    description: order.description,
    executionEstimate: order.executionEstimate,
    estimatedCost: order.estimatedCost,
    currency: order.currency,
    paymentUrl: order.paymentUrl,
    labels: order.labels,
    progressPercent: order.progressPercent,
    result: order.result,
    document: order.document,
    createdAt: order.createdAt,
    updatedAt: order.createdAt,
    assignedAt: order.assignedAt,
    startedAt: order.startedAt,
    ownerProfileId: order.ownerProfileId,
    ownerUsername: order.ownerUsername,
    ownerDisplayName: order.ownerDisplayName,
    actorHandle: order.actorHandle,
    actorDid: order.actorDid,
    vcsEnabled: order.vcsEnabled,
    projectId: order.projectId,
    repository: order.repository,
    shareId: order.shareId,
    isClosedCompleted: order.isClosedCompleted,
    isPublicTask: order.isPublicTask
  };
}

function seedStorage({ profile, order }) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.localStorage.setItem('kefine-theme', 'light');
  window.localStorage.setItem('kefine-profiles-v1', JSON.stringify([profile]));
  window.localStorage.setItem('kefine-created-orders-v1', JSON.stringify([order]));
  window.localStorage.setItem('kefine-completed-solver-searches', JSON.stringify([
    'proxy server',
    'checkout flow',
    'repository cleanup'
  ]));
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
        orderId: demoOrder.id,
        status: demoOrder.status,
        solver: demoOrder.solver,
        paymentUrl: null
      })
    });
  });

  await page.route('**/api/order/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(demoOrder)) });
  });

  await page.route('**/status/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(orderPayload(demoOrder)) });
  });
}

async function capturePage(browser, pageSpec) {
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    deviceScaleFactor: 1,
    colorScheme: 'light'
  });
  await context.addInitScript(seedStorage, { profile: demoProfile, order: demoOrder });
  const page = await context.newPage();
  await installRoutes(page);
  await page.goto(new URL(pageSpec.route, baseUrl).toString(), { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(pageSpec.waitFor);
  await page.waitForTimeout(900);
  const output = path.join(outDir, pageSpec.file);
  await page.screenshot({ path: output, fullPage: false });
  await context.close();
  console.log(`saved ${path.relative(root, output)}`);
}

function writeReadme() {
  const lines = [
    '# Screenshots',
    '',
    'Generated current page captures for issue #126.',
    '',
    'Regenerate from the repository root with:',
    '',
    '```bash',
    'node experiments/capture-project-pages.mjs',
    '```',
    '',
    'Set `START_SERVER=0 BASE_URL=http://127.0.0.1:5173` to use an already-running dev server.',
    '',
    '| File | Route |',
    '| --- | --- |',
    ...pages.map((page) => `| ${page.file} | \`${page.route}\` |`)
  ];
  writeFileSync(path.join(outDir, 'README.md'), `${lines.join('\n')}\n`);
}

let server = null;

try {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  if (shouldStartServer) {
    if (!existsSync(path.join(root, 'node_modules'))) {
      throw new Error('node_modules is missing. Run `pnpm install --frozen-lockfile` first.');
    }
    server = startServer();
    await waitForServer(baseUrl);
  }

  const browser = await chromium.launch();
  for (const pageSpec of pages) {
    await capturePage(browser, pageSpec);
  }
  await browser.close();
  writeReadme();
} finally {
  if (server) {
    await stopServer(server);
  }
}
