import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import type { OrderView } from '$lib/components/kefine/kefine-workflow';
import {
  buildSolverHistoryTasks,
  resolveOrderRepositoryName
} from '$lib/components/kefine/kefine-solver-history';

function order(id: string, patch: Partial<OrderView> = {}): OrderView {
  return {
    id,
    solver: 'Test Solver',
    status: 'queued',
    title: `Task ${id}`,
    description: `Task ${id}`,
    createdAt: '2026-03-20T00:00:00.000Z',
    currency: 'USDC',
    ...patch
  };
}

describe('solver task history', () => {
  test('formats repository names with owner when only a slug is stored', () => {
    assert.equal(
      resolveOrderRepositoryName(
        order('order-1', {
          actorHandle: 'api',
          repository: {
            id: 'repo-order-1',
            ownerHandle: 'api',
            slug: 'legacy-tooling',
            visibility: 'public'
          }
        })
      ),
      'api/legacy-tooling'
    );
  });

  test('builds active current task plus recent historical orders', () => {
    const current = order('order-2', {
      title: 'Current proxy task',
      shareId: 'current-proxy',
      repository: {
        id: 'repo-order-2',
        ownerHandle: 'api',
        slug: 'current-proxy',
        visibility: 'public'
      },
      createdAt: '2026-03-21T00:00:00.000Z'
    });
    const previous = order('order-1', {
      title: 'Previous parser task',
      repository: {
        id: 'repo-order-1',
        ownerHandle: 'api',
        slug: 'legacy-tooling',
        visibility: 'public'
      }
    });

    assert.deepEqual(
      buildSolverHistoryTasks({
        currentOrder: current,
        orders: [previous, current],
        fallbackRepositoryName: 'kefine/go-proxy'
      }),
      [
        {
          id: 'order-2',
          title: 'api/current-proxy',
          description: 'Current proxy task',
          isActive: true
        },
        {
          id: 'order-1',
          title: 'api/legacy-tooling',
          description: 'Previous parser task'
        }
      ]
    );
  });
});
