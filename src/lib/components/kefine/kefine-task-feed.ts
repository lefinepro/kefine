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
import { parseOrgPlanThreadNodes } from '$lib/components/kefine/kefine-org-plan';

export type TaskThreadNode = {
  id: string;
  stepId?: string;
  title: string;
  detail?: string;
  branchLabel?: string;
  branchVisibility?: 'visible' | 'hidden';
  branchPlacement?: 'normal' | 'left';
  branchTags?: string[];
  editableSource?: string;
  state: ProgressState;
  mode: 'compact' | 'block' | 'loading';
  meta?: string;
  blocks?: OrderNotebookBlock[];
  comments?: OrderStepComment[];
  commentable?: boolean;
  children?: TaskThreadNode[];
};

export type TaskBranchPlacement = 'normal' | 'left';
export type TaskBranchVisibility = 'visible' | 'hidden';

export type TaskBranchStyle = {
  visibility: TaskBranchVisibility;
  placement: TaskBranchPlacement;
  tags: string[];
};

const BRANCH_TAG_RE = /\[\[\s*branch:([^\]]+)\]\]/gi;

export function parseTaskBranchStyle(raw: string): TaskBranchStyle {
  const matches = Array.from(raw.matchAll(BRANCH_TAG_RE));
  let visibility: TaskBranchVisibility = 'visible';
  let placement: TaskBranchPlacement = 'normal';
  const tags = new Set<string>();

  for (const match of matches) {
    const body = (match[1] ?? '').toLowerCase();
    const normalized = body
      .split(/[,\s]+/)
      .map((item) => item.trim())
      .filter(Boolean);

    for (const token of normalized) {
      tags.add(token);
      if (token === 'left') {
        placement = 'left';
      } else if (token === 'hidden') {
        visibility = 'hidden';
      } else if (token === 'normal') {
        placement = 'normal';
      }
    }
  }

  return {
    visibility,
    placement,
    tags: Array.from(tags)
  };
}

export function stripTaskBranchStyle(raw: string): string {
  return raw.replace(BRANCH_TAG_RE, '').trim();
}

export function composeBranchInsertSource(
  content: string,
  style: Pick<TaskBranchStyle, 'placement' | 'visibility'>,
  includeDefaultMarker = false
): string {
  const normalizedStyle: string[] = [];
  if (style.placement === 'left') {
    normalizedStyle.push('left');
  }
  if (style.visibility === 'hidden') {
    normalizedStyle.push('hidden');
  }
  if (includeDefaultMarker && normalizedStyle.length === 0) {
    normalizedStyle.push('normal');
  }

  const prefix = normalizedStyle.length ? `[[branch:${normalizedStyle.join(',')}]] ` : '';
  return prefix ? `${prefix}${content}` : content;
}

const BRANCH_LEGACY_RE = /^branch:\s*/i;
const BRANCH_LEGACY_LABEL_RE = /^branch:\s*(.+)$/i;

function buildNodeVisibility(style: TaskBranchStyle, fallback: TaskBranchVisibility): TaskBranchVisibility {
  const hasExplicitVisibility = style.tags.includes('visible') || style.tags.includes('hidden');
  if (!hasExplicitVisibility) {
    return fallback;
  }

  return style.visibility;
}

function buildNodePlacement(style: TaskBranchStyle, fallback: TaskBranchPlacement): TaskBranchPlacement {
  const hasExplicitPlacement = style.tags.includes('left') || style.tags.includes('normal');
  if (!hasExplicitPlacement) {
    return fallback;
  }

  return style.placement;
}

function resolveLegacyBranchInsert(raw: string): boolean {
  return BRANCH_LEGACY_LABEL_RE.test(raw.trim());
}

type ParsedTaskDocument = {
  body: string;
  systemComments: Record<string, OrderStepComment[]>;
  systemInserts: Record<string, OrderNotebookBlock[]>;
};

type TaskThreadNodePath = number[];

function cloneTaskThreadNode(node: TaskThreadNode): TaskThreadNode {
  return {
    ...node,
    children: node.children?.map((child) => cloneTaskThreadNode(child))
  };
}

