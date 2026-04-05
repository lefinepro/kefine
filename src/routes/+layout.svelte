<script lang="ts">
	import { page } from '$app/state';
	import type { Snippet } from 'svelte';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { getSeoMeta } from '$lib/seo';
  import type { LayoutData } from './$types';

	interface Props {
		children: Snippet;
    data: LayoutData;
	}

	const { children, data }: Props = $props();
  const runtimePublicConfig = $derived(resolvePublicRuntimeConfig(data.publicConfig));
  const publicConfigScript = $derived(JSON.stringify(runtimePublicConfig).replace(/</g, '\\u003c'));
  const seo = $derived(getSeoMeta(page.url, runtimePublicConfig));
  const canonicalUrl = $derived(`${page.url.origin}${seo.canonicalPath}`);
  const imageUrl = $derived(`${page.url.origin}${seo.imagePath}`);
</script>

<svelte:head>
  <meta name="description" content={seo.description} />
  <meta name="robots" content={seo.robots} />
  <meta name="theme-color" content="#d3a45c" />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:site_name" content="Lefine" />
  <meta property="og:title" content={seo.title} />
  <meta property="og:description" content={seo.description} />
  <meta property="og:type" content={seo.type} />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:alt" content="Lefine" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={seo.title} />
  <meta name="twitter:description" content={seo.description} />
  <meta name="twitter:image" content={imageUrl} />
  <script type="application/ld+json">{JSON.stringify(seo.jsonLd)}</script>
  <script>{`window.__KEFINE_PUBLIC_CONFIG__ = ${publicConfigScript};`}</script>
</svelte:head>

{@render children()}
