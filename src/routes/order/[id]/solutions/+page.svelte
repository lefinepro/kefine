<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import KefineSolversView, {
    type SolversHistoryTask
  } from '$lib/components/kefine/KefineSolversView.svelte';
  import { topbarSearchPlaceholderOverride } from '$lib/kefine/topbar-search-context';

  const id = $page.params.id;
  const taskQuery = $page.url.searchParams.get('task') || '';

  const solutions: Solution[] = defaultSolutions.filter(
    (s) => s.project?.includes('go-proxy') || s.solver.includes('Proxy')
  );

  const repoName = 'kefine/go-proxy';
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
        description: taskQuery || repoName,
        isActive: true
      }
    ];
    const seen = new Set<string>([taskQuery.trim().toLowerCase()]);
    for (const entry of completed.slice(-9).reverse()) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const key = trimmed.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({
        id: `history-${list.length}`,
        title: trimmed.length > 60 ? `${trimmed.slice(0, 60)}…` : trimmed,
        description: trimmed
      });
      if (list.length >= 10) break;
    }
    return list;
  });

  function handleSelectHistoryTask(historyId: string) {
    const task = historyTasks.find((t) => t.id === historyId);
    if (!task || task.isActive) return;
    goto(`/?task=${encodeURIComponent(task.description ?? task.title)}`);
  }

  // Surface the active repository name in the shared header search bar while
  // this screen is mounted, then restore the default placeholder on leave.
  $effect(() => {
    topbarSearchPlaceholderOverride.set(repoName);
    return () => topbarSearchPlaceholderOverride.set(null);
  });
</script>

<svelte:head>
  <title>Solvers · {repoName}</title>
</svelte:head>

<KefineSolversView
  {solutions}
  taskTitle={taskQuery}
  repoName={repoName}
  historyTasks={historyTasks}
  onSelectHistoryTask={handleSelectHistoryTask}
  onViewSolution={(solutionId) => goto(`/order/${id}/solver/${solutionId}`)}
/>
