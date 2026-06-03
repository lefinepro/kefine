import { expect, test } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

test.describe('Solver Pricing', () => {
  test('rust solver task variants show pricing metrics', async ({ page }) => {
    await mockOrderApi(page);

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.localStorage.setItem(
        'kefine-created-orders-v1',
        JSON.stringify([
          {
            id: 'order-rust',
            solver: 'Test Solver',
            status: 'queued',
            title: 'Нужен hello world на rust',
            description: 'Нужен hello world на rust',
            createdAt: '2026-03-21T00:00:00.000Z',
            currency: 'USDC',
            ownerUsername: 'api',
            actorHandle: 'api',
            shareId: 'order-rust',
            vcsEnabled: true,
            repository: {
              id: 'repo-order-rust',
              ownerHandle: 'api',
              slug: 'rust-hello',
              visibility: 'public'
            }
          }
        ])
      );
      window.localStorage.setItem(
        'kefine-order-order-rust-solutions',
        JSON.stringify([
          {
            id: '1',
            solver: 'Basic Rust Dev',
            title: 'Simple Hello World without comments',
            description: 'Minimal implementation with just the basics',
            diffs: [{ file: 'src/main.rs', added: 3, removed: 0 }],
            codeLines: []
          },
          {
            id: '2',
            solver: 'Commented Rust Expert',
            title: 'Hello World with detailed comments',
            description: 'Educational version with explanations for each line',
            diffs: [{ file: 'src/main.rs', added: 9, removed: 0 }],
            codeLines: []
          },
          {
            id: '3',
            solver: 'Interactive Rust',
            title: 'Interactive Hello World with user input',
            description: 'Reads user input and responds accordingly',
            diffs: [{ file: 'src/main.rs', added: 11, removed: 0 }],
            codeLines: []
          },
          {
            id: '4',
            solver: 'Modern Rust Patterns',
            title: 'Hello World using modern Rust patterns',
            description: 'Uses Result handling and modern syntax',
            diffs: [{ file: 'src/main.rs', added: 14, removed: 0 }],
            codeLines: []
          }
        ])
      );
    });

    await page.goto('/@api/order-rust');

    await expect(page.locator('lef-solutions-list')).toHaveCount(0);
    const variants = page.getByTestId('task-solver-variants').locator('[data-variant]');
    await expect(variants).toHaveCount(4);
    await expect(variants.nth(0)).toContainText('$0.04');
    await expect(variants.nth(0)).toContainText('0.7s');
    await expect(variants.nth(3)).toContainText('$0.18');
  });
});
