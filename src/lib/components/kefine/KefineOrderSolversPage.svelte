<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import KefineSolversView, {
    type SolversHistoryTask
  } from '$lib/components/kefine/KefineSolversView.svelte';
  import { repoReadme, repoTodos } from '$lib/kefine/repo-docs';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import { topbarSearchPlaceholderOverride } from '$lib/kefine/topbar-search-context';

  let {
    orderId,
    taskText = ''
  }: {
    orderId: string;
    taskText?: string;
  } = $props();

  const solutions: Solution[] = defaultSolutions.filter(
    (s) => s.project?.includes('go-proxy') || s.solver.includes('Proxy')
  );

  const repoName = '@kefine/go-proxy';
  const COMPLETED_SEARCHES_KEY = 'kefine-completed-solver-searches';

  function readCompletedSearches(): string[] {
    if (!browser) return [];
    try {
      const raw = localStorage.getItem(COMPLETED_SEARCHES_KEY);
      const list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list.filter((entry) => typeof entry === 'string') : [];
    } catch {
      return [];
    }
  }

  const historyTasks = $derived.by<SolversHistoryTask[]>(() => {
    const completed = readCompletedSearches();
    const list: SolversHistoryTask[] = [
      {
        id: 'current',
        title: repoName,
        description: taskText || repoName,
        isActive: true
      }
    ];
    const seen = new Set<string>([taskText.trim().toLowerCase()]);
    for (const entry of completed.slice(-9).reverse()) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        id: `history-${list.length}`,
        title: trimmed.length > 60 ? `${trimmed.slice(0, 60)}...` : trimmed,
        description: trimmed
      });
      if (list.length >= 10) break;
    }
    return list;
  });

  function handleSelectHistoryTask(historyId: string) {
    const task = historyTasks.find((item) => item.id === historyId);
    if (!task || task.isActive) return;
    goto(`/?task=${encodeURIComponent(task.description ?? task.title)}`);
  }

  function handleViewSolution(solutionId: string) {
    goto(`/order/${encodeURIComponent(orderId)}/solver/${solutionId}`);
  }

  $effect(() => {
    topbarSearchPlaceholderOverride.set(repoName);
    return () => topbarSearchPlaceholderOverride.set(null);
  });
</script>

<svelte:head>
  <title>Solvers | {repoName}</title>
</svelte:head>

<KefineSolversView
  {solutions}
  taskTitle={taskText}
  repoName={repoName}
  readme={repoReadme}
  todos={repoTodos}
  historyTasks={historyTasks}
  onSelectHistoryTask={handleSelectHistoryTask}
  onViewSolution={handleViewSolution}
/>
