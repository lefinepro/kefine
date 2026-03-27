<script lang="ts">
  import LegalPage from '$lib/components/legal/LegalPage.svelte';
  import { getLegalPageContent } from '$lib/constants/legal-content';
  import { getLocaleText, kefineLocale } from '$lib/constants/kefine-locale';

  const localeText = $derived(getLocaleText($kefineLocale));
  const content = $derived(getLegalPageContent($kefineLocale, 'terms'));
  const relatedLinks = $derived([
    { id: 'privacy' as const, label: localeText.topbar.legalLinks.privacy, href: '/privacy' },
    { id: 'refund' as const, label: localeText.topbar.legalLinks.refund, href: '/refund-policy' }
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
