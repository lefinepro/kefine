import type { DraftOrder, OrderNotebookBlock, OrderResultSection, OrderView, TaskAccessMode } from '$lib/components/kefine/kefine-workflow';

export type TaskCloneFormat = 'txt' | 'md' | 'org';

type TaskCloneFile = {
  filename: string;
  content: string;
  mimeType: string;
};

type TaskClonePackage = {
  title: string;
  metadata: Array<[string, string]>;
  description: string;
  access: string[];
  notebook: string[];
  results: string[];
};

function normalizeLine(value: string | undefined): string {
  return value?.trim() || '-';
}

function slugifyFilename(value: string): string {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'task-package';
}

function formatAccessRule(order: OrderView, mode: TaskAccessMode): string | null {
  const rule = order.accessRules?.[mode];
  if (!rule?.enabled) {
    return null;
  }

  return `${mode}: enabled ($${(rule.priceUsd ?? 0).toFixed(0)})`;
}

function blockToText(block: OrderNotebookBlock): string[] {
  const lines: string[] = [];
  if (block.title?.trim()) {
    lines.push(block.title.trim());
  }

  const body = block.content?.trim();
  if (body) {
    lines.push(body);
  }

  if (block.href?.trim()) {
    lines.push(`Link: ${block.href.trim()}`);
  }

  return lines;
}

function resultSectionToText(section: OrderResultSection | undefined): string[] {
  if (!section) {
    return [];
  }

  const lines = [section.title];
  if (section.summary?.trim()) {
    lines.push(section.summary.trim());
  }

  for (const block of section.blocks) {
    lines.push(...blockToText(block));
  }

  return lines;
}

function buildTaskClonePackage(order: OrderView): TaskClonePackage {
  const metadata: Array<[string, string]> = [
    ['ID', normalizeLine(order.id)],
    ['Share ID', normalizeLine(order.shareId)],
    ['Owner', normalizeLine(order.ownerUsername ? `@${order.ownerUsername}` : order.ownerDisplayName)],
    ['Actor', normalizeLine(order.actorHandle ? `@${order.actorHandle}` : undefined)],
    ['Status', normalizeLine(order.status)],
    ['Created', normalizeLine(order.createdAt)],
    ['Execution estimate', normalizeLine(order.executionEstimate)],
    ['Public', order.isPublicTask === true ? 'yes' : 'no'],
    ['Tags', order.labels?.length ? order.labels.map((tag) => `#${tag}`).join(', ') : '-']
  ];

  const access = (['view', 'watch', 'join'] as const)
    .map((mode) => formatAccessRule(order, mode))
    .filter((item): item is string => Boolean(item));

  const notebook = (order.notebook?.steps ?? []).flatMap((step, index) => {
    const lines = [`${index + 1}. ${step.title}`];
    if (step.detail?.trim()) {
      lines.push(step.detail.trim());
    }
    for (const block of step.blocks) {
      lines.push(...blockToText(block));
    }
    for (const comment of step.comments ?? []) {
      lines.push(`Comment (${comment.authorHandle || comment.authorName || 'Comment'}): ${comment.content.trim()}`);
    }
    return lines;
  });

  const results = [
    ...resultSectionToText(order.interimResult),
    ...resultSectionToText(order.result),
    ...(order.document?.content?.trim() ? ['Document', order.document.content.trim()] : [])
  ];

  return {
    title: order.title.trim() || 'Task',
    metadata,
    description: order.description?.trim() || order.document?.content?.trim() || order.title.trim(),
    access,
    notebook,
    results
  };
}

function toTxt(pkg: TaskClonePackage): string {
  const lines = [pkg.title, '', 'METADATA'];
  for (const [key, value] of pkg.metadata) {
    lines.push(`${key}: ${value}`);
  }

  lines.push('', 'DESCRIPTION', pkg.description || '-');

  if (pkg.access.length > 0) {
    lines.push('', 'ACCESS', ...pkg.access);
  }

  if (pkg.notebook.length > 0) {
    lines.push('', 'NOTEBOOK', ...pkg.notebook);
  }

  if (pkg.results.length > 0) {
    lines.push('', 'RESULTS', ...pkg.results);
  }

  return lines.join('\n');
}

function toMarkdown(pkg: TaskClonePackage): string {
  const lines = [`# ${pkg.title}`, '', '## Metadata'];
  for (const [key, value] of pkg.metadata) {
    lines.push(`- **${key}:** ${value}`);
  }

  lines.push('', '## Description', '', pkg.description || '-');

  if (pkg.access.length > 0) {
    lines.push('', '## Access', '', ...pkg.access.map((item) => `- ${item}`));
  }

  if (pkg.notebook.length > 0) {
    lines.push('', '## Notebook', '', ...pkg.notebook.map((item) => `- ${item}`));
  }

  if (pkg.results.length > 0) {
    lines.push('', '## Results', '', ...pkg.results.map((item) => `- ${item}`));
  }

  return lines.join('\n');
}

function toOrg(pkg: TaskClonePackage): string {
  const lines = [`* ${pkg.title}`, ':PROPERTIES:'];
  for (const [key, value] of pkg.metadata) {
    lines.push(`:${key.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}: ${value}`);
  }
  lines.push(':END:', '', '** Description', pkg.description || '-');

  if (pkg.access.length > 0) {
    lines.push('', '** Access', ...pkg.access.map((item) => `- ${item}`));
  }

  if (pkg.notebook.length > 0) {
    lines.push('', '** Notebook', ...pkg.notebook.map((item) => `- ${item}`));
  }

  if (pkg.results.length > 0) {
    lines.push('', '** Results', ...pkg.results.map((item) => `- ${item}`));
  }

  return lines.join('\n');
}

export function buildTaskCloneFile(order: OrderView, format: TaskCloneFormat): TaskCloneFile {
  const pkg = buildTaskClonePackage(order);
  const baseFilename = slugifyFilename(order.title || order.shareId || order.id);

  if (format === 'txt') {
    return {
      filename: `${baseFilename}.txt`,
      content: toTxt(pkg),
      mimeType: 'text/plain;charset=utf-8'
    };
  }

  if (format === 'org') {
    return {
      filename: `${baseFilename}.org`,
      content: toOrg(pkg),
      mimeType: 'text/plain;charset=utf-8'
    };
  }

  return {
    filename: `${baseFilename}.md`,
    content: toMarkdown(pkg),
    mimeType: 'text/markdown;charset=utf-8'
  };
}

export function cloneOrderToDraft(order: OrderView): DraftOrder {
  const sourceText = order.document?.content?.trim() || order.description?.trim() || order.title.trim();

  return {
    ...(order.taskIcon?.trim() ? { taskIcon: order.taskIcon.trim() } : {}),
    title: order.title.trim(),
    description: sourceText,
    tags: [...(order.labels ?? [])],
    estimatedCost: order.estimatedCost !== undefined ? String(order.estimatedCost) : '',
    currency: order.currency?.trim() || 'USD',
    executionEstimate: order.executionEstimate?.trim() || '',
    files: [],
    templateFiles: [],
    templatePromptTemplate: '',
    templateVariables: [],
    templateVariableValues: {}
  };
}