function cloneTaskThreadNodes(nodes: TaskThreadNode[]): TaskThreadNode[] {
  return nodes.map((node) => cloneTaskThreadNode(node));
}

function findTaskThreadNodePath(nodes: TaskThreadNode[], nodeId: string, path: TaskThreadNodePath = []): TaskThreadNodePath | null {
  for (let index = 0; index < nodes.length; index += 1) {
    const candidate = nodes[index];
    if (!candidate) {
      continue;
    }

    if (candidate.id === nodeId) {
      return [...path, index];
    }

    if (!candidate.children?.length) {
      continue;
    }

    const nestedPath = findTaskThreadNodePath(candidate.children, nodeId, [...path, index]);
    if (nestedPath) {
      return nestedPath;
    }
  }

  return null;
}

function buildTaskThreadRelationsById(nodes: TaskThreadNode[]): {
  parentById: Record<string, string | null>;
  indexById: Record<string, number>;
  depthById: Record<string, number>;
} {
  const parentById: Record<string, string | null> = {};
  const indexById: Record<string, number> = {};
  const depthById: Record<string, number> = {};

  function walk(list: TaskThreadNode[], parentId: string | null, depth: number): void {
    list.forEach((node, index) => {
      parentById[node.id] = parentId;
      indexById[node.id] = index;
      depthById[node.id] = depth;

      if (node.children?.length) {
        walk(node.children, node.id, depth + 1);
      }
    });
  }

  walk(nodes, null, 0);
  return { parentById, indexById, depthById };
}

export function getTaskThreadNodeRelations(nodes: TaskThreadNode[]): {
  parentById: Record<string, string | null>;
  childByParentId: Record<string, string[]>;
  depthById: Record<string, number>;
} {
  const direct = buildTaskThreadRelationsById(nodes);
  const childByParentId: Record<string, string[]> = {};

  for (const [nodeId, parentId] of Object.entries(direct.parentById)) {
    const bucket = parentId === null ? '__root' : parentId;
    childByParentId[bucket] = [...(childByParentId[bucket] ?? []), nodeId];
  }

  return {
    parentById: direct.parentById,
    childByParentId,
    depthById: direct.depthById
  };
}

export function getTaskThreadNodeBacklinks(nodes: TaskThreadNode[]): Record<string, string[]> {
  const relations = getTaskThreadNodeRelations(nodes);
  const backlinks: Record<string, string[]> = {};
  for (const [id] of Object.entries(relations.parentById)) {
    const chain: string[] = [];
    let current = relations.parentById[id];
    while (current) {
      chain.push(current);
      current = relations.parentById[current] ?? null;
    }
    backlinks[id] = chain;
  }

  return backlinks;
}

function getTaskThreadNodeAtPath(nodes: TaskThreadNode[], path: TaskThreadNodePath): TaskThreadNode | null {
  if (!path.length) {
    return null;
  }

  let current = nodes;
  let currentNode: TaskThreadNode | null = null;
  for (let depth = 0; depth < path.length; depth += 1) {
    const segment = path[depth];
    const target = current[segment];
    if (!target) {
      return null;
    }

    if (depth === path.length - 1) {
      currentNode = target;
      break;
    }

    if (!target.children?.length) {
      return null;
    }

    current = target.children;
  }

  return currentNode;
}

function getTaskThreadChildrenByPath(nodes: TaskThreadNode[], path: TaskThreadNodePath): TaskThreadNode[] {
  if (!path.length) {
    return nodes;
  }

  const parentPath = path.slice(0, -1);
  const parent = getTaskThreadNodeAtPath(nodes, parentPath);
  return parent?.children ? [...parent.children] : [...nodes];
}

function removeTaskThreadNodeByPath(nodes: TaskThreadNode[], path: TaskThreadNodePath): { nodes: TaskThreadNode[]; removed?: TaskThreadNode } {
  if (!path.length) {
    return { nodes: cloneTaskThreadNodes(nodes) };
  }

  const cloned = cloneTaskThreadNodes(nodes);
  const parentPath = path.slice(0, -1);
  const index = path.at(-1);
  if (index === undefined || index < 0) {
    return { nodes: cloned };
  }

  if (!parentPath.length) {
    const removed = cloned[index];
    return {
      nodes: [...cloned.slice(0, index), ...cloned.slice(index + 1)],
      removed
    };
  }

  const parent = getTaskThreadNodeAtPath(cloned, parentPath);
  if (!parent?.children?.length) {
    return { nodes: cloned };
  }

  const removed = parent.children[index];
  parent.children = [...parent.children.slice(0, index), ...parent.children.slice(index + 1)];
  return {
    nodes: cloned,
    removed
  };
}

