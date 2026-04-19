<script lang="ts">
	import './+page.css';
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
  import { authState, clearAuthState, hydrateAuthStateFromSession } from '$lib/auth/auth-store.svelte.js';
  import { clearPasskeySession, loadPasskeySession, passkeySessionStore } from '$lib/auth/passkey-session';
  import { disconnectAppKit } from '$lib/auth/appkit';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import { shortenAuthLabel } from '$lib/components/kefine/kefine-workspace-helpers';
  import { resolvePublicRuntimeConfig, setBrowserPublicRuntimeConfig } from '$lib/config/public-config';
  import { kefineLocale, kefineLocaleText, setKefineLocale, type KefineLocale } from '$lib/constants/kefine-locale';
  import { buildLocaleHomePath, localizeAppPath, readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';
  import { getSeoMeta } from '$lib/seo';
  import type { LayoutData } from './$types';

  const THEME_STORAGE_KEY = 'kefine-theme';
  const ROUTES_WITH_OWN_TOPBAR = new Set([
    '/',
    '/task/[id]',
    '/order/[id]',
    '/[actor=actor_handle]/order/[id]',
    '/[actor=actor_handle]/orders/[id]',
    '/[handle=at_handle]',
    '/[handle=at_handle]/[shareId]'
  ]);

	interface Props {
		children: Snippet;
    data: LayoutData;
	}

	const { children, data }: Props = $props();
  const localeText = $derived($kefineLocaleText);
  const passkeySession = $derived($passkeySessionStore);
  const runtimePublicConfig = $derived(resolvePublicRuntimeConfig(data.publicConfig));
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? data.initialLocale ?? 'en');
  const requestOrigin = $derived(data.requestOrigin || page.url.origin);
  const seoUrl = $derived(new URL(`${page.url.pathname}${page.url.search}`, requestOrigin));
  const seo = $derived(getSeoMeta(seoUrl, runtimePublicConfig));
  const canonicalUrl = $derived(`${requestOrigin}${seo.canonicalPath}`);
  const imageUrl = $derived(`${requestOrigin}${seo.imagePath}`);
  const showSharedTopbar = $derived(!ROUTES_WITH_OWN_TOPBAR.has(page.route.id ?? ''));
  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: runtimePublicConfig.app.socialLinks.mastodon,
      icon: 'mastodon' as const
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: runtimePublicConfig.app.socialLinks.discord,
      icon: 'discord' as const
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: runtimePublicConfig.app.socialLinks.linkedin,
      icon: 'linkedin' as const
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: runtimePublicConfig.app.socialLinks.telegram,
      icon: 'telegram' as const
    },
    {
      id: 'github' as const,
      label: localeText.topbar.githubLabel,
      href: runtimePublicConfig.app.socialLinks.github,
      icon: 'github' as const
    }
  ]);
  const sidebarLegalLinks = $derived([
    {
      id: 'privacy' as const,
      label: localeText.topbar.legalLinks.privacy,
      href: localizeAppPath('/privacy', activeLocale)
    },
    {
      id: 'terms' as const,
      label: localeText.topbar.legalLinks.terms,
      href: localizeAppPath('/terms', activeLocale)
    }
  ]);
  const isAuthenticated = $derived(Boolean(passkeySession?.userId || authState.isConnected));
  const authenticatedLabel = $derived(shortenAuthLabel(authState.displayName || authState.email || authState.address || null));

  let topbarExpanded = $state(false);
  let themeMode = $state<'light' | 'dark' | 'auto'>('auto');
  let systemPrefersDark = $state(false);
  const resolvedTheme = $derived(themeMode === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : themeMode);
  const isDarkTheme = $derived(resolvedTheme === 'dark');
  const topbarThemeActionLabel = $derived(
    themeMode === 'auto' ? localeText.topbar.theme.auto : isDarkTheme ? localeText.topbar.theme.dark : localeText.topbar.theme.light
  );

  $effect(() => {
    setBrowserPublicRuntimeConfig(runtimePublicConfig);
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    setKefineLocale(activeLocale);
  });

  onMount(() => {
    if (!browser) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark = mediaQuery.matches;
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    themeMode = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'auto' ? storedTheme : 'auto';
    const handleThemePreferenceChange = (event: MediaQueryListEvent) => {
      systemPrefersDark = event.matches;
    };
    mediaQuery.addEventListener('change', handleThemePreferenceChange);
    hydrateAuthStateFromSession();
    loadPasskeySession();

    return () => {
      mediaQuery.removeEventListener('change', handleThemePreferenceChange);
    };
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    document.documentElement.setAttribute('data-kefine-theme', resolvedTheme);
    document.documentElement.setAttribute('lang', $kefineLocale);
    localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  });

  function handleSharedBrandClick() {
    void goto(buildLocaleHomePath(activeLocale));
  }

  async function handleSharedSignOut() {
    try {
      await disconnectAppKit();
    } catch {
      // ignore disconnect failures for non-wallet sessions
    }

    clearAuthState();
    clearPasskeySession();
    await goto(buildLocaleHomePath(activeLocale));
  }

  function handleSharedLocaleChange(locale: KefineLocale) {
    setKefineLocale(locale);
    void goto(buildLocaleHomePath(locale));
  }
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
</svelte:head>

