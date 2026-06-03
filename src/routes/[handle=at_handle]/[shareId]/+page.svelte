<script lang="ts">
  import type { Component } from 'svelte';
  let Workspace: Component<{ initialActorHandle?: string; initialOrderId?: string }> | null = $state(null);
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialActorHandle?: string; initialOrderId: string } } = $props();
</script>

{#if Workspace}
  <Workspace initialActorHandle={data.initialActorHandle} initialOrderId={data.initialOrderId} />
{/if}
