<script lang="ts">
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  import { scheduleAfter } from '$lib/utils/helpers';
  import type { KefineLocale } from '$lib/constants/kefine-locale';

  type SocialLink = {
    id: 'mastodon' | 'discord' | 'linkedin' | 'telegram';
    label: string;
    href: string;
    icon: string;
  };

  type LegalLink = {
    id: 'privacy' | 'terms' | 'company';
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
    signInLabel,
    signedInLabel,
    authenticatedLabel,
    authenticatedSecondaryLabel,
    authenticatedAvatarUrl,
    isAuthenticated,
    isDarkTheme,
    isExpanded,
    locale,
    languageEnglishLabel,
    languageRussianLabel,
    languageArmenianLabel,
    socialLinks,
    legalLinks,
    onToggleExpand,
    onBrandClick,
    onOpenEmailDraft,
    onOpenEmailDialog,
    onTheme,
    onAuth,
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
    signInLabel: string;
    signedInLabel: string;
    authenticatedLabel: string | null;
    authenticatedSecondaryLabel: string | null;
    authenticatedAvatarUrl: string | null;
    isAuthenticated: boolean;
    isDarkTheme: boolean;
    isExpanded: boolean;
    locale: KefineLocale;
    languageEnglishLabel: string;
    languageRussianLabel: string;
    languageArmenianLabel: string;
    socialLinks: SocialLink[];
    legalLinks: LegalLink[];
    onToggleExpand: () => void;
    onBrandClick: () => void;
    onOpenEmailDraft: () => void;
    onOpenEmailDialog: () => void;
    onTheme: () => void;
    onAuth: () => void;
    onLocale: (locale: KefineLocale) => void;
  } = $props();

  const themeIcon = $derived(isDarkTheme ? 'mdi:white-balance-sunny' : 'mdi:weather-night');
  const localeCycle: KefineLocale[] = ['en', 'ru', 'hy'];
  const localeLabels = $derived({
    en: languageEnglishLabel,
    ru: languageRussianLabel,
    hy: languageArmenianLabel
  });
  const nextLocale = $derived(localeCycle[(localeCycle.indexOf(locale) + 1) % localeCycle.length] ?? 'en');
  const localeLabel = $derived(localeLabels[nextLocale]);
  let hasScrolled = $state(false);
  let cancelBrandClick: (() => void) | null = null;
  let cancelEmailClick: (() => void) | null = null;

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
      onToggleExpand();
      cancelBrandClick = null;
    });
  }

  function handleBrandDoubleClick() {
    cancelBrandClick?.();
    cancelBrandClick = null;
    onBrandClick();
  }

  function handleEmailClick() {
    cancelEmailClick?.();
    cancelEmailClick = scheduleAfter(220, () => {
      onOpenEmailDraft();
      cancelEmailClick = null;
    });
  }

  function handleEmailDoubleClick() {
    cancelEmailClick?.();
    cancelEmailClick = null;

    onOpenEmailDialog();
  }
</script>

<kefine-topbar data-scrolled={hasScrolled} data-expanded={isExpanded}>
  <kefine-topbar-row>
    <kefine-sidebar-root data-expanded={isExpanded} data-scrolled={hasScrolled} aria-label={navigationLabel}>
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

      {#if isExpanded}
        <kefine-sidebar-float>
          <kefine-sidebar-stack aria-label={dockLabel}>
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
                <Icon icon={social.icon} width="20" height="20" aria-hidden="true" />
              </a>
            {/each}
          </kefine-sidebar-toolbar>

          <kefine-sidebar-nav aria-label={legalLabel}>
            {#each legalLinks as link (link.id)}
              <a data-part="link" href={link.href}>
                <lefine-text data-part="link-label">{link.label}</lefine-text>
              </a>
            {/each}
          </kefine-sidebar-nav>

          <kefine-sidebar-toolbar aria-label={dockLabel}>
          <button type="button" data-part="icon" aria-label={themeLabel} title={themeLabel} onclick={onTheme}>
            <Icon icon={themeIcon} width="20" height="20" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-part="icon"
            aria-label={localeLabel}
            title={localeLabel}
            onclick={() => onLocale(nextLocale)}
          >
            <Icon icon="mdi:translate" width="20" height="20" aria-hidden="true" />
          </button>
          <button
            type="button"
            data-part="icon"
            aria-label={mailLabel}
            title={mailLabel}
            onclick={handleEmailClick}
            ondblclick={handleEmailDoubleClick}
          >
            <Icon icon="mdi:email-outline" width="20" height="20" aria-hidden="true" />
          </button>
          <a
            data-part="icon"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={githubLabel}
            title={githubLabel}
          >
            <Icon icon="mdi:github" width="20" height="20" aria-hidden="true" />
          </a>
          </kefine-sidebar-toolbar>
          </kefine-sidebar-stack>
        </kefine-sidebar-float>
      {/if}
    </kefine-sidebar-root>

    <button
      type="button"
      data-part="auth"
      data-scrolled={hasScrolled}
      data-variant={isAuthenticated ? 'ghost' : 'primary'}
      onclick={onAuth}
    >
      {#if isAuthenticated}
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
  </kefine-topbar-row>
</kefine-topbar>

<style>
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

  kefine-sidebar-float {
    position: absolute;
    top: calc(100% + 0.9rem);
    left: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.7rem;
    width: fit-content;
    min-width: 0;
    min-height: 0;
    pointer-events: auto;
  }

  kefine-sidebar-stack {
    margin-bottom: auto;
    display: grid;
    gap: 0.45rem;
    padding: 0.4rem;
    width: fit-content;
    border-radius: var(--kef-radius-ui);
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, var(--kef-bg));
    box-shadow: 0 8px 18px color-mix(in oklab, #544536 6%, transparent);
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
    transform: translateY(-1px);
  }

  lefine-text[data-part='link-label'] {
    font-size: 0.96rem;
    font-weight: 620;
    line-height: 1;
    white-space: nowrap;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
  }

  kefine-sidebar-toolbar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
    padding: 0;
    overflow-x: auto;
    scrollbar-width: none;
    border-color: color-mix(in oklab, var(--kef-border) 62%, transparent);
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
  }

  kefine-sidebar-toolbar[data-kind='social'] {
    justify-content: flex-start;
  }

  kefine-sidebar-toolbar::-webkit-scrollbar {
    display: none;
  }

  kefine-sidebar-toolbar [data-part='icon'] {
    width: 2.55rem;
    min-width: 2.55rem;
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

  button[data-part='auth']:hover,
  button[data-part='auth'][data-scrolled='true']:hover,
  button[data-part='auth'][data-scrolled='true'][data-variant='primary']:hover,
  button[data-part='auth'][data-scrolled='true'][data-variant='ghost']:hover {
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    border-color: color-mix(in oklab, var(--kef-primary) 38%, var(--kef-border));
    background: color-mix(in oklab, var(--kef-primary) 10%, transparent);
  }

  lefine-text[data-part='auth-content'] {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
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

    button[data-part='auth'] {
      max-width: calc(100vw - 6rem);
      padding-inline: 0.75rem;
      white-space: normal;
      text-align: center;
    }
  }
</style>
