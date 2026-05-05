import type {
  ExecutionStage,
  OrderCommentMention,
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
  branchLabel?: string;
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
  systemInserts: Record<string, OrderNotebookBlock[]>;
};

export type TaskDocumentCommentPayload = {
  content: string;
  mentions?: OrderCommentMention[];
};

function parseStoredCommentPayload(raw: string): TaskDocumentCommentPayload {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { content: '' };
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      content?: unknown;
      mentions?: Array<{
        id?: unknown;
        value?: unknown;
        kind?: unknown;
        targetKind?: unknown;
      }>;
    };

    if (typeof parsed?.content !== 'string') {
      return { content: trimmed };
    }

    const mentions = Array.isArray(parsed.mentions)
      ? parsed.mentions.reduce<OrderCommentMention[]>((acc, mention) => {
          if (
            typeof mention?.id !== 'string' ||
            typeof mention?.value !== 'string' ||
            typeof mention?.kind !== 'string'
          ) {
            return acc;
          }

          acc.push({
            id: mention.id,
            value: mention.value,
            kind: mention.kind,
            targetKind: mention.targetKind === 'actor' || mention.targetKind === 'solver' ? mention.targetKind : undefined
          });
          return acc;
        }, [])
      : undefined;

    return {
      content: parsed.content.trim(),
      mentions: mentions?.length ? mentions : undefined
    };
  } catch {
    return { content: trimmed };
  }
}

function serializeStoredCommentPayload(payload: TaskDocumentCommentPayload): string {
  const content = payload.content.trim();
  if (!content) {
    return '';
  }

  const mentions = payload.mentions?.filter(
    (mention) => mention.id.trim() && mention.value.trim() && mention.kind.trim()
  );

  if (!mentions?.length) {
    return content;
  }

  return JSON.stringify({
    content,
    mentions: mentions.map((mention) => ({
      id: mention.id,
      value: mention.value,
      kind: mention.kind,
      targetKind: mention.targetKind
    }))
  });
}

