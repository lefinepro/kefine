<script lang="ts">
  import { page } from '$app/state';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import LegalPage from '$lib/components/legal/LegalPage.svelte';
  import { getLegalPageContent } from '$lib/constants/legal-content';
  import { kefineLocale, kefineLocaleText } from '$lib/constants/kefine-locale';

  const localeText = $derived($kefineLocaleText);
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const content = $derived(
    getLegalPageContent(
      $kefineLocale,
      'company',
      runtimeConfig.company,
      runtimeConfig.app.legalUpdatedAt[$kefineLocale]
    )
  );
</script>

<LegalPage
  {content}
  updatedLabel={localeText.topbar.legalLinks.updated}
/>
