import type { OrderNotebookBlock, ProgressState } from '$lib/components/kefine/kefine-workflow';
import type { TaskBranchPlacement, TaskBranchVisibility, TaskThreadNode } from '$lib/components/kefine/kefine-task-feed';

type OrgPlanNodeDraft = {
  level: number;
  title: string;
  lines: string[];
  children: OrgPlanNodeDraft[];
};

type OrgPlanProperties = {
  id?: string;
  state?: ProgressState;
};

const NODE_BLOCK_RE = /^#\+(?:begin|end)_node_(?:comment|insert)\b/i;
const BRANCH_TAG_RE = /\[\[\s*branch:([^\]]+)\]\]/gi;

function normalizeNodeId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80);
}

function normalizeState(value: string | undefined): ProgressState {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'completed' || normalized === 'active' || normalized === 'upcoming') {
    return normalized;
  }
  return 'upcoming';
}

function stripBranchTags(value: string): string {
  return value.replace(BRANCH_TAG_RE, '').trim();
}

function branchStyleFromText(value: string): {
  placement: TaskBranchPlacement;
  visibility: TaskBranchVisibility;
  tags: string[];
} {
  let placement: TaskBranchPlacement = 'normal';
  let visibility: TaskBranchVisibility = 'visible';
  const tags = new Set<string>();

  for (const match of value.matchAll(BRANCH_TAG_RE)) {
    for (const token of (match[1] ?? '').toLowerCase().split(/[,\s]+/)) {
      const tag = token.trim();
      if (!tag) continue;
      tags.add(tag);
      if (tag === 'left') placement = 'left';
      if (tag === 'normal') placement = 'normal';
      if (tag === 'hidden') visibility = 'hidden';
      if (tag === 'visible') visibility = 'visible';
    }
  }

  return { placement, visibility, tags: Array.from(tags) };
}

function extractProperties(lines: string[]): { properties: OrgPlanProperties; bodyLines: string[] } {
  const properties: OrgPlanProperties = {};
  const bodyLines = [...lines];
  const start = bodyLines.findIndex((line) => line.trim().toUpperCase() === ':PROPERTIES:');
  if (start < 0) {
    return { properties, bodyLines };
  }

  const end = bodyLines.findIndex((line, index) => index > start && line.trim().toUpperCase() === ':END:');
  if (end < 0) {
    return { properties, bodyLines };
  }

  for (const line of bodyLines.slice(start + 1, end)) {
    const match = line.match(/^:([A-Z0-9_ -]+):\s*(.*)$/i);
    if (!match) continue;

    const key = (match[1] ?? '').trim().toUpperCase();
    const value = (match[2] ?? '').trim();
    if (key === 'ID') properties.id = normalizeNodeId(value);
    if (key === 'STATE') properties.state = normalizeState(value);
  }

  return {
    properties,
    bodyLines: [...bodyLines.slice(0, start), ...bodyLines.slice(end + 1)]
  };
}

function removeSystemBlocks(lines: string[]): string[] {
  const next: string[] = [];
  let skipUntil: RegExp | null = null;

  for (const line of lines) {
    if (skipUntil) {
      if (skipUntil.test(line.trim())) {
        skipUntil = null;
      }
      continue;
    }

    const trimmed = line.trim();
    if (/^#\+begin_node_comment\b/i.test(trimmed)) {
      skipUntil = /^#\+end_node_comment\b/i;
      continue;
    }
    if (/^#\+begin_node_insert\b/i.test(trimmed)) {
      skipUntil = /^#\+end_node_insert\b/i;
      continue;
    }
    if (NODE_BLOCK_RE.test(trimmed)) {
      continue;
    }

    next.push(line);
  }

  return next;
}

function firstParagraph(lines: string[]): string {
  const paragraph: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed && paragraph.length) break;
    if (!trimmed) continue;
    paragraph.push(trimmed);
  }
  return paragraph.join(' ').trim();
}

function toThreadNode(draft: OrgPlanNodeDraft, path: string[]): TaskThreadNode {
  const { properties, bodyLines } = extractProperties(removeSystemBlocks(draft.lines));
  const cleanTitle = stripBranchTags(draft.title) || 'Task';
  const id = properties.id || normalizeNodeId([...path, cleanTitle].join('-')) || `plan-node-${path.join('-')}`;
  const content = bodyLines.join('\n').trim();
  const style = branchStyleFromText(`${draft.title}\n${content}`);
  const blocks: OrderNotebookBlock[] = content
    ? [{ id: `${id}-body`, type: 'markdown', content }]
    : [];

  return {
    id,
    stepId: id,
    title: cleanTitle,
    detail: blocks.length ? firstParagraph(bodyLines) : undefined,
    state: properties.state ?? 'upcoming',
    mode: blocks.length ? 'block' : 'compact',
    blocks: blocks.length ? blocks : undefined,
    commentable: true,
    branchPlacement: style.placement,
    branchVisibility: style.visibility,
    branchTags: style.tags,
    editableSource: content || cleanTitle,
    children: draft.children.map((child, index) => toThreadNode(child, [...path, String(index + 1)]))
  };
}

export function parseOrgPlanThreadNodes(content: string | undefined): TaskThreadNode[] {
  const source = content?.replace(/\r\n/g, '\n').replace(/\r/g, '\n') ?? '';
  if (!/^\*+\s+/m.test(source)) {
    return [];
  }

  const roots: OrgPlanNodeDraft[] = [];
  const stack: OrgPlanNodeDraft[] = [];

  for (const line of source.split('\n')) {
    const heading = line.match(/^(\*{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      const node: OrgPlanNodeDraft = {
        level,
        title: heading[2]?.trim() || 'Task',
        lines: [],
        children: []
      };
      stack.length = level - 1;
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
      stack[level - 1] = node;
      continue;
    }

    stack[stack.length - 1]?.lines.push(line);
  }

  return roots.map((node, index) => toThreadNode(node, [String(index + 1)]));
}
