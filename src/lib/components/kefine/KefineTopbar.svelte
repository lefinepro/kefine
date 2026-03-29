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
    id: 'privacy' | 'terms' | 'refund';
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

<aside class="kefine-sidebar" class:kefine-sidebar--expanded={isExpanded} aria-label={navigationLabel}>
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
    <kefine-sidebar-float class="kefine-sidebar-float">
      <section class="kefine-sidebar-stack" aria-label={dockLabel}>
      <section class="kefine-sidebar-toolbar kefine-sidebar-toolbar--social" aria-label={socialLabel}>
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
      </section>

      <nav class="kefine-sidebar-nav" aria-label={legalLabel}>
        {#each legalLinks as link (link.id)}
          <a class="kefine-sidebar-link" href={link.href}>
            <span class="kefine-sidebar-link-label">{link.label}</span>
          </a>
        {/each}
      </nav>

      <section class="kefine-sidebar-toolbar" aria-label={dockLabel}>
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
      </section>
      </section>
    </kefine-sidebar-float>
  {/if}
</aside>

<button
  type="button"
  class="kefine-sidebar-auth"
  data-variant={isAuthenticated ? 'ghost' : 'primary'}
  onclick={onAuth}
>
  {#if isAuthenticated}
    <span class="kefine-sidebar-auth__content">
      {#if authenticatedAvatarUrl}
        <img class="kefine-sidebar-auth__avatar" src={authenticatedAvatarUrl} alt="" aria-hidden="true" />
      {/if}
      <span class="kefine-sidebar-auth__copy">
        <strong>{authenticatedLabel ?? signedInLabel}</strong>
        {#if authenticatedSecondaryLabel}
          <small>{authenticatedSecondaryLabel}</small>
        {/if}
      </span>
    </span>
  {:else}
    {signInLabel}
  {/if}
</button>
