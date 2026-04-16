import type {
  ExecutionStage,
  OrderExecutor,
  OrderExecutionStep,
  OrderNotebookBlock,
  OrderStepComment,
  OrderNotebookStep,
  OrderResultSection,
  OrderView,
  ProgressState
} from '$lib/components/kefine/kefine-workflow';

export type TaskThreadNode = {
  id: string;
  stepId?: string;
  title: string;
  detail?: string;
  state: ProgressState;
  mode: 'compact' | 'block' | 'loading';
  meta?: string;
  blocks?: OrderNotebookBlock[];
  comments?: OrderStepComment[];
  commentable?: boolean;
  children?: TaskThreadNode[];
};

type ParsedTaskDocument = {
  body: string;
  systemComments: Record<string, OrderStepComment[]>;
};

function parseTaskDocumentContent(content: string | undefined): ParsedTaskDocument {
  const source = content?.trim() || '';
  if (!source) {
    return {
      body: '',
      systemComments: {}
    };
  }

  const systemComments: Record<string, OrderStepComment[]> = {};
  const lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const bodyLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const commentStart = line.match(/^#\+begin_node_comment:\s+(.+)$/i);
    if (!commentStart) {
      bodyLines.push(line);
      continue;
    }

    const nodeKey = commentStart[1]?.trim();
    const contentLines: string[] = [];
    index += 1;

    while (index < lines.length && !/^#\+end_node_comment\b/i.test((lines[index] ?? '').trim())) {
      contentLines.push(lines[index] ?? '');
      index += 1;
    }

    if (nodeKey) {
      systemComments[nodeKey] = [
        ...(systemComments[nodeKey] ?? []),
        {
          id: `${nodeKey}-${systemComments[nodeKey]?.length ?? 0}`,
          content: contentLines.join('\n').trim()
        }
      ].filter((comment) => comment.content);
    }
  }

  const body = bodyLines.join('\n').trim();
  return {
    body,
    systemComments
  };
}

function appendSystemComment(content: string | undefined, nodeKey: string, comment: string): string {
  const parsed = parseTaskDocumentContent(content);
  const blocks = [parsed.body].filter(Boolean);
  const existingComments = Object.entries(parsed.systemComments);

  for (const [key, comments] of existingComments) {
    for (const item of comments) {
      blocks.push(`#+begin_node_comment: ${key}\n${item.content}\n#+end_node_comment`);
    }
  }

  blocks.push(`#+begin_node_comment: ${nodeKey}\n${comment.trim()}\n#+end_node_comment`);
  return blocks.filter(Boolean).join('\n\n').trim();
}

function replaceSystemComment(content: string | undefined, nodeKey: string, comment: string): string {
  const parsed = parseTaskDocumentContent(content);
  const blocks = [parsed.body].filter(Boolean);

  for (const [key, comments] of Object.entries(parsed.systemComments)) {
    if (key === nodeKey) {
      continue;
    }

    for (const item of comments) {
      blocks.push(`#+begin_node_comment: ${key}\n${item.content}\n#+end_node_comment`);
    }
  }

  if (comment.trim()) {
    blocks.push(`#+begin_node_comment: ${nodeKey}\n${comment.trim()}\n#+end_node_comment`);
  }

  return blocks.filter(Boolean).join('\n\n').trim();
}

function executorState(executor: OrderExecutor): ProgressState {
  if (executor.status === 'completed') return 'completed';
  if (executor.status === 'running' || executor.status === 'review' || executor.status === 'accepted') return 'active';
  return 'upcoming';
}

function compactNode(
  id: string,
  title: string,
  detail: string | undefined,
  state: ProgressState,
  meta?: string,
  stepId?: string,
  commentable?: boolean,
  comments?: OrderStepComment[]
): TaskThreadNode {
  return { id, stepId, title, detail, state, mode: 'compact', meta, commentable, comments };
}

function blockNode(
  id: string,
  title: string,
  detail: string | undefined,
  state: ProgressState,
  blocks: OrderNotebookBlock[],
  meta?: string,
  options?: Pick<TaskThreadNode, 'comments' | 'commentable' | 'stepId'>
): TaskThreadNode {
  return { id, title, detail, state, mode: 'block', blocks, meta, ...options };
}

function loadingNode(id: string, title: string, detail: string): TaskThreadNode {
  return { id, title, detail, state: 'active', mode: 'loading' };
}