function insertTaskThreadNodeByPath(nodes: TaskThreadNode[], path: TaskThreadNodePath, node: TaskThreadNode): TaskThreadNode[] {
  if (!path.length) {
    return [...nodes, node];
  }

  const cloned = cloneTaskThreadNodes(nodes);
  const parentPath = path.slice(0, -1);
  const index = path.at(-1);
  if (index === undefined || index < 0) {
    return cloned;
  }

  if (!parentPath.length) {
    const before = cloned.slice(0, Math.min(index, cloned.length));
    const after = cloned.slice(Math.min(index, cloned.length));
    return [...before, node, ...after];
  }

  const parent = getTaskThreadNodeAtPath(cloned, parentPath);
  if (!parent) {
    return cloned;
  }

  const children = parent.children ?? [];
  parent.children = [...children.slice(0, Math.min(index, children.length)), node, ...children.slice(Math.min(index, children.length))];
  return cloned;
}

function mergeTaskBranchStyle(parent?: TaskBranchStyle, own?: TaskBranchStyle): TaskBranchStyle {
  const inherited = parent ?? { visibility: 'visible', placement: 'normal', tags: [] };
  const nextTags = new Set<string>(inherited.tags);
  for (const tag of own?.tags ?? []) {
    nextTags.add(tag);
  }

  return {
    visibility: buildNodeVisibility(own ?? inherited, inherited.visibility),
    placement: buildNodePlacement(own ?? inherited, inherited.placement),
    tags: Array.from(nextTags)
  };
}

function nextBranchLabel(inheritedBranchLabel: string | undefined, branchCounter: number): string {
  const inheritedIndex = Number(inheritedBranchLabel?.match(/^Branch\s+(\d+)$/i)?.[1] ?? 0);
  return `Branch ${inheritedIndex + Math.max(1, branchCounter)}`;
}

export function indentTaskThreadNode(nodes: TaskThreadNode[], nodeId: string): TaskThreadNode[] {
  const path = findTaskThreadNodePath(nodes, nodeId);
  if (!path || path.length < 1) {
    return cloneTaskThreadNodes(nodes);
  }

  const index = path.at(-1) ?? -1;
  if (index <= 0) {
    return cloneTaskThreadNodes(nodes);
  }

  const removedResult = removeTaskThreadNodeByPath(nodes, path);
  if (!removedResult.removed) {
    return cloneTaskThreadNodes(nodes);
  }

  const targetPath = [...path];
  targetPath[targetPath.length - 1] = index - 1;
  const previousSibling = getTaskThreadNodeAtPath(removedResult.nodes, targetPath);
  if (!previousSibling) {
    return removedResult.nodes;
  }

  const insertPath = [...targetPath, previousSibling.children?.length ?? 0];
  return insertTaskThreadNodeByPath(removedResult.nodes, insertPath, removedResult.removed);
}

export function outdentTaskThreadNode(nodes: TaskThreadNode[], nodeId: string): TaskThreadNode[] {
  const path = findTaskThreadNodePath(nodes, nodeId);
  if (!path || path.length < 2) {
    return cloneTaskThreadNodes(nodes);
  }

  const removedResult = removeTaskThreadNodeByPath(nodes, path);
  if (!removedResult.removed) {
    return cloneTaskThreadNodes(nodes);
  }

  const parentPath = path.slice(0, -1);
  const grandParentPath = path.slice(0, -2);
  if (grandParentPath.length === 0) {
    const insertPath = [Math.min(parentPath[0] + 1, removedResult.nodes.length)];
    return insertTaskThreadNodeByPath(removedResult.nodes, insertPath, removedResult.removed);
  }

  const grandParent = getTaskThreadNodeAtPath(removedResult.nodes, grandParentPath);
  if (!grandParent) {
    return removedResult.nodes;
  }

  const insertAt = Math.min((parentPath.at(-1) ?? 0) + 1, grandParent.children?.length ?? 0);
  const withInserted = insertTaskThreadNodeByPath(removedResult.nodes, [...grandParentPath, insertAt], removedResult.removed);
  return withInserted;
}

