<script lang="ts">
  import { page } from '$app/state';
  import KefineWorkspace from '$lib/components/kefine/KefineWorkspace.svelte';

  const templateHandle = $derived(page.params.handle ?? '');
  const templateSlug = $derived(page.params.slug ?? '');
</script>

<KefineWorkspace initialTemplateHandle={templateHandle} initialTemplateSlug={templateSlug} />
