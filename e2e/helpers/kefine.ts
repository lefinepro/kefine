import { expect, type Page, type Route } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';

type MockOrder = {
  id: string;
  title: string;
  status: string;
  solver: string;
  executionEstimate: string;
  estimatedCost: number;
  currency: string;
  documentContent?: string;
  ownerUsername?: string;
  ownerDisplayName?: string;
  actorHandle?: string;
  vcsEnabled?: boolean;
  shareId?: string;
  isPublicTask?: boolean;
  projectId?: string;
  repository?: {
    id: string;
    projectId?: string;
    ownerHandle?: string;
    slug: string;
    visibility: 'public' | 'private';
    defaultBranch?: string;
    projectCloneUrl?: string;
    projectArchiveUrl?: string;
    publicCloneUrl?: string;
    sshCloneUrl?: string;
    gitSettings?: {
      exchangeRunDefault?: boolean;
      exchangeActor?: string;
      agentSourceUrl?: string;
      aclRules?: Array<{
        id: string;
        branchPattern: string;
        allowedGroups: string[];
      }>;
    };
  };
};

function buildOrder(id: string, title: string, status = 'queued'): MockOrder {
  return {
    id,
    title,
    status,
    solver: 'Test Solver',
    executionEstimate: 'about 2 hours',
    estimatedCost: 42,
    currency: 'USDC',
    ownerUsername: 'api',
    ownerDisplayName: 'API',
    actorHandle: 'api',
    shareId: id,
    isPublicTask: false,
    vcsEnabled: false
  };
}

function orderPayload(order: MockOrder) {
  return {
    orderId: order.id,
    title: order.title,
    status: order.status,
    solver: order.solver,
    description: order.title,
    executionEstimate: order.executionEstimate,
    estimatedCost: order.estimatedCost,
    currency: order.currency,
    paymentUrl: null,
    repository: order.repository,
    document: order.documentContent
      ? {
          format: 'markdown',
          content: order.documentContent
        }
      : undefined,
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z',
    ownerUsername: order.ownerUsername,
    ownerDisplayName: order.ownerDisplayName,
    actorHandle: order.actorHandle,
    vcsEnabled: order.vcsEnabled,
    shareId: order.shareId,
    isPublicTask: order.isPublicTask,
    projectId: order.projectId
  };
}

function buildRepository(order: MockOrder) {
  const ownerHandle = order.ownerUsername || order.actorHandle || 'api';
  const routeScopedId = order.shareId || order.id;
  const projectId = order.projectId || `${order.id}-project`;
  const visibility = order.isPublicTask ? 'public' : 'private';

  return {
    id: `repo-${order.id}`,
    projectId,
    ownerHandle,
    slug: routeScopedId,
    visibility,
    defaultBranch: 'main' as const,
    projectCloneUrl: `ssh://git@lefine.pro/@${ownerHandle}/${routeScopedId}.git`,
    projectArchiveUrl: `https://lefine.pro/@${ownerHandle}/${projectId}.zip`,
    publicCloneUrl: `https://lefine.pro/@${ownerHandle}/${routeScopedId}.git`,
    sshCloneUrl: `ssh://git@lefine.pro/@${ownerHandle}/${routeScopedId}.git`
  };
}