export function addTaskThreadNode(
  nodes: TaskThreadNode[],
  node: TaskThreadNode,
  options?: { parentId?: string; index?: number }
): TaskThreadNode[] {
  if (!options?.parentId) {
    return insertTaskThreadNodeByPath(nodes, [Math.max(0, options?.index ?? nodes.length)], node);
  }

  const parentPath = findTaskThreadNodePath(nodes, options.parentId);
  if (!parentPath) {
    return cloneTaskThreadNodes(nodes);
  }

  const parent = getTaskThreadNodeAtPath(nodes, parentPath);
  if (!parent) {
    return cloneTaskThreadNodes(nodes);
  }

  const insertPath = [...parentPath, options.index ?? (parent.children?.length ?? 0)];
  const next = insertTaskThreadNodeByPath(nodes, insertPath, node);
  return next;
}

export function removeTaskThreadNode(nodes: TaskThreadNode[], nodeId: string): TaskThreadNode[] {
  return removeTaskThreadNodeByPath(nodes, findTaskThreadNodePath(nodes, nodeId) || []).nodes;
}

export function moveTaskThreadNode(nodes: TaskThreadNode[], nodeId: string, targetParentId: string | null, index = 0): TaskThreadNode[] {
  const path = findTaskThreadNodePath(nodes, nodeId);
  if (!path) {
    return cloneTaskThreadNodes(nodes);
  }

  const sourceParentId = path.length > 1 ? (getTaskThreadNodeAtPath(nodes, path.slice(0, -1))?.id ?? null) : null;
  const targetPath = targetParentId ? findTaskThreadNodePath(nodes, targetParentId) : [];
  if (targetParentId && !targetPath) {
    return cloneTaskThreadNodes(nodes);
  }

  if (targetParentId && targetPath && isPathDescendantOrSelf(path, targetPath)) {
    return cloneTaskThreadNodes(nodes);
  }

  const removedResult = removeTaskThreadNodeByPath(nodes, path);
  if (!removedResult.removed) {
    return removedResult.nodes;
  }

  const effectiveIndex = (() => {
    const nextIndex = Math.max(0, index);
    if (!targetParentId) {
      const sourceIndex = path[0] ?? 0;
      return Math.min(sourceIndex < nextIndex ? Math.max(0, nextIndex - 1) : nextIndex, removedResult.nodes.length);
    }

    const targetPath = findTaskThreadNodePath(nodes, targetParentId);
    if (!targetPath) {
      return Math.min(Math.max(0, index), removedResult.nodes.length);
    }

    const targetParent = getTaskThreadNodeAtPath(nodes, targetPath);
    if (!targetParent) {
      return Math.min(Math.max(0, index), removedResult.nodes.length);
    }

    if (
      targetParentId === sourceParentId &&
      (path.at(-1) ?? 0) < nextIndex
    ) {
      return Math.max(0, nextIndex - 1);
    }

    return Math.min(Math.max(0, index), getTaskThreadChildrenByPath(nodes, targetPath).length);
  })();

  const insertionPath = targetParentId
    ? [...(targetPath || []), effectiveIndex]
    : [effectiveIndex];
  return insertTaskThreadNodeByPath(removedResult.nodes, insertionPath, removedResult.removed);
}

function isPathDescendantOrSelf(path: TaskThreadNodePath, candidate: TaskThreadNodePath): boolean {
  if (candidate.length < path.length) {
    return false;
  }
  return candidate.slice(0, path.length).every((segment, index) => segment === path[index]);
}


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

