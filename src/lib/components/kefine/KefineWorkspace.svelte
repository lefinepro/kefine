<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { isSpecialRuntimeOrigin } from '$lib/config/special-runtime';
  import { resolveOrderProxyBasePath } from '$lib/order-proxy-path';
  import { onMount } from 'svelte';
import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import { authState, clearAuthState, hydrateAuthStateFromSession, replaceAuthState, updateAuthState } from '$lib/auth/auth-store.svelte.js';
  import {
    loadPasskeySession,
    passkeySessionStore,
    setPasskeySession
  } from '$lib/auth/passkey-session';
  import { readReownAccountState, subscribeToAppKitAccount, syncAppKitTheme } from '$lib/auth/appkit';
  import {
    loginWithPrivateKey,
    performAuthentication,
    finishAuthentication,
    type PasskeyAuthSuccess
  } from '$lib/auth/routes';
  import {
    getLocaleText,
    kefineLocale,
    setKefineLocale,
    type KefineLocale
  } from '$lib/constants/kefine-locale';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import KefineCreateStep from '$lib/components/kefine/KefineCreateStep.svelte';
  import KefineAuthDialog from '$lib/components/kefine/KefineAuthDialog.svelte';
  import KefineContactDialog from '$lib/components/kefine/KefineContactDialog.svelte';
  import KefinePasskeyDialog from '$lib/components/kefine/KefinePasskeyDialog.svelte';
  import KefinePrivateKeyDialog from '$lib/components/kefine/KefinePrivateKeyDialog.svelte';
  import KefineSubmittingStep from '$lib/components/kefine/KefineSubmittingStep.svelte';
  import KefineErrorStep from '$lib/components/kefine/KefineErrorStep.svelte';
  import KefineExecutingStep from '$lib/components/kefine/KefineExecutingStep.svelte';
  import KefinePaymentStep from '$lib/components/kefine/KefinePaymentStep.svelte';
  import {
    ORDER_STORAGE_KEY,
    POLL_INTERVAL_MS,
    POLL_LIMIT,
    type AuthMethod,
    type DraftOrder,
    type FlowStep,
    type OrderView,
    type PaymentMethod,
    type PaymentStage,
    type ResultSurface,
    type TaskAccessMode,
    type TemplatePresentation,
    deriveExecutionPresentation,
    deriveResultSurface,
    resolveExecutionEstimate,
    toNumber
  } from '$lib/components/kefine/kefine-workflow';
  import {
    buildTaskRouteHash,
    createGeneratedWalletAvatar,
    createContactMailtoUrl,
    getVisibleOrdersLimit,
    mergeOrdersById,
    normalizeDraftOrder,
    resolveOrderIdCandidates,
    resolveOrderIdFromRouteValue,
    resolveWalletNetworkLabel,
    readTaskRouteStateFromLocation
  } from '$lib/components/kefine/kefine-workspace-helpers';
  import {
    fetchOrderStatus,
    loadWorkspaceOrders,
    persistWorkspaceOrders,
    pollWorkspaceOrder,
    submitWorkspaceOrder
  } from '$lib/components/kefine/kefine-workspace-orders';
  import { waitForDelay } from '$lib/utils/helpers';
  import { disconnectAppKit } from '$lib/auth/appkit';
  import { renderPromptTemplate, resolveTemplateLocalizedContent, syncPromptVariables } from '$lib/templates/template-content';
  import { fetchPublicTemplates, fetchTemplateByHandleAndSlug } from '$lib/templates/template-api';
  import type { Profile, ProfileTemplate } from '$lib/types/user';
  import {
    addProfileBonus,
    buildCanonicalServicePath,
    calculateTemplateAmounts,
    buildProfilePath,
    ensureProfileForSession,
    getProfileById,
    normalizeProfileUsername,
    readProfileFollows,
    readProfiles,
    updateStoredProfile
  } from '$lib/profile/profile-storage';

  const THEME_STORAGE_KEY = 'kefine-theme';
  const BRAND_HOME_NAVIGATION_STORAGE_KEY = 'kefine-brand-home-navigation';

  let {
    initialOrderId,
    initialTemplateHandle,
    initialTemplateSlug
  }: {
    initialOrderId?: string;
    initialTemplateHandle?: string;
    initialTemplateSlug?: string;
  } = $props();
  const localeText = $derived(getLocaleText($kefineLocale));
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));

  function getNormalizedInitialOrderId() {
    return initialOrderId?.trim() || null;
  }

  function createEmptyDraft(): DraftOrder {
    return {
      title: '',
      description: '',
      tags: [],
      estimatedCost: '',
      currency: 'USD',
      executionEstimate: '',
      files: [],
      templateFiles: [],
      templatePromptTemplate: '',
      templateVariables: [],
      templateVariableValues: {}
    };
  }

  function formatPinnedServiceTitle(slug: string): string {
    const normalized = slug.trim().replace(/[-_]+/g, ' ');
    if (!normalized) {
      return 'Service';
    }

    return normalized.replace(/\b\w/g, (char) => char.toUpperCase());
  }

  let step = $state<FlowStep>(getNormalizedInitialOrderId() ? 'executing' : 'create');
  let draft = $state<DraftOrder>(createEmptyDraft());
  let draftQueued = $state<DraftOrder | null>(null);
  let currentOrder = $state<OrderView | null>(
    getNormalizedInitialOrderId()
      ? {
          id: getNormalizedInitialOrderId() as string,
          solver: '',
          status: 'queued',
          title: '',
          description: '',
          createdAt: new Date().toISOString(),
          currency: 'USDC'
        }
      : null
  );
  let createdOrders = $state<OrderView[]>([]);
  let leftNavExpanded = $state(false);
  let isSpecialRuntime = $state(false);
  let errorMessage = $state('');

  let isDarkTheme = $state(false);
  let selectedAuthMethod = $state<AuthMethod>(null);
  let paymentMethod = $state<PaymentMethod>(null);
  let paymentStage = $state<PaymentStage>('payment-method-select');
  let depositDialogOpen = $state(false);
  let authDialogOpen = $state(false);
  let contactDialogOpen = $state(false);
  let passkeyDialogOpen = $state(false);
  let privateKeyDialogOpen = $state(false);
  let stagePreviewOpen = $state(false);
  let privateKeyInput = $state('');
  let contactName = $state('');
  let contactEmail = $state('');
  let contactMessage = $state('');
  let isHydratingRoute = $state(Boolean(getNormalizedInitialOrderId()));
  let currentProfile = $state<Profile | null>(null);
  let activeTemplate = $state<ProfileTemplate | null>(null);
  let publicTemplates = $state<ProfileTemplate[]>([]);
  let templateUnavailable = $state(false);
  let templateLoadKey = $state('');
  let publicTemplateLoadKey = $state('');
  let profileRedirectKey = $state('');
  let suppressProfileRedirect = $state(false);
  let autoTemplateSubmitKey = $state('');
  const activePollTokens = new Map<string, symbol>();
  let pollAbortController = $state<AbortController | null>(null);

  const passkeySession = $derived($passkeySessionStore);
  const isPasskeyActive = $derived(passkeySession ? passkeySession.expiresAt.getTime() > Date.now() : false);
  const isAuthenticated = $derived(authState.isConnected || isPasskeyActive);
  const showPrivateKeyAuth = $derived(
    isSpecialRuntime || Boolean(runtimeConfig.defaultActor.handle?.trim())
  );
  const activeSessionProfileSeed = $derived.by(() => {
    if (isPasskeyActive && passkeySession) {
      return {
        userId: passkeySession.userId,
        email: authState.email,
        displayName: passkeySession.username,
        avatarUrl: walletAvatarUrl,
        authType: 'passkey' as const,
        walletAddress: authState.address,
        walletAlias: null
      };
    }

    if (authState.isConnected) {
      const userId = authState.userId?.trim() || authState.email?.trim().toLowerCase() || authState.address?.trim() || null;
      if (!userId) {
        return null;
      }

      return {
        userId,
        email: authState.email,
        displayName: authState.displayName?.trim() || authState.handle?.trim() || authState.email?.split('@')[0] || normalizedWalletLabel || 'user',
        avatarUrl: walletAvatarUrl,
        authType: authState.authType,
        walletAddress: authState.address,
        walletAlias: null
      };
    }

    return null;
  });
  const walletNetworkLabel = $derived(resolveWalletNetworkLabel(authState.chainId, localeText));
  const walletAvatarUrl = $derived(createGeneratedWalletAvatar(authState.address));
  const normalizedWalletLabel = $derived.by(() => {
    const email = authState.email?.trim();
    if (email) {
      return email;
    }

    const address = authState.address?.trim();
    if (!address) {
      return null;
    }

    if (address.length <= 14) {
      return address;
    }

    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  });
  const normalizedPasskeyLabel = $derived.by(() => {
    const username = passkeySession?.username?.trim();
    return username ? `@${username.replace(/^@+/, '')}` : null;
  });
  const normalizedPrivateKeyLabel = $derived.by(() => {
    const handle = authState.handle?.trim();
    return handle ? `@${handle.replace(/^@+/, '')}` : null;
  });
  const authenticatedLabel = $derived.by(() => {
    if (currentProfile?.primaryHandle) {
      return `@${currentProfile.primaryHandle}`;
    }

    if (selectedAuthMethod === 'passkey' && normalizedPasskeyLabel) {
      return normalizedPasskeyLabel;
    }

    if (selectedAuthMethod === 'wallet' && normalizedWalletLabel) {
      return normalizedWalletLabel;
    }

    if (selectedAuthMethod === 'publickey' && normalizedPrivateKeyLabel) {
      return normalizedPrivateKeyLabel;
    }

    return normalizedPrivateKeyLabel ?? normalizedPasskeyLabel ?? normalizedWalletLabel;
  });
  const ORDER_PAGE_SIZE = 12;
  let visibleOrdersLimit = $state(ORDER_PAGE_SIZE);
  const visibleOrders = $derived(createdOrders.slice(0, visibleOrdersLimit));
  const hasMoreOrders = $derived(visibleOrdersLimit < createdOrders.length);
  const topbarThemeActionLabel = $derived(
    isDarkTheme ? localeText.topbar.theme.switchToLight : localeText.topbar.theme.switchToDark
  );
  const layoutMode = $derived(
    step === 'create' ? 'create' : step === 'executing' || step === 'payment' || step === 'submitting' ? 'flow' : 'default'
  );
  const matchedOrders = $derived.by(() => {
    const query = draft.description.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return createdOrders.filter((order) => {
      if (order.status !== 'completed') {
        return false;
      }

      return [order.id, order.title, order.solver, order.status]
        .filter((value): value is string => typeof value === 'string')
        .some((value) => value.toLowerCase().includes(query));
    });
  });
  const templatePresentation = $derived.by((): TemplatePresentation | null => {
    if (!activeTemplate) {
      return null;
    }

    return {
      id: activeTemplate.id,
      slug: activeTemplate.slug,
      title: resolveTemplateLocalizedContent(activeTemplate, $kefineLocale).title,
      description: resolveTemplateLocalizedContent(activeTemplate, $kefineLocale).description,
      authorProfileId: activeTemplate.profileId,
      authorHandle: activeTemplate.authorHandle ?? initialTemplateHandle ?? '',
      authorDisplayName: activeTemplate.authorDisplayName ?? activeTemplate.authorHandle ?? initialTemplateHandle ?? '',
      pricingMode: activeTemplate.pricingMode,
      pricingValue: activeTemplate.pricingValue,
      prefillFiles: activeTemplate.prefillFiles,
      promptTemplate: resolveTemplateLocalizedContent(activeTemplate, $kefineLocale).promptTemplate,
      promptVariables: syncPromptVariables(
        resolveTemplateLocalizedContent(activeTemplate, $kefineLocale).promptTemplate,
        activeTemplate.promptVariables ?? []
      )
    };
  });
  const pinnedCreateServices = $derived.by(() => {
    const pinnedEntries = runtimeConfig.services.filter((item) => item.isPinned);
    if (pinnedEntries.length === 0) {
      return [];
    }

    const templatesByKey = new Map(
      publicTemplates.map((item) => [`${(item.authorHandle ?? '').trim().toLowerCase()}::${item.slug.trim().toLowerCase()}`, item] as const)
    );

    return pinnedEntries.flatMap((entry) => {
        const template = templatesByKey.get(`${entry.handle.trim().toLowerCase()}::${entry.slug.trim().toLowerCase()}`);
        if (!template || !template.authorHandle) {
          return [{
            id: `config:${entry.handle}:${entry.slug}`,
            href: buildCanonicalServicePath(entry.handle, entry.slug, runtimeConfig.defaultActor.handle),
            imageDataUrl: undefined,
            title: formatPinnedServiceTitle(entry.slug),
            description: `Open service @${entry.handle}/${entry.slug}`,
            authorHandle: entry.handle
          }];
        }

        const localized = resolveTemplateLocalizedContent(template, $kefineLocale);
        return [{
          id: template.id,
          href: buildCanonicalServicePath(template.authorHandle, template.slug, runtimeConfig.defaultActor.handle),
          imageDataUrl: template.imageDataUrl,
          title: localized.title,
          description: localized.description || localized.promptTemplate,
          authorHandle: template.authorHandle
        }];
      });
  });
  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: runtimeConfig.app.socialLinks.mastodon,
      icon: 'mdi:mastodon'
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: runtimeConfig.app.socialLinks.discord,
      icon: 'mdi:discord'
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: runtimeConfig.app.socialLinks.linkedin,
      icon: 'mdi:linkedin'
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: runtimeConfig.app.socialLinks.telegram,
      icon: 'mdi:telegram'
    }
  ]);
  const sidebarLegalLinks = $derived([
    {
      id: 'privacy' as const,
      label: localeText.topbar.legalLinks.privacy,
      href: '/privacy'
    },
    {
      id: 'terms' as const,
      label: localeText.topbar.legalLinks.terms,
      href: '/terms'
    },
    {
      id: 'company' as const,
      label: localeText.topbar.legalLinks.company,
      href: '/legal-information'
    }
  ]);
  const remainingAmount = $derived(currentOrder?.estimatedCost ?? 0);
  const executionPresentation = $derived(
    deriveExecutionPresentation(currentOrder, localeText, selectedAuthMethod, step === 'payment')
  );
  const resultSurface = $derived<ResultSurface>(
    deriveResultSurface(
      currentOrder,
      localeText,
      currentOrder?.paymentUrl ?? `${craterBaseUrl()}/pay/${currentOrder?.id ?? ''}`
    )
  );
  const browserTitle = $derived.by(() => {
    const title = currentOrder?.title?.trim();
    const isTaskRoute =
      getNormalizedInitialOrderId() !== null ||
      (browser && window.location.pathname.replace(/\/+$/, '').startsWith('/task/'));

    if (isTaskRoute) {
      return title ? `${title} | Lefine` : 'Loading task | Lefine';
    }

    if ((step === 'executing' || step === 'payment') && title) {
      return `${title} | Lefine`;
    }

    return 'Lefine | From task to best-fit solution.';
  });
  const authDisplay = $derived({
    appIconUrl: '/favicon.png',
    socialAvatarUrl: walletAvatarUrl,
    passkeyAvatarUrl: null as string | null,
    actorAvatarUrl: null as string | null,
    activeMethod: selectedAuthMethod,
    walletLabel: normalizedWalletLabel,
    passkeyLabel: normalizedPasskeyLabel
  });
  const profileUrl = $derived(
    currentProfile && browser ? `${window.location.origin}${buildProfilePath(currentProfile.primaryHandle)}` : ''
  );
  const activeTemplatePath = $derived.by(() => {
    if (!initialTemplateHandle || !initialTemplateSlug) {
      return '/';
    }

    return buildCanonicalServicePath(initialTemplateHandle, initialTemplateSlug, runtimeConfig.defaultActor.handle);
  });
  const isVpnTemplateRoute = $derived.by(() => {
    const handle = initialTemplateHandle?.trim().toLowerCase();
    const slug = initialTemplateSlug?.trim().toLowerCase();
    return Boolean(handle && slug && handle === runtimeConfig.defaultActor.handle.trim().toLowerCase() && slug === 'vpn-service');
  });
  const completedOwnedOrders = $derived(
    currentProfile
      ? createdOrders.filter(
          (order) =>
            order.ownerProfileId === currentProfile?.id &&
            (order.status === 'completed' || order.status === 'done' || order.isClosedCompleted === true)
        )
      : []
  );

  const TITLE_FONT_MAX = 2.0;
  const TITLE_FONT_MIN = 1.0;
  const TITLE_FONT_SHRINK_AT = 24;
  const TITLE_FONT_SHRINK_STEP = 20;
  const screenDissolveTransition = {
    duration: 640,
    easing: cubicOut
  } as const;
  const titleFontSize = $derived(
    Math.max(
      TITLE_FONT_MIN,
      TITLE_FONT_MAX - Math.max(0, (draft.description.length - TITLE_FONT_SHRINK_AT) / TITLE_FONT_SHRINK_STEP)
    )
  );

  $effect(() => {
    const source = draft.description.trim().toLowerCase();
    const isVpnDraft = /\bvpn\b/.test(source) || source.includes('telegram') || source.includes('телеграм');
    if (!isVpnDraft) {
      return;
    }

    if (!draft.estimatedCost.trim()) {
      draft.estimatedCost = '2';
    }

    if (!draft.currency.trim()) {
      draft.currency = 'USD';
    }
  });

  function softScreenTransition(_: Element): TransitionConfig {
    return {
      ...screenDissolveTransition,
      css: (t, u) => {
        const blur = u * 12;
        const scale = 0.988 + t * 0.012;
        return `
          opacity: ${t};
          transform: scale(${scale});
          filter: blur(${blur}px);
        `;
      }
    };
  }

  onMount(() => {
    if (!browser) return;
    hydrateAuthStateFromSession();
    loadPasskeySession();
    loadCreatedOrders();
    isSpecialRuntime = isSpecialRuntimeOrigin(window.location.origin);

    const routeState = readTaskRouteState();
    const routeOrderId = routeState?.orderId || getNormalizedInitialOrderId();
    if (routeOrderId) {
      isHydratingRoute = true;
      void openOrderById(routeOrderId, routeState?.view ?? null);
    }

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    isDarkTheme =
      storedTheme === 'dark' ? true : storedTheme === 'light' ? false : window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-kefine-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('lang', $kefineLocale);

    const syncReownAuthState = async () => {
      const snapshot = await readReownAccountState();

      if (authState.authType === 'publickey' && authState.isConnected && !snapshot.isConnected) {
        return;
      }

      replaceAuthState({
        isConnected: snapshot.isConnected,
        address: snapshot.address,
        chainId: snapshot.chainId,
        email: snapshot.email,
        userId: authState.userId,
        handle: authState.handle,
        displayName: authState.displayName,
        authType: snapshot.authType,
        status: snapshot.status
      });
    };

    void syncReownAuthState();
    let cancelReownSubscription: (() => void) | void;
    void subscribeToAppKitAccount(() => {
      void syncReownAuthState();
    }).then((result) => {
      cancelReownSubscription = result;
    });

    return () => {
      cancelReownSubscription?.();
      pollAbortController?.abort();
      activePollTokens.clear();
    };
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    const nextTemplateLoadKey = `${initialTemplateHandle ?? ''}|${initialTemplateSlug ?? ''}|${$kefineLocale}`;
    if (templateLoadKey === nextTemplateLoadKey) {
      return;
    }

    templateLoadKey = nextTemplateLoadKey;
    void loadActiveTemplate();
  });

  $effect(() => {
    const pinnedEntries = runtimeConfig.services.filter((item) => item.isPinned);
    const nextPublicTemplateLoadKey = `${runtimeConfig.backend.craterBaseUrl}|${pinnedEntries.map((item) => `${item.handle}:${item.slug}`).join('|')}`;

    if (publicTemplateLoadKey === nextPublicTemplateLoadKey) {
      return;
    }

    publicTemplateLoadKey = nextPublicTemplateLoadKey;

    if (!browser || pinnedEntries.length === 0) {
      publicTemplates = [];
      return;
    }

    void (async () => {
      publicTemplates = await fetchPublicTemplates(runtimeConfig.backend.craterBaseUrl, 48);
    })();
  });

  async function loadActiveTemplate() {
    if (!browser || !initialTemplateHandle || !initialTemplateSlug) {
      activeTemplate = null;
      templateUnavailable = false;
      autoTemplateSubmitKey = '';
      draft.templateFiles = [];
      return;
    }

    const template = await fetchTemplateByHandleAndSlug(runtimeConfig.backend.craterBaseUrl, initialTemplateHandle, initialTemplateSlug);
    if (!template || (template.visibility ?? (template.isPublished ? 'public' : 'private')) !== 'public') {
      activeTemplate = null;
      templateUnavailable = true;
      return;
    }

    activeTemplate = template;
    templateUnavailable = false;
    const localized = resolveTemplateLocalizedContent(template, $kefineLocale);
    const promptVariables = syncPromptVariables(localized.promptTemplate, template.promptVariables ?? []);
    const templateVariableValues = Object.fromEntries(
      promptVariables.map((item) => [item.key, item.defaultValue ?? ''])
    );
    draft = {
      ...createEmptyDraft(),
      title: localized.title,
      description: renderPromptTemplate(localized.promptTemplate, templateVariableValues),
      estimatedCost: template.prefillEstimatedCost !== undefined ? String(template.prefillEstimatedCost) : '',
      currency: template.prefillCurrency || 'USD',
      templateFiles: [...template.prefillFiles],
      templatePromptTemplate: localized.promptTemplate,
      templateVariables: promptVariables,
      templateVariableValues
    };
  }
  $effect(() => {
    if (browser) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-kefine-theme', theme);
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      document.documentElement.setAttribute('lang', $kefineLocale);
      void syncAppKitTheme(theme);
    }
  });

  $effect(() => {
    if (!browser) {
      return;
    }

    suppressProfileRedirect = sessionStorage.getItem(BRAND_HOME_NAVIGATION_STORAGE_KEY) === '1';

    if (!activeSessionProfileSeed) {
      currentProfile = null;
      return;
    }

    currentProfile = ensureProfileForSession({
      storage: localStorage,
      userId: activeSessionProfileSeed.userId,
      email: activeSessionProfileSeed.email,
      displayName: activeSessionProfileSeed.displayName,
      avatarUrl: activeSessionProfileSeed.avatarUrl,
      authType: activeSessionProfileSeed.authType,
      walletAddress: activeSessionProfileSeed.walletAddress,
      walletAlias: activeSessionProfileSeed.walletAlias
    });
  });

  $effect(() => {
    if (!browser || !currentProfile) {
      return;
    }

    if (isVpnTemplateRoute) {
      return;
    }

    if (draftQueued || currentOrder) {
      return;
    }

    if (suppressProfileRedirect && page.url.pathname === '/') {
      return;
    }

    const targetPath = buildProfilePath(currentProfile.primaryHandle);
    const nextRedirectKey = `${activeSessionProfileSeed?.userId ?? ''}|${targetPath}`;

    if (profileRedirectKey === nextRedirectKey || page.url.pathname === targetPath) {
      return;
    }

    profileRedirectKey = nextRedirectKey;
    void goto(targetPath, { replaceState: true });
  });

  $effect(() => {
    if (!browser || !isVpnTemplateRoute || !activeTemplate || templateUnavailable) {
      return;
    }

    if (step !== 'create' || draftQueued || currentOrder) {
      return;
    }

    const nextAutoTemplateSubmitKey = `${activeTemplate.id}|${$kefineLocale}`;
    if (autoTemplateSubmitKey === nextAutoTemplateSubmitKey) {
      return;
    }

    autoTemplateSubmitKey = nextAutoTemplateSubmitKey;
    void submitDraft(draft);
  });

  $effect(() => {
    if (isPasskeyActive) {
      if (!selectedAuthMethod || selectedAuthMethod === 'passkey') {
        selectedAuthMethod = 'passkey';
      }
      return;
    }

    if (authState.isConnected) {
      if (!selectedAuthMethod || selectedAuthMethod === 'wallet' || selectedAuthMethod === 'publickey') {
        selectedAuthMethod = authState.authType === 'publickey' ? 'publickey' : 'wallet';
      }
      return;
    }
  });

  $effect(() => {
    const walletReady = selectedAuthMethod === 'wallet' && authState.isConnected;
    const privateKeyReady = selectedAuthMethod === 'publickey' && authState.isConnected;
    const passkeyReady = selectedAuthMethod === 'passkey' && isPasskeyActive;
    if (step === 'executing' && !stagePreviewOpen && (walletReady || privateKeyReady || passkeyReady)) {
      paymentStage = 'result-ready';
      step = 'payment';
    }
  });

  $effect(() => {
    if (step !== 'payment') {
      return;
    }

    if (selectedAuthMethod === 'wallet' && !paymentMethod) {
      paymentMethod = 'wallet';
    }

    if (selectedAuthMethod === 'passkey' && !paymentMethod) {
      paymentMethod = 'linked-wallet';
    }

    if (selectedAuthMethod === 'publickey' && !paymentMethod) {
      paymentMethod = 'other';
    }

    if (selectedAuthMethod === 'anonymous' && !paymentMethod) {
      paymentMethod = 'promo';
    }
  });

  $effect(() => {
    if (!currentOrder || step !== 'executing' || stagePreviewOpen) {
      return;
    }

    const normalizedStatus = currentOrder.status.trim().toLowerCase();
    if (normalizedStatus === 'completed' || normalizedStatus === 'done') {
      paymentStage = 'result-ready';
      step = 'payment';
    }
  });

  $effect(() => {
    if (!browser) return;
    if (isHydratingRoute) return;

    if (page.url.pathname !== '/') {
      suppressProfileRedirect = false;
      sessionStorage.removeItem(BRAND_HOME_NAVIGATION_STORAGE_KEY);
    }

    const nextUrl = new URL(window.location.href);
    const orderId =
      (step === 'executing' || step === 'payment') && currentOrder?.id
        ? currentOrder.id
        : null;

    nextUrl.pathname = activeTemplatePath;
    nextUrl.search = '';
    if (!orderId) {
      nextUrl.hash = '';
    } else if (step === 'payment' && paymentStage === 'result-ready') {
      nextUrl.hash = buildTaskRouteHash(orderId, 'result');
    } else if (step === 'executing' && stagePreviewOpen) {
      nextUrl.hash = buildTaskRouteHash(orderId, 'stages');
    } else {
      nextUrl.hash = buildTaskRouteHash(orderId);
    }

    if (window.location.href !== nextUrl.toString()) {
      window.history.replaceState({}, '', nextUrl);
    }
  });

  function resetTransactionState() {
    selectedAuthMethod = null;
    paymentMethod = null;
    paymentStage = 'payment-method-select';
    depositDialogOpen = false;
    stagePreviewOpen = false;
  }

  async function openSocialAuth() {
        if (!browser) {
      authDialogOpen = true;
      return;
    }

    try {
      const { openAppKit } = await import('$lib/auth/appkit.js');
      await openAppKit();
    } catch {
      authDialogOpen = true;
    }
  }


  async function loginWithDefaultPasskey(): Promise<boolean> {
    if (!browser) return false;

    try {
      console.info('[passkey] loginWithDefaultPasskey:start');
      const { transactionId, response } = await performAuthentication();
      const result = await finishAuthentication(transactionId, response);
      console.info('[passkey] loginWithDefaultPasskey:success', {
        username: result.username,
        userId: result.userId
      });
      loginWithPasskey(result);
      return true;
    } catch {
      console.error('[passkey] loginWithDefaultPasskey:error');
      handlePasskeyError('');
      return false;
    }
  }

  function closeAuthDialog() {
    authDialogOpen = false;
    passkeyDialogOpen = false;
  }

  function markBrandHomeNavigationIntent() {
    if (!browser) return;

    sessionStorage.setItem(BRAND_HOME_NAVIGATION_STORAGE_KEY, '1');
  }

  function handleTopbarBrandClick() {
    suppressProfileRedirect = true;
    markBrandHomeNavigationIntent();
    leftNavExpanded = false;
    newOrder();
  }

  function openContactEmailDraft() {
    if (!browser) return;

    window.location.href = `mailto:${runtimeConfig.app.supportEmail}`;
  }

  async function selectTopbarAuth() {
    if (!isAuthenticated) {
      authDialogOpen = true;
      return;
    }
    if (!currentProfile) {
      return;
    }

    await goto(buildProfilePath(currentProfile.primaryHandle));
  }

  async function maybeOpenProfileAfterAuth(args: {
    userId: string;
    email?: string | null;
    displayName?: string | null;
    authType: 'wallet' | 'email' | 'passkey' | 'publickey' | null;
    walletAddress?: string | null;
    walletAlias?: string | null;
    force?: boolean;
  }) {
    if (!browser) {
      return;
    }

    const existingProfile = readProfiles(localStorage).find(
      (profile) =>
        profile.userId === args.userId ||
        (args.email && profile.email?.trim().toLowerCase() === args.email.trim().toLowerCase())
    );

    const ensuredProfile = ensureProfileForSession({
      storage: localStorage,
      userId: args.userId,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: walletAvatarUrl,
      authType: args.authType,
      walletAddress: args.walletAddress,
      walletAlias: args.walletAlias
    });

    currentProfile = ensuredProfile;
    const shouldOpenProfile =
      args.force === true ||
      !existingProfile ||
      ensuredProfile.metadata?.['profileSetupCompleted'] !== true;

    if (shouldOpenProfile && !draftQueued && !currentOrder) {
      await goto(buildProfilePath(ensuredProfile.primaryHandle));
    }
  }

  async function signOutProfileSession() {
    try {
      await disconnectAppKit();
    } catch {
      // AppKit might not be initialized for passkey-only sessions.
    }

    clearAuthState();
    selectedAuthMethod = null;
    paymentMethod = null;
    authDialogOpen = false;
    passkeyDialogOpen = false;
    privateKeyDialogOpen = false;
    currentProfile = null;
  }

  function selectTopbarLocale(locale: KefineLocale) {
    setKefineLocale(locale);
  }

  function submitContactEmail() {
    if (!browser) return;
    window.location.href = createContactMailtoUrl({
      brandName: localeText.brand.name,
      recipient: runtimeConfig.app.supportEmail,
      name: contactName,
      email: contactEmail,
      message: contactMessage
    });
    contactDialogOpen = false;
  }

  function loadCreatedOrders() {
    const loadedState = loadWorkspaceOrders({
      storage: localStorage,
      storageKey: ORDER_STORAGE_KEY,
      localeText,
      pageSize: ORDER_PAGE_SIZE
    });
    createdOrders = loadedState.orders;
    visibleOrdersLimit = loadedState.visibleLimit;
  }

  function persistOrders() {
    if (!browser) return;
    persistWorkspaceOrders(localStorage, ORDER_STORAGE_KEY, createdOrders);
  }

  function upsertOrder(order: OrderView) {
    const normalizedOrder = {
      ...order,
      isClosedCompleted:
        order.isClosedCompleted === true || order.status === 'completed' || order.status === 'done'
    };
    createdOrders = mergeOrdersById(createdOrders, normalizedOrder);
    visibleOrdersLimit = getVisibleOrdersLimit(createdOrders.length, visibleOrdersLimit, ORDER_PAGE_SIZE);

    persistOrders();
  }

  function stopOrder(order: OrderView) {
    activePollTokens.delete(order.id);

    const stoppedOrder: OrderView = {
      ...order,
      status: 'stopped'
    };

    upsertOrder(stoppedOrder);

    if (currentOrder?.id === order.id) {
      currentOrder = {
        ...currentOrder,
        status: 'stopped'
      };
    }
  }

  function readTaskRouteState() {
    if (!browser) return null;
    return readTaskRouteStateFromLocation(window.location);
  }

  function showOrderFlow(order: OrderView, preferredView: 'result' | 'stages' | null = null) {
    currentOrder = order;
    resetTransactionState();

    if (order.status === 'completed') {
      if (preferredView === 'stages') {
        stagePreviewOpen = true;
        step = 'executing';
        return;
      }

      paymentStage = 'result-ready';
      step = 'payment';
      return;
    }

    step = 'executing';
  }

  async function openOrderById(orderId: string, preferredView: 'result' | 'stages' | null = null) {
    if (!orderId) return;
    const resolvedOrderId = resolveOrderIdFromRouteValue(orderId, createdOrders);
    const candidateOrderIds = resolveOrderIdCandidates(orderId, createdOrders);

    try {
      const local = createdOrders.find((item) => item.id === resolvedOrderId || item.id.endsWith(`/${orderId}`));
      if (local) {
        showOrderFlow(local, preferredView);

        if (local.status !== 'completed') {
          const updated = await requestOrderFromStatus(local.id, {
            title: local.title,
            description: local.description,
            currency: local.currency,
            createdAt: local.createdAt
          });

          if (updated) {
            const nextOrder = {
              ...(currentOrder ?? local),
              ...updated,
              id: (currentOrder ?? local).id
            };
            currentOrder = nextOrder;
            upsertOrder(nextOrder);
          }
        }

        return;
      }

      for (const candidateOrderId of candidateOrderIds) {
        const remote = await requestOrderFromStatus(candidateOrderId, {
          title: '',
          description: localeText.defaults.defaultDescription || '',
          currency: localeText.defaults.defaultCurrency,
          createdAt: new Date().toISOString()
        });

        if (remote) {
          upsertOrder(remote);
          showOrderFlow(remote, preferredView);
          return;
        }
      }

      step = 'create';
    } finally {
      isHydratingRoute = false;
    }
  }

  function openOrder(order: OrderView) {
    showOrderFlow(order);
  }

  function loadMoreOrders() {
    if (!hasMoreOrders) {
      return;
    }

    visibleOrdersLimit = Math.min(visibleOrdersLimit + ORDER_PAGE_SIZE, createdOrders.length);
  }

  function orderApiBaseUrl(): string {
    if (browser && isSpecialRuntime) {
      return resolveOrderProxyBasePath('https://lefine.pro');
    }

    return resolveOrderProxyBasePath('');
  }

  function craterBaseUrl(): string {
    if (!browser) return '';
    return isSpecialRuntime ? 'https://lefine.pro' : window.location.origin;
  }

  async function requestOrderFromStatus(
    orderId: string,
    fallbackOrder: {
      title: string;
      description: string;
      currency: string;
      createdAt: string;
    }
  ): Promise<OrderView | null> {
    return fetchOrderStatus({
      orderId,
      fallbackOrder,
      localeText,
      fetchFn: fetch,
      orderApiBaseUrl: orderApiBaseUrl()
    });
  }
  function startOrderPolling(order: OrderView) {
    if (!pollAbortController || pollAbortController.signal.aborted) {
      pollAbortController = new AbortController();
    }

    const token = Symbol(order.id);
    activePollTokens.set(order.id, token);
    void pollOrderInBackground(order, token, pollAbortController.signal);
  }

  async function pollOrderInBackground(order: OrderView, token: symbol, signal: AbortSignal): Promise<void> {
    await pollWorkspaceOrder({
      order,
      token,
      signal,
      pollLimit: POLL_LIMIT,
      pollIntervalMs: POLL_INTERVAL_MS,
      localeText,
      fetchOrderStatus: requestOrderFromStatus,
      isTokenCurrent: (orderId, currentToken) => activePollTokens.get(orderId) === currentToken,
      deleteToken: (orderId) => {
        activePollTokens.delete(orderId);
      },
      upsertOrder,
      getCurrentOrder: () => currentOrder,
      setCurrentOrder: (orderValue) => {
        currentOrder = orderValue;
      },
      waitForDelay
    });
  }

  async function createOrder(payload: DraftOrder, options?: { background?: boolean }) {
    const isBackground = options?.background === true;
    if (!isBackground) {
      step = 'submitting';
    }

    let tempOrderId: string | undefined;
    if (isBackground) {
      tempOrderId = `temp-${crypto.randomUUID()}`;
      const tempOrder: OrderView = {
        id: tempOrderId,
        title: payload.title || payload.description,
        description: payload.description,
        status: 'queued',
        solver: localeText.labels?.solver ?? '',
        currency: payload.currency || 'USDC',
        createdAt: new Date().toISOString(),
        labels: payload.tags
      };
      upsertOrder(tempOrder);
    }

    const result = await submitWorkspaceOrder({
      payload,
      template: templatePresentation,
      isBackground,
      localeText,
      fetchFn: fetch,
      orderApiBaseUrl: orderApiBaseUrl(),
      toNumber,
      resolveExecutionEstimate
    });

    if (tempOrderId) {
      createdOrders = createdOrders.filter((o) => o.id !== tempOrderId);
      persistOrders();
    }

    if (result.kind === 'error') {
      if (!isBackground) {
        errorMessage = result.message || localeText.errors.fallback;
        step = 'error';
      }
      return false;
    }

    const templateAmounts =
      activeTemplate
        ? calculateTemplateAmounts({
            orderEstimatedCost: result.order.estimatedCost ?? 0,
            pricingMode: activeTemplate.pricingMode,
            pricingValue: activeTemplate.pricingValue
          })
        : null;
    const ownerOrder = {
      ...result.order,
      ...(currentProfile
        ? {
            ownerProfileId: currentProfile.id,
            ownerUsername: currentProfile.primaryHandle,
            ownerDisplayName: currentProfile.displayName,
            shareId: result.order.shareId || result.order.id,
            isClosedCompleted: result.order.status === 'completed' || result.order.status === 'done',
            isPublicTask: false,
            accessRules: {
              view: { enabled: false, priceUsd: 0 },
              watch: { enabled: false, priceUsd: 0 },
              join: { enabled: false, priceUsd: 0 }
            }
          }
        : {}),
      ...(activeTemplate
        ? {
            templateId: activeTemplate.id,
            templateSlug: activeTemplate.slug,
            templateAuthorProfileId: activeTemplate.profileId,
            templateAuthorUsername: activeTemplate.authorHandle,
            templateAuthorDisplayName: activeTemplate.authorDisplayName,
            templatePricingMode: activeTemplate.pricingMode,
            templatePricingValue: activeTemplate.pricingValue,
            templateFeeUsd: templateAmounts?.feeUsd,
            templateNetUsd: templateAmounts?.netUsd
          }
        : {})
    };

    upsertOrder(ownerOrder);
    startOrderPolling(ownerOrder);

    if (browser && activeTemplate && templateAmounts && templateAmounts.feeUsd > 0) {
      const isSelfTemplate = currentProfile?.id === activeTemplate.profileId;
      if (!isSelfTemplate) {
        addProfileBonus({
          storage: localStorage,
          profileId: activeTemplate.profileId,
          amountUsd: templateAmounts.feeUsd,
          source: 'template-order',
          note: `Template fee from order ${ownerOrder.title}`,
          orderId: ownerOrder.id
        });
      }
    }

    if (browser && activeTemplate && currentProfile && activeTemplate.bonusEnabled) {
      const bonusAmount =
        activeTemplate.bonusMode === 'percent'
          ? Number((((ownerOrder.estimatedCost ?? 0) * activeTemplate.bonusValue) / 100).toFixed(2))
          : Number(activeTemplate.bonusValue.toFixed(2));

      if (bonusAmount > 0) {
        addProfileBonus({
          storage: localStorage,
          profileId: currentProfile.id,
          amountUsd: bonusAmount,
          source: 'service-bonus',
          note: `Service bonus from ${activeTemplate.title}`,
          orderId: ownerOrder.id
        });
      }
    } else if (browser && currentProfile) {
      const follow = readProfileFollows(localStorage).find((item) => item.followerProfileId === currentProfile?.id);
      if (follow) {
        const targetProfile = getProfileById(localStorage, follow.targetProfileId);
        const amount = Number((((ownerOrder.estimatedCost ?? 0) * (targetProfile?.referralPercent ?? 0)) / 100).toFixed(2));
        if (targetProfile && amount > 0) {
          addProfileBonus({
            storage: localStorage,
            profileId: targetProfile.id,
            amountUsd: amount,
            source: 'follower-task',
            note: `Referral credit from task ${ownerOrder.title}`,
            orderId: ownerOrder.id
          });
        }
      }
    }

    if (!isBackground) {
      currentOrder = ownerOrder;
      resetTransactionState();
      step = 'executing';
    }

    return true;
  }

  async function submitDraft(form: DraftOrder, options?: { background?: boolean }) {
    const normalized = normalizeDraftOrder(form, localeText);
    const created = await createOrder(normalized, options);

    if (created && options?.background) {
      draft = createEmptyDraft();
      loadActiveTemplate();
    }
  }

  async function continueAfterAuth() {
    if (!isAuthenticated || !draftQueued) return;

    const queued = draftQueued;
    draftQueued = null;
    await createOrder(queued);
  }

  function handleSubmit() {
    void submitDraft(draft);
  }

  async function queueTaskBelow() {
    if (!draft.description.trim()) return;
    await submitDraft(draft, { background: true });
  }

  function attachFiles(files: File[]) {
    draft.files = [...draft.files, ...files];
  }

  function removeAttachedFile(index: number) {
    draft.files = draft.files.filter((_, fileIndex) => fileIndex !== index);
  }

  function updateDescription(value: string) {
    draft.description = value;
  }

  function updateTemplateVariableValue(key: string, value: string) {
    const nextValues = {
      ...draft.templateVariableValues,
      [key]: value
    };

    draft = {
      ...draft,
      templateVariableValues: nextValues,
      description: renderPromptTemplate(draft.templatePromptTemplate ?? '', nextValues)
    };
  }

  function updateTags(tags: string[]) {
    draft.tags = tags;
  }

  function updateCost(value: string) {
    draft.estimatedCost = value;
  }

  function updateCurrency(value: string) {
    draft.currency = value;
  }

  function handleStopOrder(order: OrderView, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    stopOrder(order);
  }

  function newOrder() {
    draft = createEmptyDraft();
    loadActiveTemplate();
    draftQueued = null;
    currentOrder = null;
    resetTransactionState();
    step = 'create';
  }

  function saveProfile(payload: {
    username: string;
    displayName: string;
    bio: string;
    isPublic: boolean;
    referralPercent: number;
    socialLinks: Profile['socialLinks'];
  }) {
    if (!browser || !currentProfile) {
      return;
    }

    const profileId = currentProfile.id;
    const profiles = readProfiles(localStorage).filter((profile) => profile.id !== profileId);
    const requestedUsername = normalizeProfileUsername(payload.username);
    const usernameTaken = profiles.some((profile) => (profile.primaryHandle || profile.username) === requestedUsername);
    const walletLockedHandle =
      currentProfile.primaryHandleType === 'wallet-address' || currentProfile.primaryHandleType === 'wallet-alias';
    const nextUsername = walletLockedHandle ? currentProfile.primaryHandle : usernameTaken ? currentProfile.primaryHandle : requestedUsername;

    const updated = updateStoredProfile(localStorage, profileId, (profile) => ({
      ...profile,
      username: nextUsername,
      primaryHandle: nextUsername,
      displayName: payload.displayName.trim() || nextUsername,
      bio: payload.bio.trim(),
      isPublic: payload.isPublic,
      referralPercent: Math.max(0, Math.min(100, Math.round(payload.referralPercent))),
      socialLinks: payload.socialLinks
    }));

    if (updated) {
      currentProfile = updated;
      createdOrders = createdOrders.map((order) =>
        order.ownerProfileId === updated.id
          ? {
              ...order,
              ownerUsername: updated.primaryHandle,
              ownerDisplayName: updated.displayName
            }
          : order
      );
      persistOrders();
    }
  }

  async function verifyProfileCard(cardNumber: string) {
    if (!browser || !currentProfile) {
      return;
    }

    const digits = cardNumber.replace(/\D+/g, '');
    if (digits.length < 6) {
      return;
    }

    const response = await fetch('/api/profile/bin-lookup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cardNumber: digits })
    }).catch(() => null);

    if (!response) {
      return;
    }

    const payload = (await response.json().catch(() => null)) as
      | {
          bin?: string;
          scheme?: string | null;
          cardType?: string | null;
          bankName?: string | null;
          countryAlpha2?: string | null;
          countryName?: string | null;
          isArmenianBank?: boolean;
          bonusEligible?: boolean;
          error?: string;
        }
      | null;

    if (!payload || payload.error) {
      return;
    }

    const cardVerification = {
      status: payload.bonusEligible ? 'verified' : 'rejected',
      bin: payload.bin ?? digits.slice(0, 8),
      last4: digits.slice(-4),
      scheme: payload.scheme ?? undefined,
      cardType: payload.cardType ?? undefined,
      bankName: payload.bankName ?? undefined,
      countryAlpha2: payload.countryAlpha2 ?? undefined,
      countryName: payload.countryName ?? undefined,
      isArmenianBank: payload.isArmenianBank === true,
      verifiedAt: new Date().toISOString(),
      rejectionReason: payload.bonusEligible ? undefined : 'Card is not tied to an Armenian bank allowlist issuer.'
    } as const;

    const hadBonus = Boolean(currentProfile.cardVerification?.bonusGrantedAt);
    let updated = updateStoredProfile(localStorage, currentProfile.id, (profile) => ({
      ...profile,
      cardVerification: {
        ...cardVerification,
        bonusGrantedAt:
          payload.bonusEligible && !profile.cardVerification?.bonusGrantedAt
            ? new Date().toISOString()
            : profile.cardVerification?.bonusGrantedAt
      }
    }));

    if (updated && payload.bonusEligible && !hadBonus) {
      updated = addProfileBonus({
        storage: localStorage,
        profileId: updated.id,
        amountUsd: 100,
        source: 'card-verification',
        note: 'Armenian bank card verification bonus'
      });
    }

    if (updated) {
      currentProfile = updated;
    }
  }

  function updateProfileTask(
    orderId: string,
    patch: Partial<Pick<OrderView, 'isPublicTask' | 'accessRules'>>
  ) {
    createdOrders = createdOrders.map((order) => (order.id === orderId ? { ...order, ...patch } : order));
    if (currentOrder?.id === orderId) {
      currentOrder = { ...currentOrder, ...patch };
    }
    persistOrders();
  }

  function loginWithPasskey(session: PasskeyAuthSuccess) {
    console.info('[passkey] loginWithPasskey', {
      username: session.username,
      userId: session.userId,
      expiresAt: session.expiresAt
    });
    authDialogOpen = false;
    passkeyDialogOpen = false;

    setPasskeySession({
      token: session.token,
      username: session.username,
      userId: session.userId,
      expiresAt: new Date(session.expiresAt)
    });

    if (draftQueued) {
      void continueAfterAuth();
      return;
    }

    void maybeOpenProfileAfterAuth({
      userId: session.userId,
      email: authState.email,
      displayName: session.username,
      authType: 'passkey',
      walletAddress: authState.address,
      walletAlias: null
    });

    if (currentOrder && step === 'executing') {
      stagePreviewOpen = false;
      step = 'payment';
    }
  }

  function handlePasskeyError(error: Error | string) {
    console.error('[passkey] handlePasskeyError', error);
    passkeyDialogOpen = true;
  }

  function chooseWalletMethod() {
    closeAuthDialog();
    stagePreviewOpen = false;
    selectedAuthMethod = 'wallet';
    paymentMethod = 'wallet';
    void openSocialAuth();
  }

  function openPrivateKeyDialog() {
    closeAuthDialog();
    stagePreviewOpen = false;
    privateKeyDialogOpen = true;
  }

  async function choosePrivateKeyMethod() {
    privateKeyDialogOpen = false;
    selectedAuthMethod = 'publickey';
    paymentMethod = 'other';
    try {
      const privateKeySession = await loginWithPrivateKey(privateKeyInput);

      updateAuthState({
        isConnected: true,
        address: null,
        chainId: null,
        email: privateKeySession.email,
        userId: privateKeySession.userId,
        handle: privateKeySession.handle,
        displayName: privateKeySession.displayName,
        authType: 'publickey',
        status: 'connected'
      });

      if (draftQueued) {
        void continueAfterAuth();
        return;
      }

      void maybeOpenProfileAfterAuth({
        userId: privateKeySession.userId,
        email: privateKeySession.email,
        displayName: privateKeySession.displayName,
        authType: 'publickey',
        walletAddress: null,
        walletAlias: null,
        force: true
      });

      if (currentOrder && step === 'executing') {
        step = 'payment';
      }
      privateKeyInput = '';
    } catch (error) {
      console.error('[publickey] choosePrivateKeyMethod', error);
      privateKeyDialogOpen = true;
    }
  }

  function choosePasskeyMethod() {
    console.info('[passkey] choosePasskeyMethod', {
      isPasskeyActive
    });
    closeAuthDialog();
    stagePreviewOpen = false;
    selectedAuthMethod = 'passkey';
    paymentMethod = 'linked-wallet';
    if (isPasskeyActive) {
      step = 'payment';
      return;
    }

    passkeyDialogOpen = true;
  }

  function chooseAnonymousMethod() {
    stagePreviewOpen = false;
    selectedAuthMethod = 'anonymous';
    paymentMethod = 'promo';
    paymentStage = 'result-ready';
    step = 'payment';
  }

  function selectDepositMethod(method: Exclude<PaymentMethod, null>) {
    stagePreviewOpen = false;
    paymentMethod = method;
    paymentStage = 'deposit-pending';
    depositDialogOpen = false;
  }

  function confirmPayment() {
    stagePreviewOpen = false;
    paymentStage = 'paid';
  }

  function revealResult() {
    stagePreviewOpen = false;
    paymentStage = 'result-ready';
  }

  function rejectResult() {
    if (!currentOrder) {
      resetTransactionState();
      step = 'create';
      return;
    }

    const rejectedOrder: OrderView = {
      ...currentOrder,
      status: 'rejected'
    };

    currentOrder = rejectedOrder;
    upsertOrder(rejectedOrder);
    resetTransactionState();
    step = 'create';
  }

  function saveAnonymousResult() {
    selectedAuthMethod = 'passkey';
    void loginWithDefaultPasskey();
  }

  function cancelExecutingActions() {
    resetTransactionState();
    step = 'create';
  }
