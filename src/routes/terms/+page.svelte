<script lang="ts">
  import { page } from '$app/state';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import LegalPage from '$lib/components/legal/LegalPage.svelte';
  import { getLegalPageContent } from '$lib/constants/legal-content';
  import { getLocaleText, kefineLocale } from '$lib/constants/kefine-locale';

  const localeText = $derived(getLocaleText($kefineLocale));
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const content = $derived(
    getLegalPageContent(
      $kefineLocale,
      'terms',
      runtimeConfig.company,
      runtimeConfig.app.legalUpdatedAt[$kefineLocale]
    )
  );
  const relatedLinks = $derived([
    { id: 'privacy' as const, label: localeText.topbar.legalLinks.privacy, href: '/privacy' },
    { id: 'company' as const, label: localeText.topbar.legalLinks.company, href: '/legal-information' }
  ]);
</script>

<LegalPage
  {content}
  {relatedLinks}
  backLabel={localeText.topbar.legalLinks.backToApp}
  backHref="/"
  relatedLabel={localeText.topbar.legalLinks.related}
  updatedLabel={localeText.topbar.legalLinks.updated}
/>