function replaceSystemInsert(content: string | undefined, nodeKey: string, insertContent: string): string {
  const source = content?.trim() || '';
  if (!source) {
    return appendSystemInsert(source, nodeKey, insertContent);
  }

  const escapedKey = nodeKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const insertRe = new RegExp(
    `(^|\\n)\\#\\+begin_node_insert:\\s*${escapedKey}\\n[\\s\\S]*?\\n\\#\\+end_node_insert(\\n|$)`,
    'g'
  );

  let replaced = false;
  const next = source.replace(insertRe, (_, prefix: string, suffix: string) => {
    if (replaced) {
      return `${prefix}#+begin_node_insert: ${nodeKey}\n${insertContent.trim()}\n#+end_node_insert${suffix}`;
    }

    replaced = true;
    return `${prefix}#+begin_node_insert: ${nodeKey}\n${insertContent.trim()}\n#+end_node_insert${suffix}`;
  });

  if (replaced) {
    return next.trim();
  }

  const generatedInsertMatch = nodeKey.match(/^(.*)-insert-(\d+)$/);
  const parentNodeKey = generatedInsertMatch?.[1];
  const insertIndex = Number(generatedInsertMatch?.[2] ?? 0) - 1;
  if (parentNodeKey && insertIndex >= 0) {
    const parsed = parseTaskDocumentContent(source);
    const parentInserts = parsed.systemInserts[parentNodeKey];
    if (parentInserts?.[insertIndex]) {
      const blocks = [parsed.body].filter(Boolean);

      for (const [key, comments] of Object.entries(parsed.systemComments)) {
        for (const item of comments) {
          blocks.push(
            `#+begin_node_comment: ${key}\n${serializeStoredCommentPayload({ content: item.content, mentions: item.mentions })}\n#+end_node_comment`
          );
        }
      }

      for (const [key, inserts] of Object.entries(parsed.systemInserts)) {
        inserts.forEach((item, index) => {
          const nextContent = key === parentNodeKey && index === insertIndex ? insertContent.trim() : item.content;
          blocks.push(`#+begin_node_insert: ${key}\n${nextContent}\n#+end_node_insert`);
        });
      }

      return blocks.filter(Boolean).join('\n\n').trim();
    }
  }

  return appendSystemInsert(source, nodeKey, insertContent);
}

function normalizeBranchInsertSource(raw: string): string {
  const styleless = stripTaskBranchStyle(raw);
  const legacyFree = styleless.replace(BRANCH_LEGACY_RE, '').trim();
  return legacyFree;
}

