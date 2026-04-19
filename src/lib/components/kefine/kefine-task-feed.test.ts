import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
import { buildTaskThreadNodes, resolveOrderStage } from '$lib/components/kefine/kefine-task-feed';
import { extractStatusPayload } from '$lib/components/kefine/kefine-workflow-parsers';
import type { OrderView } from '$lib/components/kefine/kefine-workflow';

const fallback = {
  title: 'Fallback title',
  description: 'Fallback description',
  currency: 'USDC',
  createdAt: '2026-04-16T00:00:00.000Z'
};

describe('kefine task feed progression', () => {
  test('extractStatusPayload prefers the latest activity object for stage and result data', () => {
    const parsed = extractStatusPayload(
      {
        orderId: 'order-1',
        status: 'queued',
        title: 'Fix exchange search',
        description: 'Track real progress',
        activities: [
          {
            id: 'activity-1',
            type: 'Create',
            published: '2026-04-16T10:00:00.000Z',
            object: {
              orderId: 'order-1',
              type: 'Offer',
              title: 'Fix exchange search',
              content: 'Track real progress',
              status: 'queued'
            }
          },
          {
            id: 'activity-2',
            type: 'Update',
            published: '2026-04-16T10:00:02.000Z',
            object: {
              orderId: 'order-1',
              type: 'Offer',
              title: 'Fix exchange search',
              content: 'Track real progress',
              status: 'completed',
              solverName: 'Northline Staff',
              solverHandle: 'northline-staff',
              result: {
                title: 'Final result',
                blocks: [{ id: 'result-1', type: 'markdown', content: 'Done.' }]
              }
            }
          }
        ]
      },
      fallback,
      KEFINE_TEXT_EN
    );

    assert.ok(parsed);
    assert.equal(parsed.status, 'completed');
    assert.equal(parsed.solverName, 'Northline Staff');
    assert.equal(parsed.result?.blocks[0]?.content, 'Done.');
  });

  test('resolveOrderStage does not stay queued when latest activity already moved forward', () => {
    const order: OrderView = {
      id: 'order-1',
      solver: '',
      status: 'queued',
      title: 'Fix exchange search',
      description: 'Track real progress',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      activities: [
        {
          id: 'activity-1',
          type: 'Create',
          published: '2026-04-16T10:00:00.000Z',
          status: 'queued',
          payload: {}
        },
        {
          id: 'activity-2',
          type: 'Update',
          published: '2026-04-16T10:00:02.000Z',
          status: 'running',
          payload: {}
        }
      ]
    };

    assert.equal(resolveOrderStage(order), 'running');
  });

  test('exchange search node completes once parsed order carries assigned downstream state', () => {
    const parsed = extractStatusPayload(
      {
        orderId: 'order-1',
        status: 'queued',
        title: 'Fix exchange search',
        description: 'Track real progress',
        activities: [
          {
            id: 'activity-1',
            type: 'Update',
            published: '2026-04-16T10:00:01.000Z',
            object: {
              orderId: 'order-1',
              type: 'Offer',
              title: 'Fix exchange search',
              content: 'Track real progress',
              status: 'assigned',
              solverName: 'Lumen Staff',
              solverHandle: 'lumen-staff'
            }
          }
        ]
      },
      fallback,
      KEFINE_TEXT_EN
    );

    assert.ok(parsed);

    const nodes = buildTaskThreadNodes(parsed);
    assert.equal(nodes[0]?.title, 'Find solvers');
    assert.equal(nodes[0]?.state, 'completed');
    assert.equal(nodes[0]?.mode, 'compact');
  });

  test('system document comments preserve routed mention metadata', () => {
    const order: OrderView = {
      id: 'order-mentions',
      solver: '',
      status: 'running',
      title: 'Route comments',
      description: 'Track actor and solver recipients',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      document: {
        format: 'markdown',
        content: [
          'Track actor and solver recipients',
          '',
          '#+begin_node_comment: order-mentions-description',
          JSON.stringify({
            content: '@actor review this with @solver',
            mentions: [
              { id: 'actor:feed', value: '@actor', kind: 'actor', targetKind: 'actor' },
              { id: 'solver:lumen', value: '@solver', kind: 'solver', targetKind: 'solver' }
            ]
          }),
          '#+end_node_comment'
        ].join('\n')
      }
    };

    const nodes = buildTaskThreadNodes(order);
    const descriptionNode = nodes.find((node) => node.stepId === 'order-mentions-description');

    assert.ok(descriptionNode?.comments?.[0]);
    assert.equal(descriptionNode.comments[0]?.mentions?.length, 2);
    assert.equal(descriptionNode.comments[0]?.mentions?.[0]?.targetKind, 'actor');
    assert.equal(descriptionNode.comments[0]?.mentions?.[1]?.targetKind, 'solver');
  });
});
