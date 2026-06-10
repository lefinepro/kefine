<script lang="ts">
  import KefineTopbarIcon from '$lib/components/kefine/KefineTopbarIcon.svelte';
  import KefineWeatherWidget from '$lib/components/kefine/KefineWeatherWidget.svelte';
  import KefineClockWidget from '$lib/components/kefine/KefineClockWidget.svelte';
  import KefineTranslatorWidget from '$lib/components/kefine/KefineTranslatorWidget.svelte';
  import KefineMusicWidget from '$lib/components/kefine/KefineMusicWidget.svelte';
  import KefineProxyConfigWidget from '$lib/components/kefine/KefineProxyConfigWidget.svelte';
  import KefineSearchInput from '$lib/components/kefine/KefineSearchInput.svelte';
  import { onMount, tick } from 'svelte';
  import { detectWeatherIntent } from '$lib/kefine/weather-intent';
  import { scheduleAfter } from '$lib/utils/helpers';
  import type { KefineLocale } from '$lib/constants/kefine-locale';
  import type { KefineTopbarIconName } from '$lib/components/kefine/KefineTopbarIcon.svelte';
  import { KEFINE_SEARCH_WIDGET_IDS, type KefineSearchWidgetId } from '$lib/kefine/search-widgets';
  import type {
    TopbarSearchAction,
    TopbarSearchItem,
    TopbarSearchRequest
  } from '$lib/kefine/topbar-search-context';

  /** Built-in widgets the command palette can surface inline on any page. */
  export type { KefineSearchWidgetId };

  type SocialLink = {
    id: 'mastodon' | 'discord' | 'linkedin' | 'telegram' | 'github';
    label: string;
    href: string;
    icon: KefineTopbarIconName;
  };

  type LegalLink = {
    id: 'privacy' | 'terms';
    label: string;
    href: string;
  };

  type SidebarProfile = {
    handle: string;
    bio?: string | null;
    href?: string | null;
  };

  export type KefineTopbarSearchItem = TopbarSearchItem;

  type SearchContextSegment = {
    id: string;
    label: string;
    kind: 'project' | 'task' | 'default';
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
    themeLabel,
    themeMode,
    themeAutoLabel,
    themeLightLabel,
    themeDarkLabel,
    signInLabel,
    signOutLabel,
    signedInLabel,
    authenticatedLabel,
    authenticatedSecondaryLabel,
    authenticatedAvatarUrl,
    openProfileLabel,
    isAuthenticated,
    isAuthLoading = false,
    isDarkTheme,
    isExpanded,
    locale,
    languageEnglishLabel,
    languageRussianLabel,
    languageArmenianLabel,
    showSearch = true,
    searchLabel = 'Search',
    searchPlaceholder = 'Search lepos, pages, actions...',
    searchResultsLabel = 'Results',
    searchEmptyLabel = 'No matching results',
    searchOpenLabel = 'Open',
    searchHomeLabel = 'Home',
    searchHomeHref = '/',
    searchItems = [],
    searchActions = [],
    searchRequest = null,
    initialSearchQuery = '',
    searchDefaultQuery = '',
    initialWidget = null,
    showSearchWidgets = true,
    searchWidgetIds = KEFINE_SEARCH_WIDGET_IDS,
    searchWidgetsLabel = 'Widgets',
    searchWeatherLabel = 'Weather',
    searchClockLabel = 'Clock',
    searchTranslatorLabel = 'Translator',
    searchMusicLabel = 'Music',
    searchProxyLabel = 'Proxy',
    searchWidgetBackLabel = 'Back to results',
    sidebarProfile = null,
    socialLinks,
    showSocialLinks = false,
    showEmailButton = true,
    showAuthButton = true,
    legalLinks,
    onExpandedChange,
    onBrandClick,
    onOpenEmailDialog,
    onThemeChange,
    onSearchQueryChange,
    onAuth,
    onOpenProfile,
    onSignOut,
    onAuthDoubleClick,
    onSearchTrigger,
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
    themeLabel: string;
    themeMode: 'light' | 'dark' | 'auto';
    signOutLabel: string;
    themeAutoLabel: string;
    themeLightLabel: string;
    themeDarkLabel: string;
    signInLabel: string;
    signedInLabel: string;
    authenticatedLabel: string | null;
    authenticatedSecondaryLabel: string | null;
    authenticatedAvatarUrl: string | null;
    openProfileLabel: string;
    isAuthenticated: boolean;
    isAuthLoading?: boolean;
    isDarkTheme: boolean;
    isExpanded: boolean;
    locale: KefineLocale;
    languageEnglishLabel: string;
    languageRussianLabel: string;
    languageArmenianLabel: string;
    showSearch?: boolean;
    searchLabel?: string;
    searchPlaceholder?: string;
    searchResultsLabel?: string;
    searchEmptyLabel?: string;
    searchOpenLabel?: string;
    searchHomeLabel?: string;
    searchHomeHref?: string;
    searchItems?: KefineTopbarSearchItem[];
    searchActions?: TopbarSearchAction[];
    searchRequest?: TopbarSearchRequest | null;
    /** Deep-link query that seeds the palette on non-search routes. */
    initialSearchQuery?: string;
    /** Query to prefill when opening the palette manually on saved-search routes. */
    searchDefaultQuery?: string;
    /** Widget short link (e.g. `/@profile/weather`) that auto-opens this widget inline. */
    initialWidget?: KefineSearchWidgetId | null;
    showSearchWidgets?: boolean;
    /**
     * Which widgets this surface offers in the command palette, in display
     * order. Profiles pass the widgets declared in their `social.org` so a
     * widget only ever surfaces when a visitor's query matches it; other
     * surfaces fall back to every built-in widget.
     */
    searchWidgetIds?: readonly KefineSearchWidgetId[];
    searchWidgetsLabel?: string;
    searchWeatherLabel?: string;
    searchClockLabel?: string;
    searchTranslatorLabel?: string;
    searchMusicLabel?: string;
    searchProxyLabel?: string;
    searchWidgetBackLabel?: string;
    sidebarProfile?: SidebarProfile | null;
    socialLinks: SocialLink[];
    showSocialLinks?: boolean;
    showEmailButton?: boolean;
    showAuthButton?: boolean;
    legalLinks: LegalLink[];
    onExpandedChange: (expanded: boolean) => void;
    onBrandClick: () => void;
    onOpenEmailDialog: () => void;
    onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
    onSearchQueryChange?: (query: string) => void;
    onAuth: () => void;
    onOpenProfile: () => void;
    onSignOut: () => void;
    onAuthDoubleClick: () => void;
    onSearchTrigger?: () => void | Promise<void>;
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
  let cancelAuthClick: (() => void) | null = null;
  let searchDialog: HTMLDialogElement | null = $state(null);
  let searchQuery = $state('');
  let selectedSearchIndex = $state(0);
  let searchOpen = $state(false);
  let searchFocusRequest = $state(0);
  let activeSearchWidget = $state<KefineSearchWidgetId | null>(null);
  const searchShortcutLabel = 'Ctrl K';
  const contextualSearchPlaceholder = $derived(
    searchPlaceholder.trim().startsWith('@') ? searchPlaceholder.trim() : ''
  );
  const contextualSearchSegments = $derived(parseContextualSearchPlaceholder(contextualSearchPlaceholder));
  const visibleSearchPlaceholder = $derived(
    contextualSearchPlaceholder ? searchLabel : searchPlaceholder
  );
  const widgetSearchItems = $derived.by((): KefineTopbarSearchItem[] => {
    if (!showSearchWidgets) {
      return [];
    }

    const definitions: Record<KefineSearchWidgetId, KefineTopbarSearchItem> = {
      weather: {
        id: 'widget-weather',
        title: searchWeatherLabel,
        subtitle: searchWidgetsLabel,
        category: searchWidgetsLabel,
        icon: 'weather',
        widget: 'weather',
        keywords: [searchWeatherLabel, 'weather', 'forecast', 'погода', 'прогноз', 'եղանակ']
      },
      clock: {
        id: 'widget-clock',
        title: searchClockLabel,
        subtitle: searchWidgetsLabel,
        category: searchWidgetsLabel,
        icon: 'clock',
        widget: 'clock',
        keywords: [searchClockLabel, 'clock', 'time', 'time zone', 'часы', 'время', 'ժամ', 'ժամացույց']
      },
      translate: {
        id: 'widget-translate',
        title: searchTranslatorLabel,
        subtitle: searchWidgetsLabel,
        category: searchWidgetsLabel,
        icon: 'translate',
        widget: 'translate',
        keywords: [searchTranslatorLabel, 'translate', 'translation', 'перевод', 'переводчик', 'թարգմանիչ']
      },
      music: {
        id: 'widget-music',
        title: searchMusicLabel,
        subtitle: searchWidgetsLabel,
        category: searchWidgetsLabel,
        icon: 'music',
        widget: 'music',
        keywords: [searchMusicLabel, 'music', 'audio', 'track', 'song', 'музыка', 'песня', 'երաժշտություն']
      },
      proxy: {
        id: 'widget-proxy',
        title: searchProxyLabel,
        subtitle: searchWidgetsLabel,
        category: searchWidgetsLabel,
        icon: 'proxy',
        widget: 'proxy',
        keywords: [searchProxyLabel, 'proxy', 'vpn', 'vless', 'wireguard', 'прокси', 'впн', 'պրոքսի']
      }
    };

    // Only surface the widgets this page offers, in their requested order.
    return searchWidgetIds.map((id) => definitions[id]).filter(Boolean);
  });
  const builtInSearchItems = $derived.by((): KefineTopbarSearchItem[] => {
    const items: KefineTopbarSearchItem[] = [
      {
        id: 'home',
        title: searchHomeLabel,
        subtitle: brandLabel,
        category: navigationLabel,
        href: searchHomeHref,
        icon: 'project',
        keywords: [brandLabel, searchHomeLabel, 'home']
      }
    ];

    for (const link of legalLinks) {
      items.push({
        id: `legal-${link.id}`,
        title: link.label,
        subtitle: legalLabel,
        category: legalLabel,
        href: link.href,
        icon: 'open',
        keywords: [link.id, link.label, legalLabel]
      });
    }

    items.push(...widgetSearchItems);

    return items;
  });
  const activeWidgetTitle = $derived.by(() => {
    if (activeSearchWidget === 'weather') {
      return searchWeatherLabel;
    }

    if (activeSearchWidget === 'clock') {
      return searchClockLabel;
    }

    if (activeSearchWidget === 'translate') {
      return searchTranslatorLabel;
    }

    if (activeSearchWidget === 'music') {
      return searchMusicLabel;
    }

    if (activeSearchWidget === 'proxy') {
      return searchProxyLabel;
    }

    return '';
  });
  // The weather widget only renders for weather-intent text. When opened from the
  // palette we seed the localized keyword so it shows the default (geolocation)
  // forecast immediately, while free-typed text like "London" still refines it.
  const weatherWidgetQuery = $derived(
    detectWeatherIntent(searchQuery) ? searchQuery : `${searchWeatherLabel} ${searchQuery}`.trim()
  );
  const allSearchItems = $derived([...builtInSearchItems, ...searchItems]);
  const normalizedSearchQuery = $derived(normalizeSearchValue(searchQuery));
  const filteredSearchItems = $derived.by(() => {
    if (!normalizedSearchQuery) {
      return allSearchItems.filter((item) => !item.hideWhenEmpty).slice(0, 9);
    }

    return allSearchItems
      .filter(
        (item) =>
          getSearchHaystack(item).includes(normalizedSearchQuery) ||
          item.showForQuery?.(searchQuery) === true
      )
      .slice(0, 9);
  });

  function updateScrollState() {
    hasScrolled = window.scrollY > 8;
  }

  onMount(() => {
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('keydown', handleGlobalSearchKeydown);

    return () => {
      window.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('keydown', handleGlobalSearchKeydown);
    };
  });

  // Deep links can open the palette automatically: non-search `?q=term` routes
  // seed the query and widget short links (e.g. `/@profile/weather`) surface
  // that widget inline.
  // We track the applied signature so the dialog opens once per distinct link
  // instead of re-opening on every reactive pass.
  let appliedDeepLink = $state<string | null>(null);
  let appliedSearchRequestId = $state(0);
  $effect(() => {
    if (!showSearch) {
      return;
    }

    const query = (initialSearchQuery ?? '').trim();
    const widget = initialWidget ?? null;

    if (!query && !widget) {
      appliedDeepLink = null;
      return;
    }

    const signature = `${widget ?? ''}::${query}`;
    if (appliedDeepLink === signature) {
      return;
    }

    appliedDeepLink = signature;
    void openSearchDialog({ query: initialSearchQuery ?? '', widget });
  });

  $effect(() => {
    if (!showSearch || !searchRequest || appliedSearchRequestId === searchRequest.id) {
      return;
    }

    appliedSearchRequestId = searchRequest.id;
    void openSearchDialog({
      query: searchRequest.query ?? '',
      widget: searchRequest.widget ?? null
    });
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
    onBrandClick();
  }

  function handleEmailClick() {
    onOpenEmailDialog();
  }

  function handleAuthClick() {
    cancelAuthClick?.();
    cancelAuthClick = scheduleAfter(220, () => {
      if (isAuthenticated) {
        onOpenProfile();
      } else {
        onAuth();
      }
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

    onAuthDoubleClick();
  }

  function handleAuthKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }

    event.preventDefault();
    handleAuthClick();
  }

  function normalizeSearchValue(value: string | null | undefined) {
    return (value ?? '').trim().toLowerCase();
  }

  function getSearchHaystack(item: KefineTopbarSearchItem) {
    return [
      item.title,
      item.subtitle,
      item.category,
      item.href,
      ...(item.keywords ?? [])
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map(normalizeSearchValue)
      .join(' ');
  }

  function getSearchItemTestId(item: KefineTopbarSearchItem) {
    return `kefine-topbar-search-result-${item.id.replace(/[^a-zA-Z0-9_-]+/g, '-')}`;
  }

  function getSearchItemSubtitle(item: KefineTopbarSearchItem) {
    return item.subtitleFromQuery?.(searchQuery) || item.subtitle || item.category || item.href || searchOpenLabel;
  }

  function getSearchItemHref(item: KefineTopbarSearchItem) {
    return item.hrefFromQuery?.(searchQuery.trim()) || item.href || '';
  }

  function getLegalLinkIcon(id: LegalLink['id']): KefineTopbarIconName {
    return id === 'privacy' ? 'privacy' : 'terms';
  }

  function getSidebarProfileHandle(profile: SidebarProfile) {
    const handle = profile.handle.trim().replace(/^@+/, '');
    return handle ? `@${handle}` : '';
  }

  function parseContextualSearchPlaceholder(value: string): SearchContextSegment[] {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    const taskSeparator = ' task:';
    const taskStart = trimmed.indexOf(taskSeparator);
    if (taskStart > 0) {
      const project = trimmed.slice(0, taskStart).trim();
      const task = trimmed.slice(taskStart + taskSeparator.length).trim();
      return [
        ...(project ? [{ id: 'project', label: project, kind: 'project' as const }] : []),
        ...(task ? [{ id: 'task', label: `task:${task}`, kind: 'task' as const }] : [])
      ];
    }

    return [
      {
        id: 'context',
        label: trimmed,
        kind: trimmed.startsWith('@') ? 'project' : 'default'
      }
    ];
  }

  async function openSearchDialog(options?: { query?: string; widget?: KefineSearchWidgetId | null }) {
    if (!showSearch) {
      return;
    }

    if (onSearchTrigger && !options?.query && !options?.widget) {
      await onSearchTrigger();
      return;
    }

    cancelBrandClick?.();
    cancelLocaleClick?.();
    cancelAuthClick?.();
    themePickerOpen = false;
    localePickerOpen = false;
    onExpandedChange(false);
    searchQuery = options?.query ?? searchDefaultQuery;
    selectedSearchIndex = 0;
    activeSearchWidget = options?.widget ?? null;
    searchOpen = true;

    if (searchDialog && !searchDialog.open) {
      searchDialog.showModal();
    }

    await tick();
    searchFocusRequest += 1;
  }

  function closeSearchDialog() {
    searchOpen = false;
    searchQuery = '';
    selectedSearchIndex = 0;
    activeSearchWidget = null;

    if (searchDialog?.open) {
      searchDialog.close();
    }
  }

  function handleSearchDialogClose() {
    searchOpen = false;
    searchQuery = '';
    selectedSearchIndex = 0;
    activeSearchWidget = null;
  }

  async function closeSearchWidget() {
    activeSearchWidget = null;
    searchQuery = '';
    selectedSearchIndex = 0;
    await tick();
    searchFocusRequest += 1;
  }

  function handleSearchDialogClick(event: MouseEvent) {
    if (event.target === searchDialog) {
      closeSearchDialog();
    }
  }

  function handleGlobalSearchKeydown(event: KeyboardEvent) {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') {
      return;
    }

    event.preventDefault();
    void openSearchDialog();
  }

  function handleSearchInput(nextQuery: string) {
    searchQuery = nextQuery;
    selectedSearchIndex = 0;
    onSearchQueryChange?.(nextQuery);
  }

  function moveSelectedSearchItem(offset: number) {
    const count = filteredSearchItems.length;
    if (count === 0) {
      selectedSearchIndex = 0;
      return;
    }

    selectedSearchIndex = (selectedSearchIndex + offset + count) % count;
  }

  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (activeSearchWidget) {
        void closeSearchWidget();
      } else {
        closeSearchDialog();
      }
      return;
    }

    // While a widget is open the input drives the widget query (e.g. weather
    // city / translation text), so list navigation keys are inert.
    if (activeSearchWidget) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveSelectedSearchItem(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveSelectedSearchItem(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const item = filteredSearchItems[selectedSearchIndex];
      if (item) {
        activateSearchItem(item);
      }
    }
  }

  function activateSearchItem(item: KefineTopbarSearchItem) {
    if (item.widget) {
      // Surface the developed widget inline so it is reachable from the command
      // palette on any page, instead of leaving the page.
      activeSearchWidget = item.widget;
      searchQuery = '';
      selectedSearchIndex = 0;
      void focusSearchInput();
      return;
    }

    const href = getSearchItemHref(item).trim();
    closeSearchDialog();

    if (href && typeof window !== 'undefined') {
      window.location.assign(href);
    }
  }

  async function focusSearchInput() {
    await tick();
    searchFocusRequest += 1;
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
    cancelLocaleClick = null;
    localePickerOpen = !localePickerOpen;
    themePickerOpen = false;
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
    localePickerOpen = false;
    onExpandedChange(false);
    onThemeChange(theme);
  }

  function selectLocale(next: KefineLocale) {
    localePickerOpen = false;
    themePickerOpen = false;
    onExpandedChange(false);
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
    if (isExpanded) {
      return;
    }

    themePickerOpen = false;
    localePickerOpen = false;
  });

  $effect(() => {
    if (selectedSearchIndex < filteredSearchItems.length) {
      return;
    }

    selectedSearchIndex = Math.max(0, filteredSearchItems.length - 1);
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
        <kefine-sidebar-brand-mark data-part="brand-mark" data-testid="kefine-brand-mark">
          {brandLabel}
        </kefine-sidebar-brand-mark>
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

          <kefine-sidebar-utility>
            <kefine-sidebar-nav aria-label={legalLabel}>
              {#each legalLinks as link (link.id)}
                <a data-part="link" href={link.href}>
                  <KefineTopbarIcon name={getLegalLinkIcon(link.id)} size={18} />
                  <lefine-text data-part="link-label">{link.label}</lefine-text>
                </a>
              {/each}
            </kefine-sidebar-nav>

            <kefine-sidebar-toolbar aria-label={dockLabel}>
              <button
                type="button"
                data-part="icon"
                data-role="theme"
                data-testid="kefine-topbar-theme-toggle"
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
                data-testid="kefine-topbar-locale-toggle"
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
            </kefine-sidebar-toolbar>
          </kefine-sidebar-utility>
        </kefine-sidebar-stack>
      </kefine-sidebar-popover>
      <kefine-picker-popover
        bind:this={themePopover}
        popover="manual"
        data-kind="theme"
        ontoggle={handleThemePopoverToggle}
      >
        <kefine-picker-list>
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-theme-option-auto"
            data-active={themeMode === 'auto'}
            onclick={() => selectTheme('auto')}
          >
            <KefineTopbarIcon name="theme-auto" size={18} />
            <lefine-text>{themeAutoLabel}</lefine-text>
          </button>
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-theme-option-light"
            data-active={themeMode === 'light'}
            onclick={() => selectTheme('light')}
          >
            <KefineTopbarIcon name="theme-light" size={18} />
            <lefine-text>{themeLightLabel}</lefine-text>
          </button>
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-theme-option-dark"
            data-active={themeMode === 'dark'}
            onclick={() => selectTheme('dark')}
          >
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
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-locale-option-en"
            data-active={locale === 'en'}
            onclick={() => selectLocale('en')}
          >
            <KefineTopbarIcon name={localeFlagIcons.en} size={18} />
            <lefine-text>{languageEnglishLabel}</lefine-text>
          </button>
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-locale-option-ru"
            data-active={locale === 'ru'}
            onclick={() => selectLocale('ru')}
          >
            <KefineTopbarIcon name={localeFlagIcons.ru} size={18} />
            <lefine-text>{languageRussianLabel}</lefine-text>
          </button>
          <button
            type="button"
            data-part="picker-option"
            data-testid="kefine-topbar-locale-option-hy"
            data-active={locale === 'hy'}
            onclick={() => selectLocale('hy')}
          >
            <KefineTopbarIcon name={localeFlagIcons.hy} size={18} />
            <lefine-text>{languageArmenianLabel}</lefine-text>
          </button>
        </kefine-picker-list>
      </kefine-picker-popover>
    </kefine-sidebar-root>
    </nav>

    {#if showSearch}
      <kefine-topbar-search-shell>
        <button
          type="button"
          data-part="search-trigger"
          data-testid="kefine-topbar-search-trigger"
          data-context={contextualSearchPlaceholder ? 'project' : 'search'}
          aria-label={searchLabel}
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          title={`${searchLabel} (${searchShortcutLabel})`}
          onclick={() => void openSearchDialog()}
        >
          {#if contextualSearchPlaceholder}
            <lefine-text data-part="search-context" data-testid="kefine-topbar-search-context">
              {#each contextualSearchSegments as segment (segment.id)}
                <kefine-topbar-search-context-segment
                  data-part="search-context-segment"
                  data-kind={segment.kind}
                  data-testid="kefine-topbar-search-context-segment"
                >
                  {segment.label}
                </kefine-topbar-search-context-segment>
              {/each}
            </lefine-text>
          {:else}
            <KefineTopbarIcon name="search" size={18} />
          {/if}
          {#if !contextualSearchPlaceholder}
            <lefine-text data-part="search-placeholder">{visibleSearchPlaceholder}</lefine-text>
          {/if}
          <lefine-kbd data-part="search-shortcut">{searchShortcutLabel}</lefine-kbd>
        </button>
        {#if searchActions.length > 0}
          <kefine-topbar-search-actions>
            {#each searchActions as action (action.id)}
              <button
                type="button"
                data-part="search-action"
                data-testid={action.testId}
                data-icon={action.icon}
                aria-label={action.label}
                title={action.label}
                onclick={() => void action.onClick()}
              >
                <KefineTopbarIcon name={action.icon} size={18} />
              </button>
            {/each}
          </kefine-topbar-search-actions>
        {/if}
      </kefine-topbar-search-shell>

      <dialog
        bind:this={searchDialog}
        data-part="search-dialog"
        data-testid="kefine-topbar-search-dialog"
        aria-label={searchLabel}
        onclose={handleSearchDialogClose}
        onclick={handleSearchDialogClick}
      >
        <kefine-search-panel>
          <KefineSearchInput
            value={searchQuery}
            label={searchLabel}
            placeholder={searchPlaceholder}
            inputTestId="kefine-topbar-search-input"
            rowTestId="kefine-topbar-search-input-row"
            shortcutLabel={searchShortcutLabel}
            showShortcut={false}
            showBack={Boolean(activeSearchWidget)}
            backLabel={searchWidgetBackLabel}
            focusRequest={searchFocusRequest}
            onInput={handleSearchInput}
            onKeydown={handleSearchKeydown}
            onBack={closeSearchWidget}
          />
          {#if activeSearchWidget}
            <kefine-search-results-header>
              <lefine-text>{activeWidgetTitle}</lefine-text>
            </kefine-search-results-header>
            <kefine-search-widget
              data-part="search-widget"
              data-widget={activeSearchWidget}
              data-testid="kefine-topbar-search-widget"
            >
              {#if activeSearchWidget === 'weather'}
                <KefineWeatherWidget active query={weatherWidgetQuery} />
              {:else if activeSearchWidget === 'clock'}
                <KefineClockWidget active query={searchQuery} />
              {:else if activeSearchWidget === 'translate'}
                <KefineTranslatorWidget active query={searchQuery} />
              {:else if activeSearchWidget === 'music'}
                <KefineMusicWidget active />
              {:else if activeSearchWidget === 'proxy'}
                <KefineProxyConfigWidget active />
              {/if}
            </kefine-search-widget>
          {:else}
          <kefine-search-results-header>
            <lefine-text>{searchResultsLabel}</lefine-text>
          </kefine-search-results-header>
          <kefine-search-results>
            {#if filteredSearchItems.length > 0}
              {#each filteredSearchItems as item, index (item.id)}
                <button
                  type="button"
                  data-part="search-result"
                  data-active={index === selectedSearchIndex}
                  data-testid={getSearchItemTestId(item)}
                  onmouseenter={() => {
                    selectedSearchIndex = index;
                  }}
                  onclick={() => activateSearchItem(item)}
                >
                  <kefine-search-result-icon>
                    <KefineTopbarIcon name={item.icon ?? 'project'} size={18} />
                  </kefine-search-result-icon>
                  <kefine-search-result-copy>
                    <lefine-text data-part="search-result-title">{item.title}</lefine-text>
                    <lefine-text data-part="search-result-subtitle">
                      {getSearchItemSubtitle(item)}
                    </lefine-text>
                  </kefine-search-result-copy>
                  <kefine-search-result-meta>
                    {#if item.category}
                      <lefine-text>{item.category}</lefine-text>
                    {/if}
                    <lefine-kbd>{item.actionLabel ?? searchOpenLabel}</lefine-kbd>
                  </kefine-search-result-meta>
                </button>
              {/each}
            {:else}
              <kefine-search-empty>
                <lefine-text>{searchEmptyLabel}</lefine-text>
              </kefine-search-empty>
            {/if}
          </kefine-search-results>
          {/if}
        </kefine-search-panel>
      </dialog>
    {/if}

    {#if showAuthButton}
      <kefine-topbar-account>
        <button
          data-part="auth"
          data-authenticated={isAuthenticated}
          type="button"
          data-scrolled={hasScrolled}
          data-variant={isAuthenticated ? 'ghost' : 'primary'}
          data-loading={isAuthLoading}
          disabled={isAuthLoading}
          onclick={handleAuthClick}
          ondblclick={handleAuthDoubleClick}
          onkeydown={handleAuthKeydown}
        >
          {#if isAuthLoading}
            <lef-auth-loading aria-hidden="true"></lef-auth-loading>
          {/if}
          <kefine-auth-label data-part="auth-label">
            {#if isAuthenticated}
              {authenticatedSecondaryLabel ?? authenticatedLabel ?? signedInLabel}
            {:else}
              {signInLabel}
            {/if}
          </kefine-auth-label>
        </button>
        {#if onSignOut && isAuthenticated}
          <button
            data-part="sign-out"
            type="button"
            data-scrolled={hasScrolled}
            data-testid="kefine-topbar-sign-out"
            aria-label={signOutLabel}
            title={signOutLabel}
            onclick={onSignOut}
          >
            <KefineTopbarIcon name="sign-out" size={20} />
          </button>
        {/if}
      </kefine-topbar-account>
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

  kefine-topbar-search-shell {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    justify-content: center;
    flex: 1 1 min(28rem, 48vw);
    min-width: 2.55rem;
    pointer-events: auto;
  }

  button[data-part='search-trigger'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.58rem;
    width: min(100%, 30rem);
    min-height: 2.5rem;
    padding: 0.42rem 0.58rem 0.42rem 0.72rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 68%, transparent);
    border-radius: calc(var(--kef-radius-ui) - 0.04rem);
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg));
    color: color-mix(in oklab, var(--lefine-text) 82%, transparent);
    font: inherit;
    cursor: pointer;
    box-shadow: 0 8px 18px color-mix(in oklab, #544536 5%, transparent);
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-topbar[data-scrolled='true'] button[data-part='search-trigger'] {
    background: transparent;
    box-shadow: none;
  }

  button[data-part='search-trigger']:hover,
  button[data-part='search-trigger'][aria-expanded='true'] {
    border-color: color-mix(in oklab, var(--kef-primary) 34%, var(--kef-border));
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    box-shadow: 0 10px 22px color-mix(in oklab, var(--lefine-text) 6%, transparent);
  }

  button[data-part='search-trigger'][data-context='project'] {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  button[data-part='search-trigger'][data-context='project'] [data-part='search-context'] {
    max-width: 100%;
  }

  kefine-topbar-search-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex: 0 0 auto;
  }

  button[data-part='search-action'] {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    min-width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 68%, transparent);
    border-radius: calc(var(--kef-radius-ui) - 0.04rem);
    background: color-mix(in oklab, var(--kef-bg-card) 90%, var(--kef-bg));
    color: color-mix(in oklab, var(--lefine-text) 82%, transparent);
    cursor: pointer;
    box-shadow: 0 8px 18px color-mix(in oklab, #544536 5%, transparent);
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft);
  }

  kefine-topbar[data-scrolled='true'] button[data-part='search-action'] {
    background: transparent;
    box-shadow: none;
  }

  button[data-part='search-action']:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 34%, var(--kef-border));
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    box-shadow: 0 10px 22px color-mix(in oklab, var(--lefine-text) 6%, transparent);
  }

  button[data-part='search-trigger'] [data-part='search-context'] {
    display: inline-flex;
    align-items: center;
    gap: 0.28rem;
    min-width: 0;
    max-width: min(22rem, 100%);
    color: var(--lefine-text);
    overflow: hidden;
  }

  button[data-part='search-trigger'] [data-part='search-context-segment'] {
    display: inline-flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
    padding: 0.24rem 0.48rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-line) 74%, transparent);
    border-radius: calc(var(--kef-radius-sm) + 0.08rem);
    background: color-mix(in oklab, var(--kef-bg-card) 88%, var(--kef-bg-soft));
    color: color-mix(in oklab, var(--lefine-text) 88%, var(--kef-primary));
    font-size: 0.83rem;
    font-weight: 760;
    line-height: 1;
    letter-spacing: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button[data-part='search-trigger'] [data-part='search-context-segment'][data-kind='project'] {
    border-color: color-mix(in oklab, var(--kef-primary) 32%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 13%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-primary) 72%, var(--lefine-text));
  }

  button[data-part='search-trigger'] [data-part='search-context-segment'][data-kind='task'] {
    border-color: color-mix(in oklab, var(--kef-success, var(--kef-color-success)) 26%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-success, var(--kef-color-success)) 11%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-success, var(--kef-color-success)) 66%, var(--lefine-text));
  }

  button[data-part='search-trigger'] [data-part='search-placeholder'] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.94rem;
    font-weight: 560;
    line-height: 1.1;
    letter-spacing: 0;
    text-align: left;
    color: color-mix(in oklab, currentColor 84%, transparent);
  }

  button[data-part='search-trigger'][data-context='project'] [data-part='search-placeholder'] {
    color: color-mix(in oklab, var(--lefine-text-soft) 74%, transparent);
  }

  lefine-kbd {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 2.28rem;
    min-height: 1.46rem;
    padding: 0 0.42rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, currentColor 18%, transparent);
    border-radius: var(--kef-radius-sm);
    background: color-mix(in oklab, var(--kef-bg-soft) 72%, transparent);
    color: color-mix(in oklab, currentColor 72%, transparent);
    font-size: 0.72rem;
    font-weight: 680;
    line-height: 1;
    letter-spacing: 0;
    white-space: nowrap;
  }

  dialog[data-part='search-dialog'] {
    position: fixed;
    top: clamp(4.5rem, 12dvh, 7rem);
    left: 50%;
    right: auto;
    bottom: auto;
    transform: translateX(-50%);
    width: min(48rem, calc(100vw - 1.8rem));
    max-height: min(72dvh, 42rem);
    margin: 0;
    padding: 0;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 74%, transparent);
    border-radius: var(--kef-radius-ui);
    background: color-mix(in oklab, var(--kef-bg-card) 97%, var(--kef-bg));
    color: var(--lefine-text);
    overflow: hidden;
    box-shadow: 0 24px 80px color-mix(in oklab, #000000 22%, transparent);
    pointer-events: auto;
  }

  dialog[data-part='search-dialog']::backdrop {
    background: color-mix(in oklab, #000000 18%, transparent);
    backdrop-filter: blur(4px);
  }

  kefine-search-panel {
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    max-height: min(72dvh, 42rem);
  }

  kefine-search-results-header {
    display: flex;
    align-items: center;
    min-height: 2.7rem;
    padding: 0.7rem 1rem 0.3rem;
    color: color-mix(in oklab, var(--lefine-text-soft) 76%, transparent);
    font-size: 0.78rem;
    font-weight: 720;
    line-height: 1;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  kefine-search-results {
    display: grid;
    gap: 0.26rem;
    padding: 0 0.7rem 0.78rem;
    overflow: auto;
  }

  button[data-part='search-result'] {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.76rem;
    min-height: 3.9rem;
    width: 100%;
    padding: 0.58rem 0.68rem;
    border: var(--kef-border-width-soft) solid transparent;
    border-radius: calc(var(--kef-radius-ui) - 0.1rem);
    background: transparent;
    color: var(--lefine-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  button[data-part='search-result'][data-active='true'],
  button[data-part='search-result']:hover {
    border-color: color-mix(in oklab, var(--kef-primary) 24%, var(--kef-line));
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
  }

  kefine-search-result-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, currentColor 16%, transparent);
    border-radius: var(--kef-radius-md);
    background: color-mix(in oklab, var(--kef-bg-soft) 76%, transparent);
    color: color-mix(in oklab, currentColor 78%, transparent);
  }

  kefine-search-result-copy {
    display: grid;
    gap: 0.18rem;
    min-width: 0;
  }

  lefine-text[data-part='search-result-title'],
  lefine-text[data-part='search-result-subtitle'] {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.12;
    letter-spacing: 0;
  }

  lefine-text[data-part='search-result-title'] {
    font-size: 0.98rem;
    font-weight: 690;
    color: color-mix(in oklab, currentColor 96%, transparent);
  }

  lefine-text[data-part='search-result-subtitle'] {
    font-size: 0.82rem;
    font-weight: 560;
    color: color-mix(in oklab, var(--lefine-text-soft) 76%, transparent);
  }

  kefine-search-result-meta {
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 0.55rem;
    min-width: 0;
    color: color-mix(in oklab, var(--lefine-text-soft) 74%, transparent);
    font-size: 0.82rem;
    font-weight: 620;
    white-space: nowrap;
  }

  kefine-search-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 7rem;
    padding: 1rem;
    color: color-mix(in oklab, var(--lefine-text-soft) 76%, transparent);
    font-size: 0.95rem;
    font-weight: 600;
    text-align: center;
  }

  kefine-search-widget {
    display: block;
    padding: 0 1rem 1rem;
    overflow: auto;
  }

  kefine-sidebar-root {
    position: relative;
    z-index: 1;
    display: grid;
    align-content: start;
    gap: 0.9rem;
    width: 7.5rem;
    min-width: 7.5rem;
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
    min-height: 2.5rem;
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
    min-width: 6.55rem;
    min-height: 2.5rem;
    flex: 0 0 auto;
    border-radius: calc(var(--kef-radius-ui) - 0.12rem);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: color-mix(in oklab, var(--kef-bg-card) 82%, transparent);
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    font-family: var(--kef-font-family-brand);
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
    padding: 0 0.48rem;
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
    width: min(20rem, calc(100vw - 2rem));
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: transparent;
  }

  kefine-sidebar-profile {
    display: block;
    min-width: 0;
  }

  kefine-sidebar-profile [data-part='profile-card'] {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: center;
    min-height: 4.15rem;
    padding: 0.72rem 0.8rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-line) 82%, transparent);
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: color-mix(in oklab, var(--kef-primary) 7%, transparent);
    color: var(--lefine-text);
    text-decoration: none;
  }

  kefine-sidebar-profile-copy {
    display: grid;
    gap: 0.18rem;
    min-width: 0;
  }

  kefine-sidebar-profile-copy lefine-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    letter-spacing: 0;
  }

  kefine-sidebar-profile-copy [data-part='profile-handle'] {
    color: color-mix(in oklab, var(--kef-primary) 74%, var(--lefine-text-soft));
    font-size: 0.94rem;
    font-weight: 700;
    line-height: 1.1;
  }

  kefine-sidebar-profile-copy [data-part='profile-bio'] {
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
    font-weight: 520;
    line-height: 1.2;
  }

  kefine-sidebar-utility {
    display: flex;
    align-items: stretch;
    gap: 0.45rem;
    min-width: 0;
  }

  kefine-sidebar-nav {
    display: grid;
    gap: 0.42rem;
    min-width: 0;
  }

  kefine-sidebar-nav a[data-part='link'] {
    min-height: 2.85rem;
    border-radius: calc(var(--kef-radius-ui) - 0.06rem);
    background: transparent;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    justify-content: stretch;
    gap: 0.62rem;
    padding: 0.72rem 0.78rem;
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
    overflow: hidden;
    text-overflow: ellipsis;
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
  }

  kefine-sidebar-toolbar {
    display: flex;
    flex-wrap: nowrap;
    align-items: center;
    gap: 0.4rem;
    width: fit-content;
    padding: 0;
    overflow: visible;
    border-color: color-mix(in oklab, var(--kef-border) 62%, transparent);
    color: color-mix(in oklab, var(--lefine-text) 92%, transparent);
  }

  kefine-sidebar-toolbar[data-kind='social'] {
    justify-content: flex-start;
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

  kefine-topbar-account {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    flex: 0 1 auto;
    min-width: 0;
    pointer-events: none;
  }

  button[data-part='sign-out'] {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: 2.5rem;
    height: 2.5rem;
    min-height: 2.5rem;
    padding: 0;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    border-radius: calc(var(--kef-radius-ui) - 0.04rem);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, var(--kef-bg));
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    cursor: pointer;
    pointer-events: auto;
    transition:
      background-color var(--kef-motion-fast) var(--kef-ease-soft),
      box-shadow var(--kef-motion-fast) var(--kef-ease-soft),
      border-color var(--kef-motion-fast) var(--kef-ease-soft),
      color var(--kef-motion-fast) var(--kef-ease-soft);
  }

  button[data-part='sign-out'][data-scrolled='true'] {
    background: transparent;
    box-shadow: none;
    backdrop-filter: none;
  }

  button[data-part='sign-out']:hover {
    color: color-mix(in oklab, var(--kef-primary) 92%, #4f3d30);
    border-color: color-mix(in oklab, var(--kef-primary) 38%, var(--kef-border));
    background: color-mix(in oklab, var(--kef-primary) 10%, transparent);
  }

  button[data-part='auth'] {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    flex: 0 1 auto;
    gap: 0.55rem;
    anchor-name: --kefine-auth-anchor;
    width: auto;
    min-width: 0;
    max-width: min(calc(16ch + 2rem), calc(100vw - 2rem));
    min-height: 2.5rem;
    padding: 0.42rem 0.8rem;
    border: var(--kef-border-width-soft) solid color-mix(in oklab, var(--kef-border) 72%, transparent);
    border-radius: calc(var(--kef-radius-ui) - 0.04rem);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, var(--kef-bg));
    color: color-mix(in oklab, var(--lefine-text) 96%, transparent);
    font: inherit;
    cursor: pointer;
    pointer-events: auto;
    justify-content: flex-start;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
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

  lef-auth-loading {
    width: 0.92rem;
    height: 0.92rem;
    border-radius: 999px;
    border: 1.8px solid color-mix(in oklab, currentColor 22%, transparent);
    border-top-color: currentColor;
    animation: kefine-auth-spin 0.78s linear infinite;
  }

  button[data-part='auth'] > [data-part='auth-label'] {
    display: block;
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
    text-overflow: clip;
    white-space: nowrap;
    font-size: 0.95rem;
    font-weight: 620;
    line-height: 1.15;
    text-align: left;
  }

  button[data-part='auth'][data-authenticated='true'] {
    flex-basis: min(calc(16ch + 2rem), calc(100vw - 2rem));
    width: min(calc(16ch + 2rem), calc(100vw - 2rem));
  }

  @keyframes kefine-auth-spin {
    to {
      transform: rotate(360deg);
    }
  }

  @media (max-width: 760px) {
    button[data-part='auth'] {
      max-width: min(calc(12ch + 1.44rem), calc(100vw - 4.25rem));
      padding-inline: 0.72rem;
    }

    kefine-topbar {
      top: 0;
      left: 0;
      right: 0;
    }

    kefine-topbar-row {
      padding: 0.7rem 0.55rem;
      gap: 0.45rem;
      justify-content: flex-start;
    }

    kefine-topbar-search-shell {
      margin-left: auto;
      flex: 0 0 auto;
      width: auto;
      gap: 0.32rem;
    }

    kefine-topbar-search-actions {
      gap: 0.28rem;
    }

    button[data-part='search-action'] {
      width: 2.25rem;
      min-width: 2.25rem;
      height: 2.55rem;
    }

    button[data-part='search-trigger'] {
      display: inline-flex;
      justify-content: center;
      width: 2.55rem;
      min-width: 2.55rem;
      padding: 0;
      gap: 0;
    }

    button[data-part='search-trigger'][data-context='project'] {
      width: clamp(5.8rem, 30vw, 9.5rem);
      min-width: 0;
      padding: 0 0.45rem;
    }

    button[data-part='search-trigger'][data-context='project'] [data-part='search-context'] {
      max-width: 100%;
      gap: 0.22rem;
    }

    button[data-part='search-trigger'][data-context='project'] [data-part='search-context-segment'] {
      max-width: 100%;
      padding-inline: 0.4rem;
    }

    button[data-part='search-trigger'] [data-part='search-placeholder'],
    button[data-part='search-trigger'] [data-part='search-shortcut'] {
      display: none;
    }

    dialog[data-part='search-dialog'] {
      top: 4.2rem;
      width: min(100vw - 1rem, 36rem);
      max-height: calc(100dvh - 5rem);
    }

    kefine-search-panel {
      max-height: calc(100dvh - 5rem);
    }

    kefine-search-result-meta > lefine-text {
      display: none;
    }

    button[data-part='search-result'] {
      min-height: 3.65rem;
      gap: 0.58rem;
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
      width: 7.5rem;
      min-width: 7.5rem;
    }

    kefine-sidebar-root:not([data-expanded='true']) kefine-sidebar-toolbar {
      display: flex;
      flex-direction: row;
      justify-content: center;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    kefine-sidebar-root:not([data-expanded='true']) kefine-sidebar-stack {
      justify-content: center;
    }

    kefine-sidebar-popover {
      top: anchor(bottom);
      left: anchor(left);
      margin-top: 0.55rem;
      width: min(12rem, calc(100vw - 1.1rem));
      min-width: min(12rem, calc(100vw - 1.1rem));
      max-width: min(12rem, calc(100vw - 1.1rem));
    }

    kefine-sidebar-stack {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      background: transparent;
      flex-wrap: nowrap;
    }

    kefine-sidebar-utility {
      display: grid;
      gap: 0.45rem;
      width: 100%;
    }

    kefine-sidebar-nav,
    kefine-sidebar-toolbar {
      width: 100%;
      flex-shrink: 0;
    }

    kefine-sidebar-toolbar {
      display: flex;
      flex-direction: row;
      flex-wrap: nowrap;
      gap: 0.35rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    button[data-part='auth'] {
      max-width: min(calc(12ch + 1.44rem), calc(100vw - 4.25rem));
      padding-inline: 0.72rem;
      white-space: nowrap;
      text-align: left;
    }

    button[data-part='auth'][data-authenticated='true'] {
      flex-basis: min(calc(12ch + 1.44rem), calc(100vw - 4.25rem));
      width: min(calc(12ch + 1.44rem), calc(100vw - 4.25rem));
    }
  }
</style>