function resolveLatestActivityStage(order: OrderView): ExecutionStage | undefined {
  const latestStatus = [...(order.activities ?? [])]
    .reverse()
    .map((activity) => activity.status?.trim())
    .find(Boolean);

  if (!latestStatus) {
    return undefined;
  }

  const normalized = latestStatus.toLowerCase();
  if (['completed', 'done', 'paid'].includes(normalized)) return 'completed';
  if (['review', 'awaiting-review', 'pending-confirmation', 'awaiting-confirmation'].includes(normalized)) return 'review';
  if (['executing', 'running', 'in-progress', 'in_progress'].includes(normalized)) return 'running';
  if (['accepted', 'assigned', 'winner-selected', 'winner_selected'].includes(normalized)) return 'assigned';
  if (['matching', 'competition', 'searching'].includes(normalized)) return 'matching';
  if (['failed', 'error', 'rejected', 'stopped'].includes(normalized)) return 'failed';
  if (['queued', 'queue', 'created'].includes(normalized)) return 'queued';
  return undefined;
}

export function resolveOrderStage(order: OrderView): ExecutionStage {
  const hasFinalResult = Boolean(order.result?.blocks?.length || order.resultDocument || order.isClosedCompleted);
  if (hasFinalResult) {
    return 'completed';
  }

  const hasInterimResult = Boolean(order.interimResult?.blocks?.length);
  const hasNotebookSteps = Boolean(order.notebook?.steps?.length);
  const hasExecutionSteps = Boolean(order.executionSteps?.length);
  const hasActiveExecutionStep = Boolean(order.activeExecutionStepId?.trim());
  const hasRunningExecutor = Boolean(
    order.executors?.some((executor) => executor.status === 'running' || executor.status === 'review' || executor.status === 'completed')
  );
  if (hasInterimResult || hasNotebookSteps || hasExecutionSteps || hasActiveExecutionStep || hasRunningExecutor) {
    return 'running';
  }

  const hasAssignedExecutor = Boolean(
    order.executors?.some((executor) => executor.status === 'accepted' || executor.status === 'running' || executor.status === 'review' || executor.status === 'completed')
  );
  const hasSolverIdentity = Boolean(
    order.solver?.trim() || order.solverName?.trim() || order.solverHandle?.trim()
  );
  if (hasAssignedExecutor || hasSolverIdentity) {
    return 'assigned';
  }

  const latestActivityStage = resolveLatestActivityStage(order);
  if (latestActivityStage && latestActivityStage !== 'queued') {
    return latestActivityStage;
  }

  if (order.exchangeStage) {
    return order.exchangeStage;
  }

  const status = order.status.trim().toLowerCase();

  if (['completed', 'done'].includes(status)) return 'completed';
  if (['review', 'awaiting-review', 'pending-confirmation', 'awaiting-confirmation'].includes(status)) return 'review';
  if (['executing', 'running', 'in-progress', 'in_progress'].includes(status)) return 'running';
  if (['accepted', 'assigned', 'winner-selected', 'winner_selected'].includes(status)) return 'assigned';
  if (['matching', 'competition', 'searching'].includes(status)) return 'matching';
  if (['failed', 'error', 'rejected', 'stopped'].includes(status)) return 'failed';

  return 'queued';
}

function exchangeSearchNode(order: OrderView): TaskThreadNode {
  const stage = resolveOrderStage(order);
  const comments = resolveSystemNodeComments(order, `${order.id}-exchange-search`);

  if (stage === 'assigned' || stage === 'running' || stage === 'review' || stage === 'completed') {
    return compactNode(
      `${order.id}-exchange-search`,
      'Exchange search',
      'A matching performer was found on the exchange.',
      'completed',
      undefined,
      `${order.id}-exchange-search`,
      true,
      comments
    );
  }

  if (stage === 'failed') {
    return compactNode(
      `${order.id}-exchange-search`,
      'Exchange search',
      'The exchange route stopped before execution finished.',
      'active',
      undefined,
      `${order.id}-exchange-search`,
      true,
      comments
    );
  }

  return {
    id: `${order.id}-exchange-search`,
    stepId: `${order.id}-exchange-search`,
    title: 'Exchange search',
    detail: 'Publishing the task to exchange and waiting for a matching performer.',
    state: 'active',
    mode: 'loading',
    commentable: true,
    comments
  };
}

function resolveTaskSummary(order: OrderView): string | undefined {
  const documentContent = parseTaskDocumentContent(order.document?.content).body.trim();
  return documentContent || order.description?.trim() || undefined;
}

function resolveSystemNodeComments(order: OrderView, nodeKey: string): OrderStepComment[] | undefined {
  const comments = parseTaskDocumentContent(order.document?.content).systemComments[nodeKey];
  return comments?.length ? comments : undefined;
}

function resolveRootTitle(order: OrderView): string {
  const title = order.title.trim();
  const summary = resolveTaskSummary(order);

  if (!summary || !title || summary === title) {
    return title || summary || order.title;
  }

  const normalizedTitle = title.toLocaleLowerCase();
  if (normalizedTitle === 'task' || normalizedTitle === 'задача' || normalizedTitle === 'առաջադրանք') {
    return summary;
  }

  return title;
}

