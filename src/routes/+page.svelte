<script lang="ts">
  import './+page.css';
  import type { ComponentType } from 'svelte';
  let Workspace: ComponentType | null = null;
  import('$lib/components/kefine/KefineWorkspace.svelte').then(m => Workspace = m.default);
</script>

{#if Workspace}
  <svelte:component this={Workspace} />
{/if}