function parseTaskDocumentContent(content: string | undefined): ParsedTaskDocument {
  const source = content?.trim() || '';
  if (!source) {
    return {
      body: '',
      systemComments: {},
      systemInserts: {}
    };
  }

  const systemComments: Record<string, OrderStepComment[]> = {};
  const systemInserts: Record<string, OrderNotebookBlock[]> = {};
  const lines = source.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const bodyLines: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const commentStart = line.match(/^#\+begin_node_comment:\s+(.+)$/i);
    const insertStart = line.match(/^#\+begin_node_insert:\s+(.+)$/i);
    if (!commentStart && !insertStart) {
      bodyLines.push(line);
      continue;
    }

    const nodeKey = (commentStart?.[1] || insertStart?.[1] || '').trim();
    const contentLines: string[] = [];
    index += 1;

    while (
      index < lines.length &&
      !/^#\+end_node_comment\b/i.test((lines[index] ?? '').trim()) &&
      !/^#\+end_node_insert\b/i.test((lines[index] ?? '').trim())
    ) {
      contentLines.push(lines[index] ?? '');
      index += 1;
    }

    if (nodeKey) {
      if (commentStart) {
        const commentPayload = parseStoredCommentPayload(contentLines.join('\n'));
        systemComments[nodeKey] = [
          ...(systemComments[nodeKey] ?? []),
          {
            id: `${nodeKey}-${systemComments[nodeKey]?.length ?? 0}`,
            content: commentPayload.content,
            mentions: commentPayload.mentions
          }
        ].filter((comment) => comment.content);
      } else {
        const insertContent = contentLines.join('\n').trim();
        if (insertContent.length > 0) {
          systemInserts[nodeKey] = [
            ...(systemInserts[nodeKey] ?? []),
            {
              id: `${nodeKey}-insert-${systemInserts[nodeKey]?.length ?? 0}`,
              type: 'markdown',
              content: insertContent
            }
          ];
        }
      }
    }
  }

  const body = bodyLines.join('\n').trim();
  return {
    body,
    systemComments,
    systemInserts
  };
}

function appendSystemComment(content: string | undefined, nodeKey: string, comment: TaskDocumentCommentPayload): string {
  const parsed = parseTaskDocumentContent(content);
  const blocks = [parsed.body].filter(Boolean);
  for (const [key, comments] of Object.entries(parsed.systemComments)) {
    for (const item of comments) {
      blocks.push(
        `#+begin_node_comment: ${key}\n${serializeStoredCommentPayload({ content: item.content, mentions: item.mentions })}\n#+end_node_comment`
      );
    }
  }

  for (const [key, inserts] of Object.entries(parsed.systemInserts)) {
    for (const item of inserts) {
      blocks.push(`#+begin_node_insert: ${key}\n${item.content}\n#+end_node_insert`);
    }
  }

  const serializedComment = serializeStoredCommentPayload(comment);
  if (serializedComment) {
    blocks.push(`#+begin_node_comment: ${nodeKey}\n${serializedComment}\n#+end_node_comment`);
  }
  return blocks.filter(Boolean).join('\n\n').trim();
}

function replaceSystemComment(content: string | undefined, nodeKey: string, comment: TaskDocumentCommentPayload): string {
  const parsed = parseTaskDocumentContent(content);
  const blocks = [parsed.body].filter(Boolean);

  for (const [key, comments] of Object.entries(parsed.systemComments)) {
    if (key === nodeKey) {
      continue;
    }

    for (const item of comments) {
      blocks.push(
        `#+begin_node_comment: ${key}\n${serializeStoredCommentPayload({ content: item.content, mentions: item.mentions })}\n#+end_node_comment`
      );
    }
  }

  for (const [key, inserts] of Object.entries(parsed.systemInserts)) {
    for (const item of inserts) {
      blocks.push(`#+begin_node_insert: ${key}\n${item.content}\n#+end_node_insert`);
    }
  }

  const serializedComment = serializeStoredCommentPayload(comment);
  if (serializedComment) {
    blocks.push(`#+begin_node_comment: ${nodeKey}\n${serializedComment}\n#+end_node_comment`);
  }

  return blocks.filter(Boolean).join('\n\n').trim();
}

function appendSystemInsert(content: string | undefined, nodeKey: string, insertContent: string): string {
  const parsed = parseTaskDocumentContent(content);
  const blocks = [parsed.body].filter(Boolean);

  for (const [key, comments] of Object.entries(parsed.systemComments)) {
    for (const item of comments) {
      blocks.push(
        `#+begin_node_comment: ${key}\n${serializeStoredCommentPayload({ content: item.content, mentions: item.mentions })}\n#+end_node_comment`
      );
    }
  }

  for (const [key, inserts] of Object.entries(parsed.systemInserts)) {
    for (const item of inserts) {
      blocks.push(`#+begin_node_insert: ${key}\n${item.content}\n#+end_node_insert`);
    }
  }

  blocks.push(`#+begin_node_insert: ${nodeKey}\n${insertContent.trim()}\n#+end_node_insert`);
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
  options?: Pick<TaskThreadNode, 'comments' | 'commentable' | 'stepId' | 'branchLabel'>
): TaskThreadNode {
  return { id, title, detail, state, mode: 'block', blocks, meta, ...options };
}

function loadingNode(id: string, title: string, detail: string): TaskThreadNode {
  return { id, title, detail, state: 'active', mode: 'loading' };
}

function deriveSolverHandleFromUrl(value: string | undefined): string {
  const raw = value?.trim();
  if (!raw || !/^https?:\/\//i.test(raw)) {
    return '';
  }

  try {
    const url = new URL(raw);
    const segments = url.pathname.split('/').filter(Boolean);
    const handle = segments[segments.length - 1]?.trim();
    if (!handle) {
      return '';
    }
    return `@${handle}@${url.host}`;
  } catch {
    return '';
  }
}

function isGenericSolverPlaceholder(value: string | undefined): boolean {
  const raw = value?.trim();
  if (!raw) {
    return true;
  }

  const normalized = raw.toLowerCase();
  if (['solver', 'default solver', 'saved', 'save'].includes(normalized)) {
    return true;
  }

  if (!/^https?:\/\//i.test(raw)) {
    return false;
  }

  try {
    const url = new URL(raw);
    const host = url.host.toLowerCase();
    const segments = url.pathname.split('/').filter(Boolean);
    if ((host === 'exchange.lefine.pro' || host === 'lefine.pro') && segments.length <= 1) {
      return true;
    }
    return segments.length === 0;
  } catch {
    return false;
  }
}

function resolveSolverLabel(order: OrderView): string {
  const explicitHandle = order.solverHandle?.trim();
  if (explicitHandle) {
    return explicitHandle.startsWith('@') ? explicitHandle : `@${explicitHandle}`;
  }

  const explicitName = order.solverName?.trim();
  if (explicitName) {
    return explicitName;
  }

  const executorHandle = order.executors?.[0]?.handle?.trim();
  if (executorHandle) {
    return executorHandle.startsWith('@') ? executorHandle : `@${executorHandle}`;
  }

  const executorName = order.executors?.[0]?.name?.trim();
  if (executorName) {
    return executorName;
  }

  const derivedHandle = deriveSolverHandleFromUrl(order.solver);
  if (derivedHandle) {
    return derivedHandle;
  }

  const rawSolver = order.solver?.trim() || '';
  return isGenericSolverPlaceholder(rawSolver) ? '' : rawSolver;
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
  const finalResultBlocks = order.result?.blocks;

  if (finalResultBlocks?.length) {
    return {
      id: `${order.id}-exchange-search`,
      stepId: `${order.id}-exchange-search`,
      title: 'Solution',
      detail: order.result?.summary || order.result?.title || 'The solution has been received.',
      state: 'completed',
      mode: 'block',
      blocks: finalResultBlocks,
      commentable: true,
      comments
    };
  }

  if (stage === 'assigned' || stage === 'running' || stage === 'review' || stage === 'completed') {
    return compactNode(
      `${order.id}-exchange-search`,
      'Find solvers',
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
      'Find solvers',
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
    title: 'Find solvers',
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

function resolveSystemNodeComment(order: OrderView, nodeKey: string): string {
  const comments = parseTaskDocumentContent(order.document?.content).systemComments[nodeKey];
  return comments?.[comments.length - 1]?.content?.trim() || '';
}

function deriveInsertTitle(content: string, fallback: string): string {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const firstLine = lines[0] ?? '';
  if (!firstLine) {
    return fallback;
  }

  const normalized = firstLine
    .replace(/^branch:\s+/i, '')
    .replace(/^\*+\s+/, '')
    .replace(/^[-+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .trim();

  return normalized || fallback;
}

function resolveSystemNodeInserts(order: OrderView, nodeKey: string, inheritedBranchLabel?: string): TaskThreadNode[] | undefined {
  const inserts = parseTaskDocumentContent(order.document?.content).systemInserts[nodeKey];
  if (!inserts?.length) {
    return undefined;
  }

  let branchCounter = 0;
  let taskCounter = 0;

  return inserts.map((block, index) => {
    const normalizedContent = block.content.trim();
    const isBranchInsert = /^branch:\s+/i.test(normalizedContent);
    if (isBranchInsert) {
      branchCounter += 1;
    } else {
      taskCounter += 1;
    }

    const branchLabel = isBranchInsert ? `Branch ${branchCounter}` : inheritedBranchLabel;
    const body = isBranchInsert ? normalizedContent.replace(/^branch:\s+/i, '').trim() : normalizedContent;
    const stepId = `${nodeKey}-insert-${index + 1}`;
    const title = deriveInsertTitle(body, isBranchInsert ? `Branch task ${branchCounter}` : `Task ${taskCounter}`);
    const detail = body && body !== title ? body : undefined;
    const node = compactNode(
      stepId,
      title,
      detail,
      'upcoming',
      undefined,
      stepId,
      true,
      resolveSystemNodeComments(order, stepId)
    );

    const children = resolveSystemNodeInserts(order, stepId, branchLabel);
    return {
      ...node,
      branchLabel,
      children
    };
  });
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
    ({
      ...blockNode(
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
    ),
      children: [] as TaskThreadNode[] | undefined
    })
  );
}

function notebookNodes(steps: OrderNotebookStep[] | undefined): TaskThreadNode[] {
  return (steps ?? []).map((step, index) =>
    ({
      ...blockNode(
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
    ),
      children: [] as TaskThreadNode[] | undefined
    })
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

  const solverLabel = resolveSolverLabel(order);
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
  const exchangeNode = exchangeSearchNode(order);
  const exchangeShowsFinalResult = exchangeNode.mode === 'block' && exchangeNode.title === 'Solution';

  const nodes = [
    exchangeNode,
    ...solverNodes(order),
    ...(description ? [description] : []),
    ...executionNodes(order.executionSteps),
    ...notebookNodes(order.notebook?.steps),
    ...(interim ? [interim] : []),
    ...(final && !exchangeShowsFinalResult ? [final] : [])
  ];

  return nodes.map((node) => ({
    ...node,
    children: [...(node.children ?? []), ...(resolveSystemNodeInserts(order, node.stepId || node.id, node.branchLabel) ?? [])]
  }));
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

  return appendSystemComment(order.document?.content || order.description || '', nodeKey, { content });
}

export function replaceTaskNodeComment(order: OrderView | null, nodeKey: string, content: string, mentions?: OrderCommentMention[]): string {
  if (!order) {
    return content.trim();
  }

  return replaceSystemComment(order.document?.content || order.description || '', nodeKey, { content, mentions });
}

export function appendTaskNodeCommentWithMetadata(
  order: OrderView | null,
  nodeKey: string,
  payload: TaskDocumentCommentPayload
): string {
  if (!order) {
    return payload.content.trim();
  }

  return appendSystemComment(order.document?.content || order.description || '', nodeKey, payload);
}

export function resolveTaskNodeComment(order: OrderView | null, nodeKey: string): string {
  if (!order) {
    return '';
  }

  return resolveSystemNodeComment(order, nodeKey);
}

export function appendTaskNodeInsert(order: OrderView | null, nodeKey: string, content: string): string {
  if (!order) {
    return content.trim();
  }

  return appendSystemInsert(order.document?.content || order.description || '', nodeKey, content);
}