</script>

<svelte:head>
  <title>{browserTitle}</title>
</svelte:head>

<kefine-shell>
  <KefineTopbar
    brandLabel={localeText.brand.name}
    navigationLabel={localeText.topbar.quickActions}
    openSidebarLabel={localeText.topbar.openActionsMenu}
    collapseSidebarLabel={localeText.topbar.closeActionsMenu}
    dockLabel={localeText.topbar.dockLabel}
    socialLabel={localeText.topbar.socialLabel}
    legalLabel={localeText.topbar.legalLabel}
    mailLabel={localeText.topbar.mailLabel}
    githubLabel={localeText.topbar.githubLabel}
    githubUrl={runtimeConfig.app.githubUrl}
    themeLabel={topbarThemeActionLabel}
    signInLabel={localeText.topbar.signIn}
    signedInLabel={localeText.topbar.signedIn}
    authenticatedLabel={authenticatedLabel}
    authenticatedSecondaryLabel={authState.isConnected ? walletNetworkLabel : null}
    authenticatedAvatarUrl={authState.isConnected ? walletAvatarUrl : null}
    isAuthenticated={isAuthenticated}
    isDarkTheme={isDarkTheme}
    isExpanded={leftNavExpanded}
    locale={$kefineLocale}
    languageEnglishLabel={localeText.topbar.languageEnglish}
    languageRussianLabel={localeText.topbar.languageRussian}
    languageArmenianLabel={localeText.topbar.languageArmenian}
    socialLinks={sidebarSocialLinks}
    legalLinks={sidebarLegalLinks}
    onToggleExpand={() => { leftNavExpanded = !leftNavExpanded; }}
    onBrandClick={handleTopbarBrandClick}
    onOpenEmailDraft={openContactEmailDraft}
    onOpenEmailDialog={() => { contactDialogOpen = true; }}
    onTheme={() => { isDarkTheme = !isDarkTheme; }}
    onAuth={selectTopbarAuth}
    onLocale={selectTopbarLocale}
  />

  <kefine-layout data-mode={layoutMode}>
    {#if templateUnavailable}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <article class="kefine-card kefine-card--wide kefine-template-unavailable">
          <h2>{localeText.profile.profileUnavailable}</h2>
          <p>{localeText.profile.noPublicTasks}</p>
        </article>
      </kefine-screen>
    {:else if step === 'create'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefineCreateStep
          draft={draft}
          template={templatePresentation}
          title={localeText.create.title}
          subtitle={localeText.create.subtitle}
          pinnedServices={pinnedCreateServices}
          pinnedServicesTitle={localeText.profile.templates}
          pinnedServicesSubtitle={localeText.create.pinnedServicesSubtitle}
          afe={{
            title: localeText.afe.title,
            cards: [
              localeText.afe.cards.afe,
              localeText.afe.cards.task,
              localeText.afe.cards.quote,
              localeText.afe.cards.delivery
            ]
          }}
          titleFontSize={titleFontSize}
          placeholder={localeText.create.placeholder}
          placeholderVariants={localeText.create.placeholderVariants}
          executeAria={localeText.create.executeAria}
          backgroundExecuteAria={localeText.create.backgroundExecuteAria}
          solverLabel={localeText.labels.solver}
          recentOrders={visibleOrders}
          matchedOrders={matchedOrders}
          isSearching={draft.description.trim().length > 0}
          totalOrders={createdOrders.length}
          hasMoreOrders={hasMoreOrders}
          onLoadMoreOrders={loadMoreOrders}
          matchedTasksLabel={localeText.create.matchedTasks}
          addFileLabel={localeText.create.addFile}
          addPriceLabel={localeText.create.addPrice}
          fileCountLabel={localeText.create.fileCount}
          composerHints={localeText.create.composerHints}
          timeLeftLabel={localeText.labels.timeLeft}
          priceLabel={localeText.labels.price}
          statusLabel={localeText.labels.taskStatus}
          stopTaskLabel={localeText.buttons.stopTask}
          onSubmit={handleSubmit}
          onQueueTask={queueTaskBelow}
          onAttachFiles={attachFiles}
          onRemoveFile={removeAttachedFile}
          onStopOrder={handleStopOrder}
          onOpenOrder={openOrder}
          onDescriptionChange={updateDescription}
          onTemplateVariableChange={updateTemplateVariableValue}
          onTagsChange={updateTags}
          onCostChange={updateCost}
          onCurrencyChange={updateCurrency}
        />
      </kefine-screen>
    {/if}

    {#if step === 'submitting'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefineSubmittingStep />
      </kefine-screen>
    {/if}

    {#if step === 'error'}
      <kefine-screen class="kefine-screen" in:softScreenTransition out:softScreenTransition>
        <KefineErrorStep
          message={errorMessage}
          retryLabel={localeText.buttons.tryAgain}
          onRetry={() => {
            errorMessage = '';
            step = 'create';
          }}
        />
      </kefine-screen>
    {/if}

    {#if step === 'executing'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefineExecutingStep
          currentOrder={currentOrder}
          execution={executionPresentation}
          isHydratingTitle={isHydratingRoute && !currentOrder?.title.trim()}
          onWalletLogin={chooseWalletMethod}
          onPasskeyLogin={choosePasskeyMethod}
          onAnonymous={chooseAnonymousMethod}
          onCancel={() => {
            if (stagePreviewOpen && currentOrder?.status === 'completed') {
              stagePreviewOpen = false;
              paymentStage = 'result-ready';
              step = 'payment';
              return;
            }

            cancelExecutingActions();
          }}
          forceFinalVpnStep={stagePreviewOpen}
          authDisplay={authDisplay}
          walletNetworkLabel={walletNetworkLabel}
          labels={{
            solver: localeText.labels.solver,
            subtasks: localeText.labels.subtasks,
            chooseMethod: localeText.labels.chooseMethod,
            cancel: localeText.buttons.cancel,
            timeLeft: localeText.labels.timeLeft,
            price: localeText.labels.price
          }}
          authLabels={{
            walletTitle: localeText.auth.walletTitle,
            passkeyTitle: localeText.auth.passkeyTitle,
            anonymousTitle: localeText.auth.anonymousTitle,
            anonymousDetail: localeText.auth.anonymousDetail,
            walletAccount: localeText.auth.walletAccount
          }}
        />
      </kefine-screen>
    {/if}

    {#if step === 'payment'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefinePaymentStep
          currentOrder={currentOrder}
          resultSurface={resultSurface}
          remainingAmount={remainingAmount}
          paymentInvoiceFallback={`${craterBaseUrl()}/pay/${currentOrder?.id ?? ''}`}
          selectedAuthMethod={selectedAuthMethod}
          paymentMethod={paymentMethod}
          paymentStage={paymentStage}
          depositDialogOpen={depositDialogOpen}
          isAuthenticated={isAuthenticated}
          onBack={() => {
            resetTransactionState();
            step = 'create';
          }}
          onRejectResult={rejectResult}
          onOpenStages={() => {
            const orderId = currentOrder?.id;
            if (!orderId) {
              stagePreviewOpen = true;
              step = 'executing';
              return;
            }

            void openOrderById(orderId, 'stages');
          }}
          onOpenDepositDialog={() => {
            depositDialogOpen = true;
          }}
          onCloseDepositDialog={() => { depositDialogOpen = false; }}
          onSelectDepositMethod={selectDepositMethod}
          onConfirmPayment={confirmPayment}
          onRevealResult={revealResult}
          onSaveAnonymousResult={saveAnonymousResult}
          onWalletLogin={chooseWalletMethod}
          onPasskeyLogin={choosePasskeyMethod}
          onAnonymousLogin={chooseAnonymousMethod}
          labels={{
            taskId: localeText.labels.taskId,
            amount: localeText.labels.amount,
            executionEstimate: localeText.labels.executionEstimate,
            paymentInvoice: localeText.labels.paymentInvoice,
            createNewTask: localeText.buttons.createNewTask,
            selectedMethod: localeText.labels.selectedMethod,
            remainingBalance: localeText.labels.remainingBalance,
            resultTitle: localeText.labels.resultTitle
          }}
          paymentLabels={{
            summaryTitle: localeText.payment.summaryTitle,
            methodSelectTitle: localeText.payment.methodSelectTitle,
            walletReadyTitle: localeText.payment.walletReadyTitle,
            passkeyReadyTitle: localeText.payment.passkeyReadyTitle,
            anonymousReadyTitle: localeText.payment.anonymousReadyTitle,
            promoHint: localeText.payment.promoHint,
            promoCodeLabel: localeText.labels.promoCode,
            promoCodePlaceholder: localeText.placeholders.promoCode,
            promoEmpty: localeText.errors.promoEmpty,
            promoOk: localeText.errors.promoOk,
            promoWrong: localeText.errors.promoWrong,
            depositDialogTitle: localeText.payment.depositDialogTitle,
            depositDialogDetail: localeText.payment.depositDialogDetail,
            depositPendingTitle: localeText.payment.depositPendingTitle,
            depositPendingDetail: localeText.payment.depositPendingDetail,
            paidTitle: localeText.payment.paidTitle,
            paidDetail: localeText.payment.paidDetail,
            linkedWalletHint: localeText.payment.linkedWalletHint,
            payCtaHint: localeText.payment.payCtaHint
          }}
          resultLabels={{
            anonymousSaveHint: localeText.result.anonymousSaveHint
          }}
          authDisplay={authDisplay}
          buttons={{
            apply: localeText.buttons.apply,
            payNow: localeText.buttons.payNow,
            confirmLinkedWallet: localeText.buttons.confirmLinkedWallet,
            depositNow: localeText.buttons.depositNow,
            payWithPromo: localeText.buttons.payWithPromo,
            openResult: localeText.buttons.openResult,
            rejectResult: localeText.buttons.rejectResult,
            openAllTasks: localeText.buttons.openAllTasks,
            saveResult: localeText.buttons.saveResult,
            closeDialog: localeText.buttons.closeDialog
          }}
        />
      </kefine-screen>
    {/if}

  </kefine-layout>

  <KefineAuthDialog
    open={authDialogOpen}
    title={localeText.executionFlow['awaiting-auth'].title}
    description={localeText.executionFlow['awaiting-auth'].detail}
    walletTitle={localeText.auth.walletTitle}
    passkeyTitle={localeText.auth.passkeyTitle}
    privateKeyTitle={localeText.auth.privateKeyTitle}
    showPrivateKey={showPrivateKeyAuth}
    closeLabel={localeText.buttons.closeDialog}
    onClose={() => { authDialogOpen = false; }}
    onWallet={chooseWalletMethod}
    onPasskey={choosePasskeyMethod}
    onPrivateKey={openPrivateKeyDialog}
  />

  <KefinePasskeyDialog
    open={passkeyDialogOpen}
    title={localeText.auth.passkeyTitle}
    onClose={() => { passkeyDialogOpen = false; }}
    onSuccess={loginWithPasskey}
    onError={handlePasskeyError}
  />

  <KefinePrivateKeyDialog
    open={privateKeyDialogOpen}
    title={localeText.auth.privateKeyTitle}
    description={localeText.auth.privateKeyDescription}
    value={privateKeyInput}
    placeholder="pqsk_..."
    submitLabel="Sign"
    closeLabel={localeText.buttons.closeDialog}
    onClose={() => { privateKeyDialogOpen = false; }}
    onInput={(value) => { privateKeyInput = value; }}
    onSubmit={choosePrivateKeyMethod}
  />

  <KefineContactDialog
    open={contactDialogOpen}
    title={localeText.contact.title}
    description={localeText.contact.description}
    nameLabel={localeText.contact.nameLabel}
    emailLabel={localeText.contact.emailLabel}
    messageLabel={localeText.contact.messageLabel}
    nameValue={contactName}
    emailValue={contactEmail}
    messageValue={contactMessage}
    namePlaceholder={localeText.placeholders.contactName}
    emailPlaceholder={localeText.placeholders.contactEmail}
    messagePlaceholder={localeText.placeholders.contactMessage}
    submitLabel={localeText.buttons.sendMessage}
    closeLabel={localeText.buttons.closeDialog}
    onClose={() => { contactDialogOpen = false; }}
    onNameInput={(value) => { contactName = value; }}
    onEmailInput={(value) => { contactEmail = value; }}
    onMessageInput={(value) => { contactMessage = value; }}
    onSubmit={submitContactEmail}
  />
</kefine-shell>

<style>
  kefine-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    padding: clamp(0.75rem, 2vw, 1.4rem);
  }

  kefine-layout {
    min-height: calc(100vh - clamp(1.5rem, 4vw, 2.8rem));
    height: auto;
    display: grid;
    gap: 1rem;
    align-items: center;
    align-content: center;
    justify-items: center;
    justify-self: center;
    width: min(980px, 100%);
    margin-inline: auto;
  }

  kefine-layout[data-mode='create'] {
    min-height: calc(100vh - clamp(1.5rem, 4vw, 2.8rem));
    width: 100%;
    max-width: none;
    align-items: start;
    align-content: start;
    padding-top: clamp(4rem, 8vh, 5.75rem);
    padding-bottom: clamp(2rem, 6vh, 4rem);
  }

  kefine-layout[data-mode='flow'] {
    align-items: start;
    align-content: start;
    width: min(1100px, 100%);
    padding-top: clamp(3.5rem, 8vh, 5.5rem);
  }

  kefine-layout > * {
    min-width: 0;
    width: 100%;
  }

  kefine-screen {
    display: grid;
    width: 100%;
  }

  .kefine-template-unavailable {
    justify-self: center;
    max-width: 42rem;
    gap: 0.75rem;
  }

  .kefine-template-unavailable h2,
  .kefine-template-unavailable p {
    margin: 0;
  }

  @media (max-width: 760px) {
    kefine-shell {
      grid-template-columns: 1fr;
      padding: 0.75rem;
    }

    kefine-layout {
      min-height: auto;
      width: min(980px, 100%);
      padding-top: 4.75rem;
    }
  }
</style>
