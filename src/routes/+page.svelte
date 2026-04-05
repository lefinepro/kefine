<script lang="ts">
  import './+page.css';
  import { page } from '$app/state';
  import KefineWorkspace from '$lib/components/kefine/KefineWorkspace.svelte';

  const initialTemplateHandle = $derived(page.url.searchParams.get('templateHandle') ?? undefined);
  const initialTemplateSlug = $derived(page.url.searchParams.get('templateSlug') ?? undefined);
</script>

<KefineWorkspace initialTemplateHandle={initialTemplateHandle} initialTemplateSlug={initialTemplateSlug} />
