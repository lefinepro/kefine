<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import '$lib/kefine/jetbrains-hljs.css';
  import { solutionsStore } from '$lib/kefine/solutions-store';
  import { defaultSolutions } from '$lib/kefine/solutions-data';
  import SolutionFileTree from '$lib/components/kefine/SolutionFileTree.svelte';
  import SolutionCodeEditor from '$lib/components/kefine/SolutionCodeEditor.svelte';
  import SolutionTopbar from '$lib/components/kefine/SolutionTopbar.svelte';

  let {
    data
  }: {
    data: {
      orderId: string;
      solverId: string;
    };
  } = $props();

  let stored = $state(solutionsStore.getAll());

  onMount(() => {
    if (stored.length === 0) {
      solutionsStore.set([...defaultSolutions]);
    }
    return solutionsStore.subscribe(value => {
      stored = value;
    });
  });

  const solution = $derived(
    defaultSolutions.find(s => s.id === data.solverId)
      ?? stored.find(s => s.id === data.solverId)
      ?? null
  );

  const files = $derived(solution?.diffs ?? []);
  let activeFile = $state('');

  $effect(() => {
    if (files.length > 0 && !files.some(f => f.file === activeFile)) {
      activeFile = files[0].file;
    }
  });

  const activeLines = $derived.by(() => {
    if (!solution) return [];
    return solution.fileCodeLines?.[activeFile] ?? solution.codeLines ?? [];
  });

  function selectFile(file: string) {
    activeFile = file;
  }

  function goBack(event: MouseEvent) {
    event.preventDefault();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      goto(`/order/${data.orderId}`);
    }
  }
</script>

<svelte:head>
  <title>{solution ? `${solution.solver} | Lefine` : 'Solution | Lefine'}</title>
</svelte:head>

<lef-solver-page>
  {#if solution}
    <SolutionTopbar
      title={solution.title}
      author={solution.solver}
      backHref={`/order/${data.orderId}`}
      onBack={goBack}
    />

    <lef-solver-grid>
      <lef-solver-aside>
        <SolutionFileTree
          files={files}
          activeFile={activeFile}
          onSelect={selectFile}
        />
      </lef-solver-aside>

      <lef-solver-main>
        <SolutionCodeEditor
          activeFile={activeFile}
          files={files}
          lines={activeLines}
          onSelect={selectFile}
        />
      </lef-solver-main>
    </lef-solver-grid>
  {:else}
    <lef-empty-state>Solution not found</lef-empty-state>
  {/if}
</lef-solver-page>

<style>
  lef-solver-page {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--kef-bg);
    color: var(--lefine-text);
  }

  lef-solver-grid {
    display: grid;
    grid-template-columns: 280px minmax(0, 1fr);
    gap: 1.25rem;
    padding: 1.25rem 1.75rem 2rem;
    flex: 1;
    min-height: 0;
  }

  lef-solver-aside {
    background: var(--kef-bg-card);
    border: 1px solid var(--kef-line);
    border-radius: 0.75rem;
    padding: 1rem 0.85rem;
    align-self: start;
    position: sticky;
    top: 1.25rem;
    max-height: calc(100vh - 2.5rem);
    overflow: auto;
  }

  lef-solver-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  lef-empty-state {
    display: block;
    padding: 4rem 0;
    text-align: center;
    color: var(--lefine-text-soft);
  }

  @media (max-width: 900px) {
    lef-solver-grid {
      grid-template-columns: 1fr;
      padding: 1rem;
    }
    lef-solver-aside {
      position: static;
      max-height: none;
    }
  }
</style>