export async function mockOrderApi(page: Page) {
  let createCounter = 0;
  const orders = new Map<string, MockOrder>();
  let createDelayMs = 0;

  await page.route('**/create', async (route) => {
    createCounter += 1;
    const postData = route.request().postDataJSON() as { title?: string; name?: string };
    const title = postData.title ?? postData.name ?? `Task ${createCounter}`;
    const order = buildOrder(`order-${createCounter}`, title, 'queued');
    orders.set(order.id, order);

    if (createDelayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, createDelayMs));
    }

    await route.fulfill({
      status: 202,
      contentType: 'application/json',
      body: JSON.stringify({
        accepted: true,
        orderId: order.id,
        status: order.status,
        solver: order.solver,
        actorHandle: order.actorHandle,
        ownerUsername: order.ownerUsername,
        paymentUrl: null
      })
    });
  });

  async function handleOrderLookup(route: Route) {
    const url = new URL(route.request().url());
    const segments = url.pathname.split('/').filter(Boolean);
    const orderId = decodeURIComponent(
      segments.at(-1) === 'document' || segments.at(-1) === 'settings'
        ? segments.at(-2) ?? ''
        : segments.at(-1) ?? ''
    );
    const order = orders.get(orderId);

    if (!order) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Order not found', orderId })
      });
      return;
    }

    if (route.request().method() === 'PATCH' && url.pathname.endsWith('/document')) {
      const payload = route.request().postDataJSON() as {
        document?: {
          content?: string;
        };
      };
      order.documentContent = payload.document?.content ?? order.documentContent;
    }

    if (route.request().method() === 'PATCH' && url.pathname.endsWith('/settings')) {
      const payload = route.request().postDataJSON() as {
        vcsEnabled?: boolean;
        isPublicTask?: boolean;
        gitSettings?: NonNullable<NonNullable<MockOrder['repository']>['gitSettings']>;
      };

      if (payload.vcsEnabled !== undefined) {
        order.vcsEnabled = payload.vcsEnabled;
      }

      if (payload.isPublicTask !== undefined) {
        order.isPublicTask = payload.isPublicTask;
      }

      if (order.vcsEnabled) {
        order.projectId ||= `${order.id}-project`;
        order.repository = {
          ...(order.repository || buildRepository(order)),
          visibility: order.isPublicTask ? 'public' : 'private',
          gitSettings: payload.gitSettings || order.repository?.gitSettings
        };
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(orderPayload(order))
    });
  }

  await page.route('**/order/**', handleOrderLookup);
  await page.route('**/status/**', handleOrderLookup);

  return {
    setCreateDelay(delayMs: number) {
      createDelayMs = delayMs;
    },
    setOrderRepository(orderId: string, repository: NonNullable<MockOrder['repository']>) {
      const order = orders.get(orderId);
      if (order) {
        order.repository = repository;
      }
    },
    setOrderOwner(
      orderId: string,
      owner: { ownerUsername?: string; ownerDisplayName?: string; actorHandle?: string }
    ) {
      const order = orders.get(orderId);
      if (order) {
        order.ownerUsername = owner.ownerUsername;
        order.ownerDisplayName = owner.ownerDisplayName;
        order.actorHandle = owner.actorHandle;
      }
    },
    setOrderShareId(orderId: string, shareId: string) {
      const order = orders.get(orderId);
      if (order) {
        order.shareId = shareId;
      }
    },
    setOrderProjectId(orderId: string, projectId: string) {
      const order = orders.get(orderId);
      if (order) {
        order.projectId = projectId;
      }
    },
    setOrderStatus(orderId: string, status: string) {
      const order = orders.get(orderId);
      if (order) {
        order.status = status;
      }
    }
  };
}

export async function gotoAndWaitForReady(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByTestId('kefine-task-input')).toBeVisible();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
}

export async function submitTask(page: Page) {
  await page.getByTestId('kefine-task-input').press('Enter');
}

export async function createTask(page: Page, title: string) {
  await page.getByTestId('kefine-task-input').fill(title);
  await submitTask(page);
}

export async function mockPrivateKeyAuth(page: Page) {
  const expectedPublicKey = await deriveActorPublicKeyString();

  await page.route('**/auth', async (route) => {
    const body = route.request().postDataJSON() as {
      publickey?: { key?: string };
      privatekey?: { key?: string };
    };

    expect(body.privatekey).toBeUndefined();
    expect(body.publickey?.key).toBe(expectedPublicKey);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        verified: true,
        token: 'publickey:api:test',
        userId: 'publickey:api',
        username: 'api',
        displayName: 'API',
        handle: 'api',
        email: 'api@actor.local',
        publickey: {
          key: 'pqpk_testpublickey_for_api',
          pem: ''
        },
        keyId: 'pq1_testactoraddress',
        actorAddress: 'pq1_testactoraddress',
        authType: 'publickey',
        expiresAt: '2026-12-31T00:00:00.000Z'
      })
    });
  });

  await page.route('**/api/kefine/templates/api', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
}

export function readActorPrivateKeyPem() {
  return readFileSync(path.resolve(process.cwd(), 'actor-privatekey.pem'), 'utf8');
}

function pemToDer(pem: string) {
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  return Buffer.from(base64, 'base64');
}

function encodeKeyString(value: string, prefix: string) {
  return `${prefix}${Buffer.from(value, 'utf8').toString('base64url')}`;
}

export function readActorPrivateKeyCompact() {
  return encodeKeyString(readActorPrivateKeyPem(), 'pqsk_');
}

export async function deriveActorPublicKeyString() {
  const privateKeyPem = readActorPrivateKeyPem();
  const privateKeyDer = pemToDer(privateKeyPem);
  const secretKey = privateKeyDer.subarray(privateKeyDer.length - ml_dsa65.lengths.secretKey);
  const publicKey = Buffer.from(ml_dsa65.getPublicKey(secretKey));
  const publicKeyDer = Buffer.concat([
    Buffer.from([
      0x30, 0x82, 0x07, 0xb2, 0x30, 0x0b, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04,
      0x03, 0x12, 0x03, 0x82, 0x07, 0xa1, 0x00
    ]),
    publicKey
  ]);
  const publicKeyPem = [
    '-----BEGIN PUBLIC KEY-----',
    ...(publicKeyDer.toString('base64').match(/.{1,64}/g) ?? []),
    '-----END PUBLIC KEY-----'
  ].join('\n');

  return encodeKeyString(publicKeyPem, 'pqpk_');
}
