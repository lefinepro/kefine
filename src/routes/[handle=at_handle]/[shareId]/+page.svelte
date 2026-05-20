<script lang="ts">
  import type { ComponentType } from 'svelte';
  let Workspace: ComponentType | null = null;
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialActorHandle?: string; initialOrderId: string } } = $props();
</script>

{#if Workspace}
  <svelte:component this={Workspace} initialActorHandle={data.initialActorHandle} initialOrderId={data.initialOrderId} />
{/if}