function descriptionNode(order: OrderView): TaskThreadNode | null {
  const content = resolveTaskSummary(order);
  if (!content || content === order.title.trim()) {
    return null;
  }

  return blockNode(
    `${order.id}-description`,
    'Description',
    undefined,
    'completed',
    [{ id: `${order.id}-description-block`, type: 'markdown', content }],
    undefined,
    {
      stepId: `${order.id}-description`,
      commentable: true,
      comments: resolveSystemNodeComments(order, `${order.id}-description`)
    }
  );
}

function executionNodes(steps: OrderExecutionStep[] | undefined): TaskThreadNode[] {
  return (steps ?? []).map((step, index) =>
    blockNode(
      step.id,
      step.title,
      step.detail,
      step.state,
      [{ id: `${step.id}-detail`, type: 'markdown', content: step.detail || step.title }],
      `Stage ${index + 1}`,
      {
        stepId: step.id,
        commentable: true
      }
    )
  );
}

function notebookNodes(steps: OrderNotebookStep[] | undefined): TaskThreadNode[] {
  return (steps ?? []).map((step, index) =>
    blockNode(
      step.id,
      step.title,
      step.detail,
      step.state,
      step.blocks,
      step.executorName || step.statusLabel || `Update ${index + 1}`,
      {
        stepId: step.id,
        comments: step.comments,
        commentable: true
      }
    )
  );
}

function resultNode(section: OrderResultSection | undefined, id: string, title: string): TaskThreadNode | null {
  if (!section?.blocks?.length) {
    return null;
  }

  return blockNode(id, title, section.summary || section.title, 'completed', section.blocks);
}

function solverNodes(order: OrderView): TaskThreadNode[] {
  const stage = resolveOrderStage(order);

  if ((order.executors?.length ?? 0) > 1) {
    return [
      compactNode(
        `${order.id}-solutions`,
        'Solutions proposed',
        `${order.executors?.length ?? 0} candidate solutions available.`,
        order.result ? 'completed' : 'active'
      ),
      ...(order.executors ?? []).map((executor) =>
        compactNode(
          `${order.id}-executor-${executor.id}`,
          executor.name,
          executor.resultSummary || executor.handle || executor.status,
          executorState(executor),
          'solver'
        )
      )
    ];
  }

  const solverLabel = order.solverName || order.solver || order.executors?.[0]?.name || '';
  if (solverLabel) {
    return [
      compactNode(
        `${order.id}-solver`,
        'Solver found',
        solverLabel,
        'completed'
      )
    ];
  }

  if (stage === 'queued' || stage === 'matching') {
    return [];
  }

  return [];
}

export function buildTaskThreadNodes(order: OrderView | null): TaskThreadNode[] {
  if (!order) {
    return [];
  }

  const description = descriptionNode(order);
  const interim = resultNode(order.interimResult, `${order.id}-interim-result`, 'Interim result');
  const final = resultNode(order.result, `${order.id}-final-result`, 'Final result');

  return [
    exchangeSearchNode(order),
    ...solverNodes(order),
    ...(description ? [description] : []),
    ...executionNodes(order.executionSteps),
    ...notebookNodes(order.notebook?.steps),
    ...(interim ? [interim] : []),
    ...(final ? [final] : [])
  ];
}

// Preserve the previous export name so Vite HMR can survive the refactor without a hard reload.
export const buildTaskFeedInserts = buildTaskThreadNodes;

export function buildQueuedTaskRoot(order: OrderView): TaskThreadNode {
  const children = buildTaskThreadNodes(order);
  const title = resolveRootTitle(order);
  const summary = resolveTaskSummary(order);
  const status = (order.status === 'completed' || order.status === 'done') ? 'completed' : order.status === 'queued' ? 'active' : 'upcoming';

  return {
    id: `${order.id}-root`,
    title,
    detail: children.length === 0 && summary && summary !== title ? summary : undefined,
    state: status,
    mode: 'compact',
    meta: order.status,
    children
  };
}

export function resolveTaskDocumentContent(order: OrderView | null): string {
  if (!order) {
    return '';
  }

  const content = parseTaskDocumentContent(order.document?.content).body.trim();
  if (content) {
    return content;
  }

  return order.description?.trim() || order.title;
}

export function appendTaskNodeComment(order: OrderView | null, nodeKey: string, content: string): string {
  if (!order) {
    return content.trim();
  }

  return appendSystemComment(order.document?.content || order.description || '', nodeKey, content);
}

export function replaceTaskNodeComment(order: OrderView | null, nodeKey: string, content: string): string {
  if (!order) {
    return content.trim();
  }

  return replaceSystemComment(order.document?.content || order.description || '', nodeKey, content);
}
