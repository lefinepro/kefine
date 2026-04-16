<script lang="ts">
  import KefineTopbarIcon from '$lib/components/kefine/KefineTopbarIcon.svelte';
  import { onMount } from 'svelte';
  import { scheduleAfter } from '$lib/utils/helpers';
  import type { KefineLocale } from '$lib/constants/kefine-locale';
  import type { KefineTopbarIconName } from '$lib/components/kefine/KefineTopbarIcon.svelte';

  type SocialLink = {
    id: 'mastodon' | 'discord' | 'linkedin' | 'telegram';
    label: string;
    href: string;
    icon: KefineTopbarIconName;
  };

  type LegalLink = {
    id: 'privacy' | 'terms' | 'company' | 'contact';
    label: string;
    href: string;
  };

  let {
    brandLabel,
    navigationLabel,
    openSidebarLabel,
    collapseSidebarLabel,
    dockLabel,
    socialLabel,
    legalLabel,
    mailLabel,
    githubLabel,
    githubUrl,
    themeLabel,
    themeMode,
    themeAutoLabel,
    themeLightLabel,
    themeDarkLabel,
    signInLabel,
    signedInLabel,
    authenticatedLabel,
    authenticatedSecondaryLabel,
    authenticatedAvatarUrl,
    authMenuLabel,
    openProfileLabel,
    signOutLabel,
    isAuthenticated,
    isAuthLoading = false,
    isDarkTheme,
    isExpanded,
    locale,
    languageEnglishLabel,
    languageRussianLabel,
    languageArmenianLabel,
    socialLinks,
    showSocialLinks = false,
    showEmailButton = true,
    showGithubButton = true,
    showAuthButton = true,
    legalLinks,
    onExpandedChange,
    onBrandClick,
    onOpenEmailDialog,
    onThemeChange,
    onAuth,
    onOpenProfile,
    onSignOut,
    onAuthDoubleClick,
    onLocale
  }: {
    brandLabel: string;
    navigationLabel: string;
    openSidebarLabel: string;
    collapseSidebarLabel: string;
    dockLabel: string;
    socialLabel: string;
    legalLabel: string;
    mailLabel: string;
    githubLabel: string;
    githubUrl: string;
    themeLabel: string;
    themeMode: 'light' | 'dark' | 'auto';
    themeAutoLabel: string;
    themeLightLabel: string;
    themeDarkLabel: string;
    signInLabel: string;
    signedInLabel: string;
    authenticatedLabel: string | null;
    authenticatedSecondaryLabel: string | null;
    authenticatedAvatarUrl: string | null;
    authMenuLabel: string;
    openProfileLabel: string;
    signOutLabel: string;
    isAuthenticated: boolean;
    isAuthLoading?: boolean;
    isDarkTheme: boolean;
    isExpanded: boolean;
    locale: KefineLocale;
    languageEnglishLabel: string;
    languageRussianLabel: string;
    languageArmenianLabel: string;
    socialLinks: SocialLink[];
    showSocialLinks?: boolean;
    showEmailButton?: boolean;
    showGithubButton?: boolean;
    showAuthButton?: boolean;
    legalLinks: LegalLink[];
    onExpandedChange: (expanded: boolean) => void;
    onBrandClick: () => void;
    onOpenEmailDialog: () => void;
    onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
    onAuth: () => void;
    onOpenProfile: () => void;
    onSignOut: () => void;
    onAuthDoubleClick: () => void;
    onLocale: (locale: KefineLocale) => void;
  } = $props();

  const localeCycle: KefineLocale[] = ['en', 'ru', 'hy'];
  const localeLabels = $derived({
    en: languageEnglishLabel,
    ru: languageRussianLabel,
    hy: languageArmenianLabel
  });
  const localeFlagIcons = {
    en: 'flag-en',
    ru: 'flag-ru',
    hy: 'flag-hy'
  } as const;
  const nextLocale = $derived(localeCycle[(localeCycle.indexOf(locale) + 1) % localeCycle.length] ?? 'en');
  const localeLabel = $derived(localeLabels[nextLocale]);
  const currentLocaleFlagIcon = $derived(localeFlagIcons[locale] ?? 'flag-en');
  let hasScrolled = $state(false);
  let menuPopover: HTMLElement | null = $state(null);
  let themePopover: HTMLElement | null = $state(null);
  let localePopover: HTMLElement | null = $state(null);
  let cancelBrandClick: (() => void) | null = null;
  let cancelLocaleClick: (() => void) | null = null;
  let themePickerOpen = $state(false);
  let localePickerOpen = $state(false);
  let authMenuPopover: HTMLElement | null = $state(null);
  let authMenuOpen = $state(false);
  let cancelAuthClick: (() => void) | null = null;

  function updateScrollState() {
    hasScrolled = window.scrollY > 8;
  }

  onMount(() => {
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateScrollState);
    };
  });

  function handleBrandClick() {
    cancelBrandClick?.();
    cancelBrandClick = scheduleAfter(220, () => {
      onExpandedChange(!isExpanded);
      cancelBrandClick = null;
    });
  }

  function handleBrandDoubleClick() {
    cancelBrandClick?.();
    cancelBrandClick = null;
    onAuthDoubleClick();
  }

  function handleEmailClick() {
    onOpenEmailDialog();
  }

  function handleAuthClick() {
    cancelAuthClick?.();
    cancelAuthClick = scheduleAfter(220, () => {
      if (!isAuthenticated) {
        onAuth();
        cancelAuthClick = null;
        return;
      }

      authMenuOpen = !authMenuOpen;
      cancelAuthClick = null;
    });
  }

  function handleAuthDoubleClick() {
    cancelAuthClick?.();
    cancelAuthClick = null;

    if (!isAuthenticated) {
      onAuth();
      return;
    }

    authMenuOpen = false;
    onAuthDoubleClick();
  }

  function handleThemeButtonClick() {
    themePickerOpen = !themePickerOpen;
    localePickerOpen = false;
  }

  function handleThemeButtonDoubleClick() {
    themePickerOpen = false;
    localePickerOpen = false;
    onThemeChange(isDarkTheme ? 'light' : 'dark');
  }

  function handleLocaleButtonClick() {
    cancelLocaleClick?.();
    cancelLocaleClick = scheduleAfter(220, () => {
      localePickerOpen = !localePickerOpen;
      themePickerOpen = false;
      cancelLocaleClick = null;
    });
  }

  function handleLocaleButtonDoubleClick() {
    cancelLocaleClick?.();
    cancelLocaleClick = null;
    localePickerOpen = false;
    themePickerOpen = false;
    onLocale(nextLocale);
  }

  function selectTheme(theme: 'light' | 'dark' | 'auto') {
    themePickerOpen = false;
    onThemeChange(theme);
  }

  function selectLocale(next: KefineLocale) {
    localePickerOpen = false;
    onLocale(next);
  }

  function handlePopoverToggle(event: Event) {
    const nextState = (event.currentTarget as HTMLElement | null)?.matches(':popover-open') ?? false;
    if (nextState !== isExpanded) {
      onExpandedChange(nextState);
    }
  }

  function handleThemePopoverToggle() {
    themePickerOpen = themePopover?.matches(':popover-open') ?? false;
  }

  function handleLocalePopoverToggle() {
    localePickerOpen = localePopover?.matches(':popover-open') ?? false;
  }

  function handleAuthPopoverToggle() {
    authMenuOpen = authMenuPopover?.matches(':popover-open') ?? false;
  }

  function handleOpenProfileClick() {
    authMenuOpen = false;
    onOpenProfile();
  }

  function handleSignOutClick() {
    authMenuOpen = false;
    onSignOut();
  }

  $effect(() => {
    if (!menuPopover) {
      return;
    }

    if (isExpanded) {
      if (!menuPopover.matches(':popover-open')) {
        menuPopover.showPopover();
      }
      return;
    }

    if (menuPopover.matches(':popover-open')) {
      menuPopover.hidePopover();
    }
  });

  $effect(() => {
    if (!themePopover) {
      return;
    }

    if (themePickerOpen && isExpanded) {
      if (!themePopover.matches(':popover-open')) {
        themePopover.showPopover();
      }
      return;
    }

    if (themePopover.matches(':popover-open')) {
      themePopover.hidePopover();
    }
  });

  $effect(() => {
    if (!localePopover) {
      return;
    }

    if (localePickerOpen && isExpanded) {
      if (!localePopover.matches(':popover-open')) {
        localePopover.showPopover();
      }
      return;
    }

    if (localePopover.matches(':popover-open')) {
      localePopover.hidePopover();
    }
  });

  $effect(() => {
    if (!authMenuPopover) {
      return;
    }

    if (authMenuOpen && isAuthenticated && !isAuthLoading) {
      if (!authMenuPopover.matches(':popover-open')) {
        authMenuPopover.showPopover();
      }
      return;
    }

    if (authMenuPopover.matches(':popover-open')) {
      authMenuPopover.hidePopover();
    }
  });

  $effect(() => {
    if (isExpanded) {
      return;
    }

    themePickerOpen = false;
    localePickerOpen = false;
  });

  $effect(() => {
    if (isAuthLoading || !isAuthenticated) {
      authMenuOpen = false;
    }
  });
