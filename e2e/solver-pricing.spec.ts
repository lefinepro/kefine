import { expect, test, type Page } from '@playwright/test';

import { mockOrderApi } from './helpers/kefine';

/** Seed a queued rust order with four ranked solver solutions (ids 1-4). */
async function seedRustOrder(page: Page) {
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
}

test.describe('Solver Pricing', () => {
  test('rust solver task variants show pricing metrics', async ({ page }) => {
    await mockOrderApi(page);
    await seedRustOrder(page);

    await page.goto('/#/orders/order-rust');

    await expect(page.locator('lef-solutions-list')).toHaveCount(0);
    const variants = page.getByTestId('task-solver-variants').locator('[data-variant]');
    await expect(variants).toHaveCount(4);
    await expect(variants.nth(0)).toContainText('$0.04');
    await expect(variants.nth(0)).toContainText('0.7s');
    await expect(variants.nth(3)).toContainText('$0.18');
  });

  test('solver badges rank the best solver and the comparison modal mirrors them', async ({ page }) => {
    await mockOrderApi(page);
    await seedRustOrder(page);

    await page.goto('/#/orders/order-rust');

    // Inline badges: ranked by success rate (higher is better), the top solver
    // (id 4, 90%) earns the green "Best" badge while the weakest (id 1, 78%)
    // trails by (78-90)/90 = -13%.
    const variants = page.getByTestId('task-solver-variants').locator('[data-variant]');
    await expect(variants).toHaveCount(4);
    await expect(variants.nth(3)).toContainText('Best');
    await expect(variants.nth(0)).toContainText('-13%');

    // Open the "Compare solvers" modal from the trigger below the variant list.
    await page.getByTestId('open-solvers-compare').first().click();

    const modal = page.getByTestId('solvers-compare-modal');
    await expect(modal).toBeVisible();

    const routes = page.getByTestId('solvers-route-list').locator('.route-card');
    await expect(routes).toHaveCount(4);

    // Best-first ordering: the success leader (Modern Rust Patterns) sits on top
    // with the "Best" badge.
    await expect(routes.first()).toContainText('Modern Rust Patterns');
    await expect(routes.first()).toContainText('Best');
    await expect(routes.first()).toHaveAttribute('data-best', 'true');

    // The plots render inside the modal alongside the route cards.
    await expect(modal.locator('lef-metrics-block')).toBeVisible();

    // Switching the ranking metric re-ranks the routes: by price the cheapest
    // solver (Basic Rust Dev, $0.04) becomes the best route.
    await modal.locator('[data-metric="price"]').click();
    await expect(routes.first()).toContainText('Basic Rust Dev');
    await expect(routes.first()).toContainText('Best');

    // The inline badges follow the same ranking metric: Basic Rust Dev now leads.
    await expect(variants.nth(0)).toContainText('Best');
  });
});
