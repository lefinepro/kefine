<script lang="ts">
  import type { Component } from 'svelte';
  let Workspace: Component<{ initialOrderId?: string }> | null = $state(null);
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialOrderId: string } } = $props();
</script>

{#if Workspace}
  <Workspace initialOrderId={data.initialOrderId} />
{/if}
