<script lang="ts">
  import { goto } from '$app/navigation';
  import KefineSolversView from '$lib/components/kefine/KefineSolversView.svelte';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';

  let {
    data
  }: {
    data: {
      orderId: string;
      taskText: string;
    };
  } = $props();

  function filterSolutions(taskText: string): Solution[] {
    const normalized = taskText.trim().toLowerCase();
    if (normalized.includes('rust') || normalized.includes('hello world')) {
      return defaultSolutions.filter((s) => s.solver.toLowerCase().includes('rust'));
    }
    return defaultSolutions.filter((s) => s.solver.toLowerCase().includes('proxy'));
  }

  let appliedOverrides = $state<Record<string, boolean>>({});
  const baseSolutions = $derived(filterSolutions(data.taskText));
  const solutions = $derived(
    baseSolutions.map((s) => (s.id in appliedOverrides ? { ...s, rated: appliedOverrides[s.id] } : s))
  );

  const taskTitle = $derived(data.taskText || 'Solvers');
  const repoName = $derived(data.orderId ? `kefine/${data.orderId}` : 'kefine/solvers');

  function handleViewSolution(solutionId: string) {
    void goto(`/order/${encodeURIComponent(data.orderId)}/solver/${solutionId}`);
  }

  function handleApplySolution(solutionId: string) {
    appliedOverrides = { ...appliedOverrides, [solutionId]: true };
  }
</script>

<svelte:head>
  <title>Solvers · {repoName}</title>
</svelte:head>

<KefineSolversView
  {solutions}
  taskTitle={taskTitle}
  onViewSolution={handleViewSolution}
  onApplySolution={handleApplySolution}
/>
