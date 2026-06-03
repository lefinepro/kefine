<script lang="ts">
  import type { Component } from 'svelte';
  import KefineOrderSolversPage from '$lib/components/kefine/KefineOrderSolversPage.svelte';

  let Workspace: Component<{ initialActorHandle?: string; initialOrderId?: string }> | null = $state(null);
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialActorHandle?: string; initialOrderId: string; taskText?: string } } = $props();
  const showSolvers = $derived(Boolean(data.taskText?.trim()));
</script>

{#if showSolvers}
  <KefineOrderSolversPage orderId={data.initialOrderId} taskText={data.taskText ?? ''} />
{:else if Workspace}
  <Workspace initialActorHandle={data.initialActorHandle} initialOrderId={data.initialOrderId} />
{/if}
