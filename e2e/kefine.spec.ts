import { expect, test } from '@playwright/test';

type MockOrder = {
  id: string;
  title: string;
  status: string;
  solver: string;
  executionEstimate: string;
  estimatedCost: number;
  currency: string;
};

function buildOrder(id: string, title: string, status = 'queued'): MockOrder {
  return {
    id,
    title,
    status,
    solver: 'Test Solver',
    executionEstimate: 'about 2 hours',
    estimatedCost: 42,
    currency: 'USDC'
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
    createdAt: '2026-03-20T00:00:00.000Z',
    updatedAt: '2026-03-20T00:00:00.000Z'
  };
}

async function mockOrderApi(page: import('@playwright/test').Page) {
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
        paymentUrl: null
      })
    });
  });

  await page.route('**/order/**', async (route) => {
    const url = new URL(route.request().url());
    const orderId = decodeURIComponent(url.pathname.split('/').at(-1) ?? '');
    const order = orders.get(orderId);

    if (!order) {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Order not found', orderId })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(orderPayload(order))
    });
  });

  return {
    setCreateDelay(delayMs: number) {
      createDelayMs = delayMs;
    },
    setOrderStatus(orderId: string, status: string) {
      const order = orders.get(orderId);
      if (order) {
        order.status = status;
      }
    }
  };
}

async function gotoAndWaitForReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
  await page.reload();
  await expect(page.getByTestId('kefine-task-input')).toBeVisible();
}

test('Shift+Enter adds optimistic item, keeps create screen, and opens by ETA click', async ({ page }) => {
  const api = await mockOrderApi(page);
  api.setCreateDelay(450);
  await gotoAndWaitForReady(page);

  const input = page.getByTestId('kefine-task-input');
  await input.fill('Optimize an algorithm');
  await input.press('Shift+Enter');

  const optimisticRow = page.locator('[data-order-id^="temp-"]').first();
  await expect(optimisticRow).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  const realRow = page.locator('[data-order-id="order-1"]');
  await expect(realRow).toBeVisible();
  await expect(realRow.getByTestId('kefine-order-eta-order-1')).toContainText('about 2 hours');

  await realRow.getByTestId('kefine-open-order-order-1').click();
  await expect(page).toHaveURL(/\/task\/order-1$/);
});

test('reloading a temp order route keeps the order screen stable', async ({ page }) => {
  const api = await mockOrderApi(page);
  api.setCreateDelay(1200);
  await gotoAndWaitForReady(page);

  const input = page.getByTestId('kefine-task-input');
  await input.fill('Temporary optimistic order');
  await input.press('Shift+Enter');

  const optimisticRow = page.locator('[data-order-id^="temp-"]').first();
  await expect(optimisticRow).toBeVisible();

  const optimisticOrderId = await optimisticRow.getAttribute('data-order-id');
  expect(optimisticOrderId).toBeTruthy();

  await page.goto(`/task/${optimisticOrderId}`);
  await page.reload();

  await expect(page).toHaveURL(new RegExp(`/task/${optimisticOrderId}`));
  await expect(page.getByTestId('kefine-wallet-tile')).toBeVisible();
  await expect(page.getByTestId('kefine-price-metric')).toBeVisible();
});

test('reloading a persisted order route keeps the executing component mounted', async ({ page }) => {
  const api = await mockOrderApi(page);
  api.setCreateDelay(250);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Persisted route order');
  await page.getByTestId('kefine-submit-task').click();
  await expect(page).toHaveURL(/\/task\/order-1$/);

  await page.reload();

  await expect(page).toHaveURL(/\/task\/order-1$/);
  await expect(page.getByRole('heading', { name: 'Persisted route order' })).toBeVisible();
  await expect(page.getByTestId('kefine-wallet-tile')).toBeVisible();
});

test('Enter adds item to shared list and opens executing flow', async ({ page }) => {
  const api = await mockOrderApi(page);
  api.setCreateDelay(250);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Deploy my production app');
  await page.getByTestId('kefine-submit-task').click();

  await expect(page).toHaveURL(/\/task\/order-1$/);
  await expect(page.getByRole('heading', { name: 'Deploy my production app' })).toBeVisible();
  await expect(page.getByTestId('kefine-subtask-list')).toBeVisible();
  await expect(page.getByTestId('kefine-price-metric')).toContainText('42');
  await expect(page.locator('[data-order-id="order-1"]')).toHaveCount(0);

  await page.goto('/');
  await expect(page.locator('[data-order-id="order-1"]')).toBeVisible();
});