{#if showSharedTopbar}
  <KefineTopbar
    brandLabel={localeText.brand.name}
    navigationLabel={localeText.topbar.quickActions}
    openSidebarLabel={localeText.topbar.openActionsMenu}
    collapseSidebarLabel={localeText.topbar.closeActionsMenu}
    dockLabel={localeText.topbar.dockLabel}
    socialLabel={localeText.topbar.socialLabel}
    legalLabel={localeText.topbar.legalLabel}
    mailLabel={localeText.topbar.mailLabel}
    themeLabel={topbarThemeActionLabel}
    themeMode={themeMode}
    themeAutoLabel={localeText.topbar.theme.auto}
    themeLightLabel={localeText.topbar.theme.light}
    themeDarkLabel={localeText.topbar.theme.dark}
    signInLabel={localeText.topbar.signIn}
    signedInLabel={localeText.topbar.signedIn}
    authenticatedLabel={authenticatedLabel}
    authenticatedSecondaryLabel={null}
    authenticatedAvatarUrl={null}
    authMenuLabel={localeText.profile.title}
    openProfileLabel={localeText.profile.title}
    signOutLabel={localeText.profile.signOut}
    isAuthenticated={isAuthenticated}
    isDarkTheme={isDarkTheme}
    isExpanded={topbarExpanded}
    locale={$kefineLocale}
    languageEnglishLabel={localeText.topbar.languageEnglish}
    languageRussianLabel={localeText.topbar.languageRussian}
    languageArmenianLabel={localeText.topbar.languageArmenian}
    socialLinks={sidebarSocialLinks}
    showSocialLinks={false}
    legalLinks={sidebarLegalLinks}
    onExpandedChange={(expanded) => {
      topbarExpanded = expanded;
    }}
    onBrandClick={handleSharedBrandClick}
    onOpenEmailDialog={() => {
      if (browser) {
        window.location.assign(localizeAppPath(`/@${runtimePublicConfig.defaultActor.handle}`, activeLocale));
      }
    }}
    onThemeChange={(theme) => {
      themeMode = theme;
    }}
    onAuth={handleSharedBrandClick}
    onOpenProfile={handleSharedBrandClick}
    onSignOut={() => {
      void handleSharedSignOut();
    }}
    onAuthDoubleClick={handleSharedBrandClick}
    onLocale={handleSharedLocaleChange}
  />

  <lef-layout-main>
    {@render children()}
  </lef-layout-main>
{:else}
  {@render children()}
{/if}

<style>
  lef-layout-main {
    display: block;
    padding-top: 4.5rem;
  }

  @media (max-width: 760px) {
    lef-layout-main {
      padding-top: 4.25rem;
    }
  }
</style>
