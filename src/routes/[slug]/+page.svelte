<script lang="ts">
  import './+page.css';
  import { page } from '$app/state';
  import KefineWorkspace from '$lib/components/kefine/KefineWorkspace.svelte';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';

  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const initialTemplateHandle = $derived(runtimeConfig.defaultActor.handle);
  const initialTemplateSlug = $derived(page.params.slug ?? undefined);
</script>

<KefineWorkspace initialTemplateHandle={initialTemplateHandle} initialTemplateSlug={initialTemplateSlug} />