test('executing screen keeps solver fallback and no standalone promo block', async ({ page }) => {
  await mockOrderApi(page);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Need access to Telegram');
  await page.getByTestId('kefine-submit-task').click();

  await expect(page).toHaveURL(/\/task\/order-1$/);
  await expect(page.getByTestId('kefine-solver-fallback')).toBeVisible();
  await expect(page.getByTestId('kefine-promo-toggle')).toHaveCount(0);
  await expect(page.getByTestId('kefine-promo-input')).toHaveCount(0);
});

test('anonymous payment path opens deposit dialog and reveals result panel', async ({ page }) => {
  await mockOrderApi(page);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Optimize an algorithm');
  await page.getByTestId('kefine-submit-task').click();

  await expect(page).toHaveURL(/\/task\/order-1$/);
  await page.getByTestId('kefine-anonymous-tile').click();
  await expect(page.getByTestId('kefine-anonymous-payment')).toBeVisible();
  await page.getByTestId('kefine-open-deposit-dialog').click();
  await expect(page.getByTestId('kefine-deposit-dialog')).toBeVisible();
  await page.getByTestId('kefine-deposit-reown').click();
  await expect(page.getByTestId('kefine-deposit-pending')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to result' }).click();
  await expect(page.getByTestId('kefine-result-panel')).toBeVisible();
  await expect(page.getByTestId('kefine-save-result')).toBeVisible();
});

test('View stages opens the execution flow from the result panel', async ({ page }) => {
  await mockOrderApi(page);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Deploy private VPN for the team');
  await page.getByTestId('kefine-submit-task').click();

  await expect(page).toHaveURL(/\/task\/order-1$/);
  await page.getByTestId('kefine-anonymous-tile').click();
  await expect(page.getByTestId('kefine-anonymous-payment')).toBeVisible();
  await page.getByRole('button', { name: 'Continue to result' }).click();

  await expect(page.getByTestId('kefine-result-panel')).toBeVisible();
  await page.getByRole('button', { name: 'View stages' }).click();

  await expect(page).toHaveURL(/\/task\/order-1\/stages$/);
  await expect(page.getByTestId('kefine-subtask-list')).toBeVisible();
  await expect(page.getByTestId('kefine-result-panel')).toHaveCount(0);
});

test('desktop stop marks task stopped from shared list', async ({ page }) => {
  const api = await mockOrderApi(page);
  await gotoAndWaitForReady(page);

  await page.getByTestId('kefine-task-input').fill('Need access to Telegram');
  await page.getByTestId('kefine-task-input').press('Shift+Enter');

  const row = page.locator('[data-order-id="order-1"]');
  await expect(row).toBeVisible();
  await row.getByTestId('kefine-stop-order-order-1').click();
  await expect(row).toHaveAttribute('data-status', 'stopped');

  api.setOrderStatus('order-1', 'completed');
  await page.waitForTimeout(1800);
  await expect(row).toHaveAttribute('data-status', 'stopped');
});

test('mobile long press stops task and list stays narrow without horizontal overflow', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'pointer duration checks are only asserted on chromium project setup');

  await mockOrderApi(page);
  await gotoAndWaitForReady(page);

  const input = page.getByTestId('kefine-task-input');
  await input.fill('A very long background task title that should still wrap correctly on very narrow screens');
  await input.press('Shift+Enter');

  const row = page.locator('[data-order-id="order-1"]');
  await expect(row).toBeVisible();

  const stopButton = row.getByTestId('kefine-stop-order-order-1');
  await stopButton.dispatchEvent('pointerdown', { pointerType: 'touch', isPrimary: true });
  await page.waitForTimeout(650);
  await stopButton.dispatchEvent('pointerup', { pointerType: 'touch', isPrimary: true });
  await expect(row).toHaveAttribute('data-status', 'stopped');

  const scrollWidth = await page.locator('body').evaluate((node) => node.scrollWidth);
  const clientWidth = await page.locator('body').evaluate((node) => node.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
