<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { defaultSolutions, type Solution } from '$lib/kefine/solutions-data';
  import KefineSolversView from '$lib/components/kefine/KefineSolversView.svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';

  const id = $page.params.id;
  const taskQuery = $page.url.searchParams.get('task') || '';

  const solutions: Solution[] = defaultSolutions.filter(
    (s) => s.project?.includes('go-proxy') || s.solver.includes('Proxy')
  );

  const repoName = 'kefine/go-proxy';
</script>

<svelte:head>
  <title>Solvers · {repoName}</title>
</svelte:head>

<KefineSolversView
  {solutions}
  taskTitle={taskQuery}
  repoName={repoName}
  onViewSolution={(solutionId) => goto(`/order/${id}/solver/${solutionId}`)}
/>
