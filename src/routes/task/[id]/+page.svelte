<script lang="ts">
  import type { ComponentType } from 'svelte';
  let Workspace: ComponentType | null = $state(null);
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialOrderId: string } } = $props();
</script>

{#if Workspace}
  <svelte:component this={Workspace} initialOrderId={data.initialOrderId} />
{/if}