export function isBranchInsert(raw: string): boolean {
  const style = parseTaskBranchStyle(raw);
  if (style.tags.some((tag) => ['left', 'hidden', 'normal', 'visible'].includes(tag))) {
    return true;
  }

  return resolveLegacyBranchInsert(raw);
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
    if (host === 'lefine.pro' && segments.length <= 1) {
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
    .replace(/^\*+\s+/, '')
    .replace(/^[-+]\s+/, '')
    .replace(/^\d+\.\s+/, '')
    .trim();

  return normalized || fallback;
}

function resolveSystemNodeInserts(
  order: OrderView,
  nodeKey: string,
  inheritedBranchLabel?: string,
  inheritedBranchStyle: TaskBranchStyle = { visibility: 'visible', placement: 'normal', tags: [] }
): TaskThreadNode[] | undefined {
  const inserts = parseTaskDocumentContent(order.document?.content).systemInserts[nodeKey];
  if (!inserts?.length) {
    return undefined;
  }

  let branchCounter = 0;
  let taskCounter = 0;

  return inserts.map((block, index) => {
    const raw = block.content.trim();
    const branchStyle = mergeTaskBranchStyle(inheritedBranchStyle, parseTaskBranchStyle(raw));
    const branchDeclaration = isBranchInsert(raw);
    if (branchDeclaration) {
      branchCounter += 1;
    } else {
      taskCounter += 1;
    }

    const branchLabel = branchDeclaration || inheritedBranchLabel
      ? nextBranchLabel(inheritedBranchLabel, branchDeclaration ? branchCounter : 1)
      : undefined;
    const normalized = normalizeBranchInsertSource(raw);
    const stepId = `${nodeKey}-insert-${index + 1}`;
    const title = deriveInsertTitle(
      normalized,
      branchDeclaration ? `Branch task ${branchCounter}` : `Task ${taskCounter}`
    );
    const detail = normalized && normalized !== title ? normalized : undefined;
    const visibility = branchStyle.visibility;
    const placement = branchStyle.placement;
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

    const children = resolveSystemNodeInserts(order, stepId, branchLabel, branchStyle);
    return {
      ...node,
      branchLabel,
      branchVisibility: visibility,
      branchPlacement: placement,
      branchTags: branchStyle.tags,
      editableSource: normalized,
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
  const nodeKey = `${order.id}-description`;
  const parsedDocument = parseTaskDocumentContent(order.document?.content);
  const hasAttachedContent = Boolean(
    parsedDocument.systemComments[nodeKey]?.length ||
      parsedDocument.systemInserts[nodeKey]?.length
  );
  if (!content || (content === order.title.trim() && !hasAttachedContent)) {
    return null;
  }

  return blockNode(
    nodeKey,
    'Description',
    undefined,
    'completed',
    [{ id: `${nodeKey}-block`, type: 'markdown', content }],
    undefined,
    {
      stepId: nodeKey,
      commentable: true,
      comments: resolveSystemNodeComments(order, nodeKey)
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

  return blockNode(id, title, undefined, 'completed', section.blocks);
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

function attachDocumentInserts(order: OrderView, node: TaskThreadNode): TaskThreadNode {
  const inheritedStyle = {
    visibility: node.branchVisibility ?? 'visible',
    placement: node.branchPlacement ?? 'normal',
    tags: node.branchTags ?? []
  };
  const insertedChildren = resolveSystemNodeInserts(
    order,
    node.stepId || node.id,
    node.branchLabel,
    inheritedStyle
  ) ?? [];

  return {
    ...node,
    comments: node.comments ?? resolveSystemNodeComments(order, node.stepId || node.id),
    children: [
      ...(node.children ?? []).map((child) => attachDocumentInserts(order, child)),
      ...insertedChildren.map((child) => attachDocumentInserts(order, child))
    ]
  };
}

export function buildTaskThreadNodes(
  order: OrderView | null,
  labels: { interimResult?: string; resultTitle?: string; finalResult?: string } = {}
): TaskThreadNode[] {
  if (!order) {
    return [];
  }

  const description = descriptionNode(order);
  const interim = resultNode(order.interimResult, `${order.id}-interim-result`, labels.interimResult || 'Interim result');
  const final = resultNode(order.result, `${order.id}-final-result`, labels.resultTitle || labels.finalResult || 'Result');
  const exchangeNode = exchangeSearchNode(order);
  const planNodes = parseOrgPlanThreadNodes(order.document?.content);

  if (planNodes.length > 0) {
    return planNodes.map((node) => attachDocumentInserts(order, node));
  }

  const nodes = [
    exchangeNode,
    ...solverNodes(order),
    ...(description ? [description] : []),
    ...executionNodes(order.executionSteps),
    ...notebookNodes(order.notebook?.steps),
    ...(interim ? [interim] : []),
    ...(final ? [final] : [])
  ];

  return nodes.map((node) => attachDocumentInserts(order, node));
}

// Preserve the previous export name so Vite HMR can survive the refactor without a hard reload.
export const buildTaskFeedInserts = buildTaskThreadNodes;

export function buildQueuedTaskRoot(
  order: OrderView,
  labels: { interimResult?: string; resultTitle?: string; finalResult?: string } = {}
): TaskThreadNode {
  const children = buildTaskThreadNodes(order, labels);
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

export function replaceTaskNodeInsert(order: OrderView | null, nodeKey: string, content: string): string {
  if (!order) {
    return content.trim();
  }

  return replaceSystemInsert(order.document?.content || order.description || '', nodeKey, content);
}

export function appendTaskNodeBranchInsert(
  order: OrderView | null,
  nodeKey: string,
  content: string,
  options?: { placement?: TaskBranchPlacement; visibility?: TaskBranchVisibility }
): string {
  const source = composeBranchInsertSource(content, {
    placement: options?.placement ?? 'normal',
    visibility: options?.visibility ?? 'visible'
  }, true);
  const normalized = source.trim() || content;
  return appendTaskNodeInsert(order, nodeKey, normalized);
}
