<script lang="ts">
  import Icon from '@iconify/svelte';

  type SocialLink = {
    id: 'mastodon' | 'discord' | 'linkedin' | 'telegram';
    label: string;
    href: string;
    icon: string;
  };

  let {
    brandLabel,
    navigationLabel,
    openSidebarLabel,
    collapseSidebarLabel,
    dockLabel,
    socialLabel,
    mailLabel,
    githubLabel,
    githubUrl,
    themeLabel,
    signInLabel,
    signedInLabel,
    isAuthenticated,
    isDarkTheme,
    isExpanded,
    locale,
    languageEnglishLabel,
    languageRussianLabel,
    socialLinks,
    onToggleExpand,
    onOpenCreate,
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
    mailLabel: string;
    githubLabel: string;
    githubUrl: string;
    themeLabel: string;
    signInLabel: string;
    signedInLabel: string;
    isAuthenticated: boolean;
    isDarkTheme: boolean;
    isExpanded: boolean;
    locale: 'en' | 'ru';
    languageEnglishLabel: string;
    languageRussianLabel: string;
    socialLinks: SocialLink[];
    onToggleExpand: () => void;
    onOpenCreate: () => void;
    onOpenEmailDraft: () => void;
    onOpenEmailDialog: () => void;
    onTheme: () => void;
    onAuth: () => void;
    onLocale: (locale: 'en' | 'ru') => void;
  } = $props();

  const themeIcon = $derived(isDarkTheme ? 'mdi:white-balance-sunny' : 'mdi:weather-night');
  const nextLocale = $derived(locale === 'en' ? 'ru' : 'en');
  const localeLabel = $derived(locale === 'en' ? languageRussianLabel : languageEnglishLabel);
  let emailClickTimer: ReturnType<typeof setTimeout> | null = null;

  function handleEmailClick() {
    if (emailClickTimer) {
      clearTimeout(emailClickTimer);
    }

    emailClickTimer = setTimeout(() => {
      onOpenEmailDraft();
      emailClickTimer = null;
    }, 220);
  }

  function handleEmailDoubleClick() {
    if (emailClickTimer) {
      clearTimeout(emailClickTimer);
      emailClickTimer = null;
    }

    onOpenEmailDialog();
  }
</script>

<aside class="kefine-sidebar" class:kefine-sidebar--expanded={isExpanded} aria-label={navigationLabel}>
  <button
    type="button"
    class="kefine-sidebar-brand"
    aria-label={isExpanded ? collapseSidebarLabel : openSidebarLabel}
    title={brandLabel}
    onclick={() => {
      onOpenCreate();
      onToggleExpand();
    }}
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
  disabled={isAuthenticated}
>
  {isAuthenticated ? signedInLabel : signInLabel}
</button>
