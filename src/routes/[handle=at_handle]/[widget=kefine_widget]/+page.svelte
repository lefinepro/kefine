<script lang="ts">
  import type { Component } from 'svelte';
  import type { KefineSearchWidgetId } from '$lib/kefine/search-widgets';
  let Workspace: Component<{ initialActorHandle?: string; initialWidget?: KefineSearchWidgetId | null }> | null = $state(null);
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);

  let { data }: { data: { initialActorHandle?: string; initialWidget: KefineSearchWidgetId | null } } = $props();
</script>

{#if Workspace}
  <Workspace initialActorHandle={data.initialActorHandle} initialWidget={data.initialWidget} />
{/if}
