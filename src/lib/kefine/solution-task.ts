export type SolutionTaskPreset = {
  kind: 'go-proxy' | 'hello-world-rust';
  repositoryLabel: string;
  solutionIds: string[];
};

const SOLUTION_TASK_PRESETS: SolutionTaskPreset[] = [
  {
    kind: 'go-proxy',
    repositoryLabel: 'go-proxy',
    solutionIds: ['5', '6', '7']
  },
  {
    kind: 'hello-world-rust',
    repositoryLabel: 'hello-world-rust',
    solutionIds: ['1', '2', '3', '4']
  }
];

export function normalizeSolutionTaskText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function resolveSolutionTask(text: string): SolutionTaskPreset | null {
  const normalized = normalizeSolutionTaskText(text);
  if (!normalized) {
    return null;
  }

  const isGoProxyTask =
    normalized.includes('go') &&
    ((normalized.includes('мини') && normalized.includes('прокси')) ||
      (normalized.includes('mini') && normalized.includes('proxy')));

  if (isGoProxyTask) {
    return SOLUTION_TASK_PRESETS[0] ?? null;
  }

  if (normalized.includes('hello world') && normalized.includes('rust')) {
    return SOLUTION_TASK_PRESETS[1] ?? null;
  }

  return null;
}

export function isSolutionTask(text: string): boolean {
  return resolveSolutionTask(text) !== null;
}

export function deriveSolutionTaskRepositoryLabel(text: string): string {
  const preset = resolveSolutionTask(text);
  if (preset) {
    return preset.repositoryLabel;
  }

  const cleaned = normalizeSolutionTaskText(text);
  if (!cleaned) {
    return 'task';
  }

  const slug = cleaned
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 3)
    .join('-');

  return slug || 'task';
}
