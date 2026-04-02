<script lang="ts">
  import Icon from '@iconify/svelte';
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
  let cancelBrandClick: (() => void) | null = null;
  let cancelEmailClick: (() => void) | null = null;

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

<kefine-sidebar-root data-expanded={isExpanded} aria-label={navigationLabel}>
  <button
    type="button"
    class="kefine-sidebar-brand"
    aria-label={isExpanded ? collapseSidebarLabel : openSidebarLabel}
    title={brandLabel}
    onclick={handleBrandClick}
    ondblclick={handleBrandDoubleClick}
  >
    <kefine-sidebar-brand-mark class="kefine-sidebar-brand-mark">{brandLabel}</kefine-sidebar-brand-mark>
  </button>

  {#if isExpanded}
    <kefine-sidebar-float>
      <kefine-sidebar-stack aria-label={dockLabel}>
      <kefine-sidebar-toolbar data-kind="social" aria-label={socialLabel}>
        {#each socialLinks as social (social.id)}
          <a
            class="kefine-sidebar-icon"
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
          <a class="kefine-sidebar-link" href={link.href}>
            <lefine-text class="kefine-sidebar-link-label">{link.label}</lefine-text>
          </a>
        {/each}
      </kefine-sidebar-nav>

      <kefine-sidebar-toolbar aria-label={dockLabel}>
      <button type="button" class="kefine-sidebar-icon" aria-label={themeLabel} title={themeLabel} onclick={onTheme}>
        <Icon icon={themeIcon} width="20" height="20" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="kefine-sidebar-icon"
        aria-label={localeLabel}
        title={localeLabel}
        onclick={() => onLocale(nextLocale)}
      >
        <Icon icon="mdi:translate" width="20" height="20" aria-hidden="true" />
      </button>
      <button
        type="button"
        class="kefine-sidebar-icon"
        aria-label={mailLabel}
        title={mailLabel}
        onclick={handleEmailClick}
        ondblclick={handleEmailDoubleClick}
      >
        <Icon icon="mdi:email-outline" width="20" height="20" aria-hidden="true" />
      </button>
      <a
        class="kefine-sidebar-icon"
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
  class="kefine-sidebar-auth"
  data-variant={isAuthenticated ? 'ghost' : 'primary'}
  onclick={onAuth}
>
  {#if isAuthenticated}
    <lefine-text class="kefine-sidebar-auth__content">
      {#if authenticatedAvatarUrl}
        <img class="kefine-sidebar-auth__avatar" src={authenticatedAvatarUrl} alt="" aria-hidden="true" />
      {/if}
      <lefine-text class="kefine-sidebar-auth__copy">
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

<style>
  kefine-sidebar-root {
    position: fixed;
    top: clamp(0.75rem, 2vw, 1.4rem);
    left: clamp(0.75rem, 2vw, 1.4rem);
    z-index: 3;
    display: grid;
    align-content: start;
    gap: 0.9rem;
    width: 4.5rem;
    min-width: 4.5rem;
    min-height: calc(100dvh - clamp(1.5rem, 4vw, 2.8rem));
  }

  kefine-sidebar-root[data-expanded='true'] {
    width: fit-content;
    min-width: 0;
    max-width: calc(100vw - 5rem);
  }

  .kefine-sidebar-brand,
  .kefine-sidebar-link,
  .kefine-sidebar-icon {
    border: var(--kef-border-width-soft) solid var(--kef-line);
    text-decoration: none;
    color: var(--lefine-text);
  }

  .kefine-sidebar-brand {
    width: 100%;
    min-height: 2.9rem;
    border: 0;
    border-radius: var(--kef-radius-ui);
    background: transparent;
    box-shadow: none;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0;
  }

  .kefine-sidebar-brand-mark {
    width: auto;
    min-height: 0;
    flex: 0 0 auto;
    border-radius: 0;
    display: inline-flex;
    align-items: center;
    justify-content: flex-start;
    background: transparent;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    font-family: Papyrus, "Copperplate", "Apple Chancery", fantasy;
    font-size: 1.72rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    padding: 0;
    transition:
      color var(--kef-motion-fast) var(--kef-ease-soft),
      transform var(--kef-motion-fast) var(--kef-ease-soft);
  }

  .kefine-sidebar-brand:hover .kefine-sidebar-brand-mark,
  kefine-sidebar-root[data-expanded='true'] .kefine-sidebar-brand-mark {
    color: color-mix(in oklab, var(--kef-primary) 88%, #5a4636);
  }

  kefine-sidebar-float {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    gap: 0.7rem;
    width: fit-content;
    min-width: 0;
    min-height: 100%;
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

  .kefine-sidebar-link {
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

  .kefine-sidebar-link:hover,
  .kefine-sidebar-icon:hover {
    background: color-mix(in oklab, var(--kef-primary) 6%, white);
    border-color: var(--kef-line-primary);
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    transform: translateY(-1px);
  }

  .kefine-sidebar-link-label {
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

  .kefine-sidebar-icon {
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

  .kefine-sidebar-icon:hover {
    box-shadow: 0 10px 20px color-mix(in oklab, var(--lefine-text) 6%, transparent);
  }

  .kefine-sidebar-auth {
    position: fixed;
    top: clamp(0.75rem, 2vw, 1.4rem);
    right: clamp(0.75rem, 2vw, 1.4rem);
    z-index: 3;
    width: auto;
    min-width: 0;
    padding-inline: 0.9rem;
  }

  .kefine-sidebar-auth__content {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
  }

  .kefine-sidebar-auth__avatar {
    width: 1.9rem;
    height: 1.9rem;
    border-radius: 999px;
    flex: 0 0 auto;
    box-shadow: 0 0 0 1px color-mix(in oklab, var(--kef-line-on-primary) 72%, transparent);
  }

  .kefine-sidebar-auth__copy {
    display: grid;
    gap: 0.04rem;
    text-align: left;
    min-width: 0;
  }

  .kefine-sidebar-auth__copy strong,
  .kefine-sidebar-auth__copy small {
    display: block;
    max-width: 16rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kefine-sidebar-auth__copy small {
    opacity: 0.78;
    font-size: 0.72rem;
    font-weight: 600;
  }

  @media (max-width: 760px) {
    kefine-sidebar-root,
    kefine-sidebar-root[data-expanded='true'] {
      position: fixed;
      left: 0.75rem;
      top: 0.75rem;
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

    .kefine-sidebar-auth {
      top: 0.75rem;
      right: 0.75rem;
      max-width: calc(100vw - 6rem);
      padding-inline: 0.75rem;
      white-space: normal;
      text-align: center;
    }
  }
</style>