</script>

<header>
<kefine-topbar data-scrolled={hasScrolled} data-expanded={isExpanded}>
  <kefine-topbar-row>
    <nav aria-label={navigationLabel}>
    <kefine-sidebar-root data-expanded={isExpanded} data-scrolled={hasScrolled}>
      <button
        type="button"
        data-part="brand"
        aria-label={isExpanded ? collapseSidebarLabel : openSidebarLabel}
        title={brandLabel}
        onclick={handleBrandClick}
        ondblclick={handleBrandDoubleClick}
      >
        <kefine-sidebar-brand-mark data-part="brand-mark" data-testid="kefine-brand-mark">{brandLabel}</kefine-sidebar-brand-mark>
      </button>
      <kefine-sidebar-popover
        bind:this={menuPopover}
        popover="manual"
        aria-label={dockLabel}
        ontoggle={handlePopoverToggle}
      >
        <kefine-sidebar-stack>
          {#if showSocialLinks && socialLinks.length > 0}
            <kefine-sidebar-toolbar data-kind="social" aria-label={socialLabel}>
              {#each socialLinks as social (social.id)}
                <a
                  data-part="icon"
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  title={social.label}
                >
                  <KefineTopbarIcon name={social.icon} size={20} />
                </a>
              {/each}
            </kefine-sidebar-toolbar>
          {/if}

          <kefine-sidebar-nav aria-label={legalLabel}>
            {#each legalLinks as link (link.id)}
              <a data-part="link" href={link.href}>
                <lefine-text data-part="link-label">{link.label}</lefine-text>
              </a>
            {/each}
          </kefine-sidebar-nav>

          <kefine-sidebar-toolbar aria-label={dockLabel}>
            <button
              type="button"
              data-part="icon"
              data-role="theme"
              aria-label={themeLabel}
              title={themeLabel}
              onclick={handleThemeButtonClick}
              ondblclick={handleThemeButtonDoubleClick}
            >
              <KefineTopbarIcon name={isDarkTheme ? 'theme-light' : 'theme-dark'} size={20} />
            </button>
            <button
              type="button"
              data-part="icon"
              data-role="locale"
              aria-label={localeLabel}
              title={localeLabel}
              onclick={handleLocaleButtonClick}
              ondblclick={handleLocaleButtonDoubleClick}
            >
              <KefineTopbarIcon name={currentLocaleFlagIcon} size={20} />
            </button>
            {#if showEmailButton}
              <button
                type="button"
                data-part="icon"
                aria-label={mailLabel}
                title={mailLabel}
                onclick={handleEmailClick}
              >
                <KefineTopbarIcon name="email" size={20} />
              </button>
            {/if}
            {#if showGithubButton}
              <a
                data-part="icon"
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={githubLabel}
                title={githubLabel}
              >
                <KefineTopbarIcon name="github" size={20} />
              </a>
            {/if}
          </kefine-sidebar-toolbar>
        </kefine-sidebar-stack>
      </kefine-sidebar-popover>
      <kefine-picker-popover
        bind:this={themePopover}
        popover="manual"
        data-kind="theme"
        ontoggle={handleThemePopoverToggle}
      >
        <kefine-picker-list>
          <button type="button" data-part="picker-option" data-active={themeMode === 'auto'} onclick={() => selectTheme('auto')}>
            <KefineTopbarIcon name="theme-auto" size={18} />
            <lefine-text>{themeAutoLabel}</lefine-text>
          </button>
          <button type="button" data-part="picker-option" data-active={themeMode === 'light'} onclick={() => selectTheme('light')}>
            <KefineTopbarIcon name="theme-light" size={18} />
            <lefine-text>{themeLightLabel}</lefine-text>
          </button>
          <button type="button" data-part="picker-option" data-active={themeMode === 'dark'} onclick={() => selectTheme('dark')}>
            <KefineTopbarIcon name="theme-dark" size={18} />
            <lefine-text>{themeDarkLabel}</lefine-text>
          </button>
        </kefine-picker-list>
      </kefine-picker-popover>
      <kefine-picker-popover
        bind:this={localePopover}
        popover="manual"
        data-kind="locale"
        ontoggle={handleLocalePopoverToggle}
      >
        <kefine-picker-list>
          <button type="button" data-part="picker-option" data-active={locale === 'en'} onclick={() => selectLocale('en')}>
            <KefineTopbarIcon name={localeFlagIcons.en} size={18} />
            <lefine-text>{languageEnglishLabel}</lefine-text>
          </button>
          <button type="button" data-part="picker-option" data-active={locale === 'ru'} onclick={() => selectLocale('ru')}>
            <KefineTopbarIcon name={localeFlagIcons.ru} size={18} />
            <lefine-text>{languageRussianLabel}</lefine-text>
          </button>
          <button type="button" data-part="picker-option" data-active={locale === 'hy'} onclick={() => selectLocale('hy')}>
            <KefineTopbarIcon name={localeFlagIcons.hy} size={18} />
            <lefine-text>{languageArmenianLabel}</lefine-text>
          </button>
        </kefine-picker-list>
      </kefine-picker-popover>
    </kefine-sidebar-root>
    </nav>

    {#if showAuthButton}
      <button
        type="button"
        data-part="auth"
        data-scrolled={hasScrolled}
        data-variant={isAuthenticated ? 'ghost' : 'primary'}
        data-loading={isAuthLoading}
        disabled={isAuthLoading}
        onclick={handleAuthClick}
        ondblclick={handleAuthDoubleClick}
      >
        {#if isAuthLoading}
          <lef-auth-loading aria-hidden="true"></lef-auth-loading>
          <span>{signInLabel}</span>
        {:else if isAuthenticated}
          <lefine-text data-part="auth-content">
            {#if authenticatedAvatarUrl}
              <img data-part="auth-avatar" src={authenticatedAvatarUrl} alt="" aria-hidden="true" />
            {/if}
            <lefine-text data-part="auth-copy">
              <strong>{authenticatedLabel ?? signedInLabel}</strong>
              {#if authenticatedSecondaryLabel}
                <small>{authenticatedSecondaryLabel}</small>
              {/if}
            </lefine-text>
          </lefine-text>
        {:else}
          {signInLabel}
        {/if}
      </button>

      <kefine-auth-popover
        bind:this={authMenuPopover}
        popover="manual"
        aria-label={authMenuLabel}
        ontoggle={handleAuthPopoverToggle}
      >
        <kefine-auth-menu>
          <button type="button" data-part="auth-menu-option" onclick={handleOpenProfileClick}>
            <KefineTopbarIcon name="profile" size={18} />
            <lefine-text>{openProfileLabel}</lefine-text>
          </button>
          <button type="button" data-part="auth-menu-option" onclick={handleSignOutClick}>
            <KefineTopbarIcon name="sign-out" size={18} />
            <lefine-text>{signOutLabel}</lefine-text>
          </button>
        </kefine-auth-menu>
      </kefine-auth-popover>
    {/if}
  </kefine-topbar-row>
</kefine-topbar>
</header>

<style>
  header {
    display: contents;
  }

  kefine-topbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 3;
    display: grid;
    justify-items: stretch;
    align-content: start;
    gap: 0.55rem;
    pointer-events: none;
  }

  kefine-topbar-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    min-height: 0;
    padding: 0.75rem;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    backdrop-filter: blur(0);
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      backdrop-filter var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-topbar[data-scrolled='true'] > kefine-topbar-row {
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg));
    box-shadow: 0 10px 24px color-mix(in oklab, #544536 8%, transparent);
    backdrop-filter: blur(14px);
  }

  kefine-sidebar-root {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: start;
    gap: 0.9rem;
    width: 4.5rem;
    min-width: 4.5rem;
    min-height: 0;
    pointer-events: auto;
  }

  kefine-sidebar-root[data-expanded='true'] {
    width: fit-content;
    min-width: 0;
    max-width: calc(100vw - 5rem);
  }

  kefine-sidebar-root [data-part='brand'],
  kefine-sidebar-root [data-part='link'],
  kefine-sidebar-root [data-part='icon'] {
    border: var(--kef-border-width-soft) solid var(--kef-line);
    text-decoration: none;
    color: var(--lefine-text);
  }

  kefine-sidebar-root > button[data-part='brand'] {
    width: 100%;
    min-height: 2.9rem;
    border: 0;
    border-radius: var(--kef-radius-ui);
    background: transparent;
    box-shadow: none;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0.14rem 0.48rem;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      backdrop-filter var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-sidebar-root[data-scrolled='true'] > button[data-part='brand'] {
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  kefine-sidebar-brand-mark[data-part='brand-mark'] {
    width: auto;
    min-height: 0;
    flex: 0 0 auto;
    border-radius: 0;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    background: transparent;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    font-family: var(--kef-font-family-brand);
    font-size: 1.72rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0;
    transition:
      color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-sidebar-root > button[data-part='brand']:hover kefine-sidebar-brand-mark[data-part='brand-mark'],
  kefine-sidebar-root[data-expanded='true'] kefine-sidebar-brand-mark[data-part='brand-mark'] {
    color: color-mix(in oklab, var(--kef-primary) 88%, #5a4636);
  }

  kefine-sidebar-root > button[data-part='brand'] {
    anchor-name: --kefine-topbar-anchor;
  }

  kefine-sidebar-toolbar [data-role='theme'] {
    anchor-name: --kefine-theme-anchor;
  }

  kefine-sidebar-toolbar [data-role='locale'] {
    anchor-name: --kefine-locale-anchor;
  }

  kefine-sidebar-popover {
    position: fixed;
    position-anchor: --kefine-topbar-anchor;
    top: anchor(bottom);
    left: anchor(left);
    margin: 0;
    margin-top: 0.9rem;
    padding: 0.4rem;
    width: max-content;
    min-width: 12rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    color: inherit;
    overflow: visible;
    box-shadow: 0 8px 18px color-mix(in oklab, #544536 6%, transparent);
    box-sizing: border-box;
  }

  kefine-sidebar-popover::backdrop {
    background: transparent;
  }

  kefine-picker-popover {
    position: fixed;
    margin: 0;
    padding: 0.28rem;
    width: max-content;
    min-width: 11rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 98%, var(--kef-bg));
    box-shadow: 0 10px 24px color-mix(in oklab, #544536 8%, transparent);
    color: inherit;
  }

  kefine-picker-popover[data-kind='theme'] {
    position-anchor: --kefine-theme-anchor;
    top: anchor(bottom);
    left: anchor(left);
    margin-top: 0.45rem;
  }

  kefine-picker-popover[data-kind='locale'] {
    position-anchor: --kefine-locale-anchor;
    top: anchor(bottom);
    left: anchor(left);
    margin-top: 0.45rem;
  }

  kefine-picker-popover::backdrop {
    background: transparent;
  }

  kefine-picker-list {
    display: grid;
    gap: 0.2rem;
  }

  kefine-picker-list [data-part='picker-option'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    min-height: 2.45rem;
    padding: 0.55rem 0.7rem;
    border: var(--kef-border-width-soft) solid transparent;
    border-radius: calc(var(--kef-radius-ui) - 0.08rem);
    background: transparent;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    text-align: left;
    font: inherit;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-picker-list [data-part='picker-option'][data-active='true'] {
    border-color: color-mix(in oklab, var(--kef-primary) 28%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 8%, white);
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
  }

  kefine-picker-list [data-part='picker-option']:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 22%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 6%, white);
  }

  kefine-sidebar-stack {
    display: grid;
    gap: 0.45rem;
    width: 100%;
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: transparent;
  }

  kefine-sidebar-nav {
    display: grid;
    gap: 0.42rem;
  }

  kefine-sidebar-nav a[data-part='link'] {
    min-height: 2.85rem;
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.82rem;
    padding: 0.72rem 0.88rem;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-sidebar-nav a[data-part='link']:hover,
  kefine-sidebar-toolbar [data-part='icon']:hover {
    background: color-mix(in oklab, var(--kef-primary) 6%, white);
    border-color: var(--kef-line-primary);
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
  }

  lefine-text[data-part='link-label'] {
    font-size: 0.96rem;
    font-weight: 620;
    line-height: 1;
    white-space: nowrap;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
  }

  kefine-sidebar-toolbar {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.4rem;
    width: 100%;
    padding: 0;
    overflow: visible;
    border-color: color-mix(in oklab, var(--kef-border) 62%, transparent);
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
  }

  kefine-sidebar-toolbar[data-kind='social'] {
    justify-items: stretch;
  }

  kefine-sidebar-toolbar [data-part='icon'] {
    width: 100%;
    min-width: 0;
    height: 2.55rem;
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-sidebar-toolbar [data-part='icon']:hover {
    box-shadow: 0 10px 20px color-mix(in oklab, var(--lefine-text) 6%, transparent);
  }

  button[data-part='auth'] {
    position: relative;
    z-index: 1;
    anchor-name: --kefine-auth-anchor;
    width: auto;
    min-width: 0;
    padding-inline: 0.9rem;
    pointer-events: auto;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      backdrop-filter var(--kef-motion-fast) var(--kef-ease-soft);
  }

  button[data-part='auth'][data-scrolled='true'] {
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  button[data-part='auth'][data-scrolled='true'][data-variant='primary'] {
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
  }

  button[data-part='auth'][data-scrolled='true'][data-variant='ghost'] {
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    border-color: transparent;
  }

  button[data-part='auth'][data-loading='true'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.55rem;
    cursor: progress;
  }

  button[data-part='auth']:hover,
  button[data-part='auth'][data-scrolled='true']:hover,
  button[data-part='auth'][data-scrolled='true'][data-variant='primary']:hover,
  button[data-part='auth'][data-scrolled='true'][data-variant='ghost']:hover {
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    border-color: color-mix(in oklab, var(--kef-primary) 38%, var(--kef-border));
    background: color-mix(in oklab, var(--kef-primary) 10%, transparent);
  }

  kefine-auth-popover {
    position: fixed;
    position-anchor: --kefine-auth-anchor;
    top: anchor(bottom);
    right: anchor(right);
    left: auto;
    margin: 0;
    margin-top: 0.45rem;
    padding: 0.28rem;
    min-width: 12rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 98%, var(--kef-bg));
    box-shadow: 0 10px 24px color-mix(in oklab, #544536 8%, transparent);
    color: inherit;
  }

  kefine-auth-popover::backdrop {
    background: transparent;
  }

  kefine-auth-menu {
    display: grid;
    gap: 0.2rem;
  }

  kefine-auth-menu [data-part='auth-menu-option'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: 0.55rem;
    min-height: 2.45rem;
    padding: 0.55rem 0.7rem;
    border: var(--kef-border-width-soft) solid transparent;
    border-radius: calc(var(--kef-radius-ui) - 0.08rem);
    background: transparent;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    text-align: left;
    font: inherit;
    transition:
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-auth-menu [data-part='auth-menu-option']:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 22%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 6%, white);
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
  }

  lefine-text[data-part='auth-content'] {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
  }

  lef-auth-loading {
    width: 0.92rem;
    height: 0.92rem;
    border-radius: 999px;
    border: 1.8px solid color-mix(in oklab, currentColor 22%, transparent);
    border-top-color: currentColor;
    animation: kefine-auth-spin 0.78s linear infinite;
  }

  img[data-part='auth-avatar'] {
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 999px;
    flex: 0 0 auto;
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--kef-line-on-primary) 72%, transparent);
  }

  lefine-text[data-part='auth-copy'] {
    display: grid;
    gap: 0.04rem;
    text-align: left;
    min-width: 0;
  }

  lefine-text[data-part='auth-copy'] strong,
  lefine-text[data-part='auth-copy'] small {
    display: block;
    max-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lefine-text[data-part='auth-copy'] small {
    opacity: 0.78;
    font-size: 0.72rem;
    font-weight: 600;
  }

  @keyframes kefine-auth-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    kefine-topbar {
      top: 0;
      left: 0;
      right: 0;
    }

    kefine-topbar-row {
      padding: 0.7rem 0.55rem;
    }

    kefine-sidebar-root,
    kefine-sidebar-root[data-expanded='true'] {
      position: relative;
      left: auto;
      top: auto;
      width: fit-content;
      min-width: 0;
      max-width: calc(100vw - 5.75rem);
    }

    kefine-sidebar-root:not([data-expanded='true']) {
      width: 4.5rem;
      min-width: 4.5rem;
    }

    kefine-sidebar-root:not([data-expanded='true']) kefine-sidebar-toolbar {
      display: grid;
      justify-items: center;
      overflow: visible;
    }

    kefine-sidebar-root:not([data-expanded='true']) kefine-sidebar-stack {
      justify-items: center;
    }

    kefine-sidebar-popover {
      top: anchor(bottom);
      left: anchor(left);
      margin-top: 0.55rem;
      width: min(12rem, calc(100vw - 1.1rem));
      min-width: min(12rem, calc(100vw - 1.1rem));
      max-width: min(12rem, calc(100vw - 1.1rem));
    }

    kefine-sidebar-popover:popover-open {
      inset: auto auto auto auto;
    }

    kefine-sidebar-stack {
      width: 100%;
      max-height: calc(100dvh - 5.25rem);
      overflow-y: auto;
      background: transparent;
    }

    kefine-sidebar-nav,
    kefine-sidebar-toolbar {
      width: 100%;
    }

    kefine-sidebar-toolbar {
      gap: 0.35rem;
    }

    button[data-part='auth'] {
      max-width: calc(100vw - 6rem);
      padding-inline: 0.75rem;
      white-space: normal;
      text-align: center;
    }
  }
</style>
