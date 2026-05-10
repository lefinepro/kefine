import assert from 'node:assert/strict';
import { describe, test } from 'bun:test';

import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
import {
  addTaskThreadNode,
  appendTaskNodeComment,
  appendTaskNodeInsert,
  buildTaskThreadNodes,
  composeBranchInsertSource,
  isBranchInsert,
  getTaskThreadNodeBacklinks,
  getTaskThreadNodeRelations,
  indentTaskThreadNode,
  moveTaskThreadNode,
  outdentTaskThreadNode,
  parseTaskBranchStyle,
  removeTaskThreadNode,
  resolveOrderStage,
  stripTaskBranchStyle,
  type TaskThreadNode
} from '$lib/components/kefine/kefine-task-feed';
import { extractStatusPayload } from '$lib/components/kefine/kefine-workflow-parsers';
import type { OrderView } from '$lib/components/kefine/kefine-workflow';

const fallback = {
  title: 'Fallback title',
  description: 'Fallback description',
  currency: 'USDC',
  createdAt: '2026-04-16T00:00:00.000Z'
};

describe('kefine task feed progression', () => {
  test('branch tag parsing and compose helpers support left/hidden variants', () => {
    const parsed = parseTaskBranchStyle('[[branch:left,hidden]] Hidden parallel branch');

    assert.equal(parsed.placement, 'left');
    assert.equal(parsed.visibility, 'hidden');
    assert.equal(parsed.tags.includes('left'), true);
    assert.equal(parsed.tags.includes('hidden'), true);
    assert.equal(stripTaskBranchStyle('  [[branch:left,hidden]] Hidden parallel branch  '), 'Hidden parallel branch');
    assert.equal(composeBranchInsertSource('Hidden parallel branch', { placement: 'left', visibility: 'hidden' }), '[[branch:left,hidden]] Hidden parallel branch');
    assert.equal(composeBranchInsertSource('Normal branch task', { placement: 'normal', visibility: 'visible' }), 'Normal branch task');
    assert.equal(composeBranchInsertSource('Normal branch task', { placement: 'normal', visibility: 'visible' }, true), '[[branch:normal]] Normal branch task');
    assert.equal(parseTaskBranchStyle('[[branch:visible]] Visible branch').visibility, 'visible');
    assert.equal(parseTaskBranchStyle('[[branch:normal]] Normal branch').visibility, 'visible');
    assert.equal(parseTaskBranchStyle('[[branch:normal]] Normal branch').tags.includes('normal'), true);
    assert.equal(parseTaskBranchStyle('[[branch:normal]] Normal branch').tags.includes('visible'), false);
    assert.equal(isBranchInsert('[[branch:normal]] Normal branch'), true);
    assert.equal(isBranchInsert('[[branch: visible ]] Visible branch'), true);
    assert.equal(isBranchInsert('No branch marker'), false);
  });

  test('buildTaskThreadNodes parses branch placement and visibility for branch inserts', () => {
    const order: OrderView = {
      id: 'order-branch-doc',
      solver: '',
      status: 'running',
      title: 'Branch insert sample',
      description: 'Track branch parsing',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      document: {
        format: 'markdown',
        content: [
          'Initial text',
          '',
          '#+begin_node_insert: order-branch-doc-description',
          '[[branch:left]] Left visible branch',
          '#+end_node_insert',
          '#+begin_node_insert: order-branch-doc-description',
          '[[branch:hidden]] Hidden visible branch',
          '#+end_node_insert'
        ].join('\n')
      }
    };

    const nodes = buildTaskThreadNodes(order);
    const descriptionNode = nodes.find((node) => node.id === 'order-branch-doc-description');
    const firstBranch = descriptionNode?.children?.[0];
    const secondBranch = descriptionNode?.children?.[1];

    assert.equal(descriptionNode?.children?.length, 2);
    assert.equal(firstBranch?.branchPlacement, 'left');
    assert.equal(firstBranch?.branchVisibility, 'visible');
    assert.equal(secondBranch?.branchVisibility, 'hidden');
    assert.equal(secondBranch?.branchPlacement, 'normal');
  });

  test('buildTaskThreadNodes inherits branch style from parent inserts', () => {
    const order: OrderView = {
      id: 'order-branch-style',
      solver: '',
      status: 'running',
      title: 'Nested branch style',
      description: 'Track nested style',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      document: {
        format: 'markdown',
        content: [
          'Nested branch style',
          '',
          '#+begin_node_insert: order-branch-style-description',
          '[[branch:left,hidden]] Hidden left parent branch',
          '#+end_node_insert',
          '#+begin_node_insert: order-branch-style-description-insert-1',
          'Nested visible child',
          '#+end_node_insert'
        ].join('\n')
      }
    };

    const nodes = buildTaskThreadNodes(order);
    const descriptionNode = nodes.find((node) => node.id === 'order-branch-style-description');
    const parentBranch = descriptionNode?.children?.[0];
    const childBranch = parentBranch?.children?.[0];

    assert.equal(parentBranch?.branchPlacement, 'left');
    assert.equal(parentBranch?.branchVisibility, 'hidden');
    assert.equal(parentBranch?.branchLabel, 'Branch 1');
    assert.equal(childBranch?.branchPlacement, 'left');
    assert.equal(childBranch?.branchVisibility, 'hidden');
    assert.equal(childBranch?.branchLabel, 'Branch 2');
  });

  test('explicit branch visibility override is honored when hidden context is inherited', () => {
    const order: OrderView = {
      id: 'order-branch-visibility',
      solver: '',
      status: 'running',
      title: 'Nested branch visibility override',
      description: 'Track visibility inheritance',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      document: {
        format: 'markdown',
        content: [
          'Nested visibility',
          '',
          '#+begin_node_insert: order-branch-visibility-description',
          '[[branch:left,hidden]] Parent hidden branch',
          '#+end_node_insert',
          '#+begin_node_insert: order-branch-visibility-description-insert-1',
          '[[branch:visible]] Force visible branch',
          '#+end_node_insert'
        ].join('\n')
      }
    };

    const nodes = buildTaskThreadNodes(order);
    const descriptionNode = nodes.find((node) => node.id === 'order-branch-visibility-description');
    const parentBranch = descriptionNode?.children?.[0];
    const visibleOverrideBranch = parentBranch?.children?.[0];

    assert.equal(parentBranch?.branchVisibility, 'hidden');
    assert.equal(parentBranch?.branchPlacement, 'left');
    assert.equal(visibleOverrideBranch?.branchVisibility, 'visible');
    assert.equal(visibleOverrideBranch?.branchPlacement, 'left');
  });

  test('node relations and backlinks are derived from nested threads', () => {
    const nodes: TaskThreadNode[] = [
      {
        id: 'root-1',
        title: 'Root 1',
        state: 'completed',
        mode: 'compact',
        children: [
          {
            id: 'root-1-child',
            title: 'Root 1 child',
            state: 'active',
            mode: 'compact',
            children: [
              {
                id: 'root-1-grandchild',
                title: 'Grandchild',
                state: 'upcoming',
                mode: 'compact'
              }
            ]
          }
        ]
      },
      {
        id: 'root-2',
        title: 'Root 2',
        state: 'upcoming',
        mode: 'compact'
      }
    ];

    const relations = getTaskThreadNodeRelations(nodes);
    assert.equal(relations.parentById['root-1-child'], 'root-1');
    assert.equal(relations.parentById['root-1-grandchild'], 'root-1-child');
    assert.equal(relations.depthById['root-1-grandchild'], 2);
    assert.deepEqual(relations.childByParentId['root-1'], ['root-1-child']);
    assert.deepEqual(relations.childByParentId['__root'], ['root-1', 'root-2']);

    const backlinks = getTaskThreadNodeBacklinks(nodes);
    assert.deepEqual(backlinks['root-1-grandchild'], ['root-1-child', 'root-1']);
    assert.deepEqual(backlinks['root-2'], []);
  });

  test('indent/outdent/add/move/remove node transforms maintain thread shape', () => {
    const baseNodes: TaskThreadNode[] = [
      {
        id: 'node-1',
        title: 'Node 1',
        state: 'upcoming',
        mode: 'compact',
        children: []
      },
      {
        id: 'node-2',
        title: 'Node 2',
        state: 'upcoming',
        mode: 'compact',
        children: [
          {
            id: 'node-2-child',
            title: 'Node 2 child',
            state: 'upcoming',
            mode: 'compact'
          }
        ]
      }
    ];

    const indented = indentTaskThreadNode(baseNodes, 'node-2');
    assert.equal(indented.length, 1);
    assert.equal(indented[0]?.children?.length, 2);
    assert.equal(indented[0]?.children?.[1]?.id, 'node-2');

    const outdented = outdentTaskThreadNode(indented, 'node-2-child');
    assert.equal(outdented.length, 2);
    assert.equal(outdented[1]?.id, 'node-2-child');
    assert.equal(outdented[0]?.children?.length, 0);

    const added = addTaskThreadNode(baseNodes, {
      id: 'node-3',
      title: 'Node 3',
      state: 'upcoming',
      mode: 'compact'
    }, { index: 1 });
    assert.equal(added[1]?.id, 'node-3');

    const nested = addTaskThreadNode(
      baseNodes,
      {
        id: 'node-2-nested',
        title: 'Nested',
        state: 'upcoming',
        mode: 'compact'
      },
      { parentId: 'node-2', index: 0 }
    );
    const nestedRoot2 = nested[1];
    assert.equal(nestedRoot2?.children?.[0]?.id, 'node-2-nested');

    const moved = moveTaskThreadNode(baseNodes, 'node-2', 'node-1', 0);
    assert.equal(moved[0]?.id, 'node-1');
    assert.equal(moved[0]?.children?.[0]?.id, 'node-2');

    const removed = removeTaskThreadNode(moved, 'node-2');
    assert.equal(removed.length, 1);
    assert.equal(removed[0]?.id, 'node-1');
    assert.equal(removed[0]?.children?.length, 0);
  });

  test('comments can be appended and branch inserts are preserved with style', () => {
    const order: OrderView = {
      id: 'order-append',
      solver: '',
      status: 'running',
      title: 'Append content',
      description: 'Append with metadata',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC'
    };

    const commentDocument = appendTaskNodeComment(order, 'order-append-description', 'Follow up note');
    const nodes = buildTaskThreadNodes({ ...order, document: { format: 'markdown', content: commentDocument } });
    const comments = nodes.find((node) => node.id === 'order-append-description')?.comments;

    assert.equal(comments?.length, 1);
    assert.equal(comments?.[0]?.content, 'Follow up note');
    assert.equal(comments?.[0]?.authorName, undefined);
  });

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

  test('final result renders as a separate timeline block instead of exchange description', () => {
    const order: OrderView = {
      id: 'order-result',
      solver: '',
      status: 'completed',
      title: 'Ship result view',
      description: 'Show a result block',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC',
      result: {
        title: 'Final result',
        summary: 'Result description',
        blocks: [{ id: 'result-1', type: 'markdown', content: 'Done.' }]
      }
    };

    const nodes = buildTaskThreadNodes(order, { resultTitle: 'Result' });
    const exchangeNode = nodes.find((node) => node.stepId === 'order-result-exchange-search');
    const resultNode = nodes.find((node) => node.id === 'order-result-final-result');

    assert.equal(exchangeNode?.title, 'Find solvers');
    assert.equal(exchangeNode?.mode, 'compact');
    assert.equal(resultNode?.title, 'Result');
    assert.equal(resultNode?.mode, 'block');
    assert.equal(resultNode?.detail, undefined);
    assert.equal(resultNode?.blocks?.[0]?.content, 'Done.');
  });

  test('node inserts from inline editor become regular and branch children', () => {
    const order: OrderView = {
      id: 'order-inline',
      solver: '',
      status: 'running',
      title: 'Inline nodes',
      description: 'Build an outliner flow',
      createdAt: '2026-04-16T10:00:00.000Z',
      currency: 'USDC'
    };

    const withNextTask = appendTaskNodeInsert(order, 'order-inline-description', 'Draft the next step');
    const withBranchTask = appendTaskNodeInsert(
      { ...order, document: { format: 'markdown', content: withNextTask } },
      'order-inline-description',
      '[[branch:normal]] Explore a parallel route'
    );
    const nodes = buildTaskThreadNodes({
      ...order,
      document: { format: 'markdown', content: withBranchTask }
    });
    const descriptionNode = nodes.find((node) => node.stepId === 'order-inline-description');

    assert.equal(descriptionNode?.children?.[0]?.title, 'Draft the next step');
    assert.equal(descriptionNode?.children?.[0]?.branchLabel, undefined);
    assert.equal(descriptionNode?.children?.[1]?.title, 'Explore a parallel route');
    assert.equal(descriptionNode?.children?.[1]?.branchLabel, 'Branch 1');
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
