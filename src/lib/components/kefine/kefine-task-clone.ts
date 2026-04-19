import type {
  DraftOrder,
  OrderNotebookBlock,
  OrderRepository,
  OrderResultSection,
  OrderView,
  TaskAccessMode
} from '$lib/components/kefine/kefine-workflow';

export type TaskCloneFormat = 'txt' | 'md' | 'org';

export type TaskRepositoryCloneTarget = {
  label: string;
  url: string;
  command: string;
};

export type TaskRepositoryArchiveTargets = {
  zip: string;
  tarGz: string;
  tarZst: string;
};

export function getTaskRepositoryArchiveTargets(order: OrderView): TaskRepositoryArchiveTargets | null {
  const repository = getTaskRepository(order);
  const archiveUrl = repository?.projectArchiveUrl?.trim() || null;
  if (!archiveUrl) {
    return null;
  }

  return {
    zip: replaceArchiveExtension(archiveUrl, 'zip'),
    tarGz: replaceArchiveExtension(archiveUrl, 'tar.gz'),
    tarZst: replaceArchiveExtension(archiveUrl, 'tar.zst')
  };
}

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

function replaceArchiveExtension(url: string, nextExtension: 'zip' | 'tar.gz' | 'tar.zst'): string {
  const normalized = url.trim().toLowerCase();
  if (normalized.endsWith('.tar.zst')) {
    return `${url.trim().slice(0, -'.tar.zst'.length)}.${nextExtension}`;
  }

  if (normalized.endsWith('.tar.gz')) {
    return `${url.trim().slice(0, -'.tar.gz'.length)}.${nextExtension}`;
  }

  if (normalized.endsWith('.zip')) {
    return `${url.trim().slice(0, -'.zip'.length)}.${nextExtension}`;
  }

  return `${url.trim()}.${nextExtension}`;
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

  if (order.repository) {
    metadata.push(['Repository', normalizeLine(order.repository.slug)]);
    metadata.push(['Repository visibility', normalizeLine(order.repository.visibility)]);
    metadata.push(['Repository branch', normalizeLine(order.repository.defaultBranch)]);
  }

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

export function getTaskRepository(order: OrderView): OrderRepository | null {
  return order.repository ?? null;
}

function preferredProjectPathId(order: OrderView, repository: OrderRepository | null): string | null {
  const routeScopedId = order.shareId?.trim() || order.id?.trim();
  if (routeScopedId) {
    return routeScopedId;
  }

  const projectId = order.projectId?.trim() || repository?.projectId?.trim();
  return projectId || null;
}

function preferredActorHandle(order: OrderView, repository: OrderRepository | null): string | null {
  const handle = order.actorHandle?.trim() || order.ownerUsername?.trim() || repository?.ownerHandle?.trim();
  return handle ? handle.replace(/^@+/, '') : null;
}

function currentSshOriginHost(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.location.host?.trim() || null;
}

function hostFromCloneUrl(url: string | undefined): string | null {
  const raw = url?.trim();
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    return parsed.host || null;
  } catch {
    const normalized = raw.replace(/^ssh:\/\/(?:git@)?/, '');
    const host = normalized.split('/')[0]?.trim();
    return host || null;
  }
}

export function getTaskRepositoryCanonicalName(order: OrderView): string | null {
  const repository = getTaskRepository(order);
  const actorHandle = preferredActorHandle(order, repository);
  const projectPathId = preferredProjectPathId(order, repository);
  if (!actorHandle || !projectPathId) {
    return null;
  }

  return `@${actorHandle}/${projectPathId}.git`;
}

function ensureGitSuffix(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed.endsWith('.git') ? trimmed : `${trimmed}.git`;
}

export function getTaskRepositoryCloneTarget(order: OrderView): TaskRepositoryCloneTarget | null {
  const repository = getTaskRepository(order);
  if (!repository) {
    return null;
  }

  const preferredSshUrl =
    repository.projectSshCloneUrl?.trim() ||
    repository.sshCloneUrl?.trim() ||
    '';
  let url = ensureGitSuffix(preferredSshUrl);

  if (!url) {
    const canonicalName = getTaskRepositoryCanonicalName(order);
    if (!canonicalName) {
      return null;
    }

    const preferredHost =
      currentSshOriginHost() ||
      hostFromCloneUrl(repository.projectCloneUrl) ||
      hostFromCloneUrl(repository.projectSshCloneUrl) ||
      hostFromCloneUrl(repository.sshCloneUrl) ||
      hostFromCloneUrl(repository.projectPublicCloneUrl) ||
      hostFromCloneUrl(repository.publicCloneUrl);
    url = ensureGitSuffix(preferredHost ? `ssh://git@${preferredHost}/${canonicalName}` : '');
  }

  if (!url) {
    return null;
  }

  return {
    label: 'SSH clone',
    url,
    command: `git clone ${url}`
  };
}
