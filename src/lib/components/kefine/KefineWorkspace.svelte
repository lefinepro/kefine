<script lang="ts">
  import { browser } from '$app/environment';
  import { goto, replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { resolvePublicRuntimeConfig } from '$lib/config/public-config';
  import { isSpecialRuntimeOrigin } from '$lib/config/special-runtime';
  import { resolveOrderProxyBasePath } from '$lib/order-proxy-path';
  import { onMount } from 'svelte';
  import { tick } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import { authState, clearAuthState, hydrateAuthStateFromSession, replaceAuthState, updateAuthState } from '$lib/auth/auth-store.svelte.js';
  import {
    clearPasskeySession,
    loadPasskeySession,
    passkeySessionStore,
    setPasskeySession
  } from '$lib/auth/passkey-session';
  import {
    loadGeneratedPublicKeyCookie,
    saveGeneratedPrivateKeyCookie,
    saveGeneratedPublicKeyCookie
  } from '$lib/auth/publickey-cookie';
  import type { PasskeyAuthSuccess } from '$lib/auth/routes';
  import {
    kefineLocale,
    kefineLocaleText,
    setKefineLocale,
    type KefineLocale
  } from '$lib/constants/kefine-locale';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import KefineCreateStep from '$lib/components/kefine/KefineCreateStep.svelte';
  import KefineLoadingDocuments from '$lib/components/kefine/KefineLoadingDocuments.svelte';
  import KefineExecutingStep from '$lib/components/kefine/KefineExecutingStep.svelte';
  import {
    buildTaskCloneFile,
    cloneOrderToDraft,
    type TaskCloneFormat
  } from '$lib/components/kefine/kefine-task-clone';
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
    deriveExecutionPresentation,
    deriveResultSurface,
    resolveExecutionEstimate,
    toNumber
  } from '$lib/components/kefine/kefine-workflow';
  import {
    buildActorOrderPath,
    createGeneratedWalletAvatar,
    getVisibleOrdersLimit,
    mergeOrdersById,
    normalizeActorHandle,
    normalizeDraftOrder,
    resolveOrderIdCandidates,
    resolveOrderIdFromRouteValue,
    resolveWalletNetworkLabel,
    readTaskRouteStateFromLocation
  } from '$lib/components/kefine/kefine-workspace-helpers';
  import {
    confirmWorkspaceOrderStep,
    fetchOrderStatus,
    loadWorkspaceOrders,
    persistWorkspaceOrders,
    pollWorkspaceOrder,
    saveWorkspaceOrderDocument,
    submitWorkspaceOrder,
    submitWorkspaceOrderStepComment,
    updateWorkspaceOrderSettings
  } from '$lib/components/kefine/kefine-workspace-orders';
  import { waitForDelay } from '$lib/utils/helpers';
  import type { Profile } from '$lib/types/user';
  import {
    addProfileBonus,
    buildProfilePath,
    ensureProfileForSession,
    getProfileById,
    normalizeProfileUsername,
    readProfileFollows,
    readProfiles,
    updateStoredProfile
  } from '$lib/profile/profile-storage';
  import { buildLocaleHomePath, localizeAppPath, readLocaleFromPathname, stripLocalePrefix } from '$lib/routing/kefine-locale-routing';

  const THEME_STORAGE_KEY = 'kefine-theme';
  const BRAND_HOME_NAVIGATION_STORAGE_KEY = 'kefine-brand-home-navigation';
  const CLONE_DRAFT_STORAGE_KEY = 'kefine-clone-draft-v1';

  let {
    initialActorHandle,
    initialOrderId
  }: {
    initialActorHandle?: string;
    initialOrderId?: string;
  } = $props();
  const localeText = $derived($kefineLocaleText);
  const runtimeConfig = $derived(resolvePublicRuntimeConfig(page.data.publicConfig));
  const activeLocale = $derived(readLocaleFromPathname(page.url.pathname) ?? 'en');

  function getNormalizedInitialOrderId() {
    return initialOrderId?.trim() || null;
  }

  function getNormalizedInitialActorHandle() {
    return initialActorHandle?.trim() ? normalizeActorHandle(initialActorHandle) : null;
  }

  function getRouteActorHandleFallback() {
    return getNormalizedInitialActorHandle() ?? normalizedActorHandle ?? null;
  }

  function applyActorIdentityFallback(
    order: OrderView,
    fallback?: Partial<Pick<OrderView, 'actorHandle' | 'actorDid'>>
  ): OrderView {
    const actorHandle =
      order.actorHandle?.trim() ||
      fallback?.actorHandle?.trim() ||
      getRouteActorHandleFallback() ||
      undefined;

    const actorDid =
      order.actorDid?.trim() ||
      fallback?.actorDid?.trim() ||
      (actorHandle ? `did:key:${normalizeActorHandle(actorHandle)}` : undefined);

    return {
      ...order,
      ...(actorHandle ? { actorHandle: normalizeActorHandle(actorHandle) } : {}),
      ...(actorDid ? { actorDid } : {})
    };
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
 
  function runWhenIdle(task: () => void) {
    if (!browser) {
      return () => {};
    }

    if ('requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        task();
      });

      return () => {
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(task, 160);
    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }

  async function loadAuthRoutes() {
    return import('$lib/auth/routes');
  }

  async function loadAppKitModule() {
    return import('$lib/auth/appkit');
  }

  type LazyComponent = any;
  type PendingCloneAction = {
    order: OrderView;
    runLocally: boolean;
  };

  async function ensureFlowStepComponentsLoaded() {
    if (SubmittingStepComponent && ErrorStepComponent && PaymentStepComponent) {
      return;
    }

    const [submittingModule, errorModule, paymentModule] = await Promise.all([
      import('$lib/components/kefine/KefineSubmittingStep.svelte'),
      import('$lib/components/kefine/KefineErrorStep.svelte'),
      import('$lib/components/kefine/KefinePaymentStep.svelte')
    ]);

    SubmittingStepComponent ??= submittingModule.default;
    ErrorStepComponent ??= errorModule.default;
    PaymentStepComponent ??= paymentModule.default;
  }

  async function ensureDialogComponentsLoaded() {
    if (AuthDialogComponent && PasskeyDialogComponent && PrivateKeyDialogComponent) {
      return;
    }

    const [authModule, passkeyModule, privateKeyModule] = await Promise.all([
      import('$lib/components/kefine/KefineAuthDialog.svelte'),
      import('$lib/components/kefine/KefinePasskeyDialog.svelte'),
      import('$lib/components/kefine/KefinePrivateKeyDialog.svelte')
    ]);

    AuthDialogComponent ??= authModule.default;
    PasskeyDialogComponent ??= passkeyModule.default;
    PrivateKeyDialogComponent ??= privateKeyModule.default;
  }

  let step = $state<FlowStep>(getNormalizedInitialOrderId() ? 'executing' : 'create');
  let draft = $state<DraftOrder>(createEmptyDraft());
  let draftQueued = $state<DraftOrder | null>(null);
  let pendingCloneAction = $state<PendingCloneAction | null>(null);
  let currentOrder = $state<OrderView | null>(
    getNormalizedInitialOrderId()
      ? {
          id: getNormalizedInitialOrderId() as string,
          solver: '',
          status: 'queued',
          title: '',
          description: '',
          createdAt: new Date().toISOString(),
          currency: 'USDC',
          actorHandle: getNormalizedInitialActorHandle() ?? undefined
        }
      : null
  );
  let createdOrders = $state<OrderView[]>([]);
  let leftNavExpanded = $state(false);
  let isSpecialRuntime = $state(false);
  let errorMessage = $state('');

  let themeMode = $state<'light' | 'dark' | 'auto'>('auto');
  let systemPrefersDark = $state(false);
  let selectedAuthMethod = $state<AuthMethod>(null);
  let paymentMethod = $state<PaymentMethod>(null);
  let paymentStage = $state<PaymentStage>('payment-method-select');
  let depositDialogOpen = $state(false);
  let authDialogOpen = $state(false);
  let authButtonLoading = $state(false);
  let confirmStepLoading = $state(false);
  let stepCommentLoadingId = $state<string | null>(null);
  let passkeyDialogOpen = $state(false);
  let privateKeyDialogOpen = $state(false);
  let stagePreviewOpen = $state(false);
  let privateKeyInput = $state('');
  let isHydratingRoute = $state(Boolean(getNormalizedInitialOrderId()));
  let currentProfile = $state<Profile | null>(null);
  let temporaryProfile = $state<Profile | null>(null);
  let craterHealthState = $state<'checking' | 'ok' | 'failed'>('checking');
  let suppressProfileRedirect = $state(false);
  let suppressPostAuthProfileRedirect = $state(false);
  let resultDocumentRefreshKey = $state('');
  const activePollTokens = new Map<string, symbol>();
  let pollAbortController = $state<AbortController | null>(null);
  let SubmittingStepComponent = $state<LazyComponent | null>(null);
  let ErrorStepComponent = $state<LazyComponent | null>(null);
  let PaymentStepComponent = $state<LazyComponent | null>(null);
  let AuthDialogComponent = $state<LazyComponent | null>(null);
  let PasskeyDialogComponent = $state<LazyComponent | null>(null);
  let PrivateKeyDialogComponent = $state<LazyComponent | null>(null);

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
  const normalizedActorHandle = $derived.by(() => {
    const handle = authState.handle?.trim();
    return handle ? normalizeActorHandle(handle) : null;
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
  const profileNeedsSetup = $derived(currentProfile?.metadata?.['profileSetupCompleted'] !== true);
  const ORDER_PAGE_SIZE = 12;
  let visibleOrdersLimit = $state(ORDER_PAGE_SIZE);
  const visibleOrders = $derived(createdOrders.slice(0, visibleOrdersLimit));
  const hasMoreOrders = $derived(visibleOrdersLimit < createdOrders.length);
  const resolvedTheme = $derived(themeMode === 'auto' ? (systemPrefersDark ? 'dark' : 'light') : themeMode);
  const isDarkTheme = $derived(resolvedTheme === 'dark');
  const topbarThemeActionLabel = $derived(themeMode === 'auto' ? localeText.topbar.theme.auto : isDarkTheme ? localeText.topbar.theme.dark : localeText.topbar.theme.light);
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
  const pinnedCreateServices = $derived.by(() => []);
  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: runtimeConfig.app.socialLinks.mastodon,
      icon: 'mastodon' as const
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: runtimeConfig.app.socialLinks.discord,
      icon: 'discord' as const
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: runtimeConfig.app.socialLinks.linkedin,
      icon: 'linkedin' as const
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: runtimeConfig.app.socialLinks.telegram,
      icon: 'telegram' as const
    },
    {
      id: 'github' as const,
      label: localeText.topbar.githubLabel,
      href: runtimeConfig.app.socialLinks.github,
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
  const remainingAmount = $derived(currentOrder?.estimatedCost ?? 0);
  const executionPresentation = $derived(
    deriveExecutionPresentation(currentOrder, localeText, selectedAuthMethod, step === 'payment')
  );
  const resultSurface = $derived<ResultSurface>(
    deriveResultSurface(
      currentOrder,
      localeText,
      currentOrder?.paymentUrl ?? `/api/pay/${currentOrder?.id ?? ''}`
    )
  );
  const browserTitle = $derived.by(() => {
    const title = currentOrder?.title?.trim();
    const isTaskRoute =
      getNormalizedInitialOrderId() !== null ||
      (browser &&
        (/^\/task\//.test(stripLocalePrefix(window.location.pathname).replace(/\/+$/, '')) ||
          /^\/@[^/]+\/order\/[^/]+/.test(stripLocalePrefix(window.location.pathname).replace(/\/+$/, ''))));

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
    currentProfile && browser ? `${window.location.origin}${localizeAppPath(buildProfilePath(currentProfile.primaryHandle), activeLocale)}` : ''
  );
  const canSaveCurrentOrderLocally = $derived(
    Boolean(
      currentOrder &&
        currentProfile &&
        currentOrder.isPublicTask === true &&
        currentOrder.ownerProfileId &&
        currentOrder.ownerProfileId !== currentProfile.id
    )
  );
  const canManageCurrentOrder = $derived(
    Boolean(currentOrder && currentProfile && currentOrder.ownerProfileId === currentProfile.id)
  );
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

  function isGeneratedProfile(profile: Profile | null): profile is Profile {
    return Boolean(
      profile &&
        profile.primaryHandleType === 'publickey' &&
        profile.email?.trim().toLowerCase().endsWith('@local.invalid')
    );
  }

  function getGeneratedProfileHandle(profile: Profile): string {
    const emailSource = profile.email?.split('@')[0]?.trim().toLowerCase() || '';
    const emailHandle =
      emailSource.startsWith('portable+') || emailSource.startsWith('portable-')
        ? emailSource.slice('portable+'.length)
        : '';
    const fallbackHandle = profile.userId?.trim() || profile.primaryHandle;
    return normalizeProfileUsername(emailHandle || fallbackHandle);
  }

  function normalizeGeneratedProfile(profile: Profile): Profile {
    const nextHandle = getGeneratedProfileHandle(profile);
    if (nextHandle === profile.primaryHandle && nextHandle === profile.username) {
      return profile;
    }

    const updated =
      updateStoredProfile(localStorage, profile.id, (current) => ({
        ...current,
        username: nextHandle,
        primaryHandle: nextHandle,
        displayName: current.displayName?.startsWith('@') ? `@${nextHandle}` : current.displayName
      })) ?? profile;

    createdOrders = createdOrders.map((order) =>
      order.ownerProfileId === updated.id
        ? {
            ...order,
            ownerUsername: nextHandle
          }
        : order
    );

    if (currentOrder?.ownerProfileId === updated.id) {
      currentOrder = {
        ...currentOrder,
        ownerUsername: nextHandle
      };
    }

    persistOrders();
    return updated;
  }

  function resolveAuthProfileMatch(args: {
    userId: string;
    email?: string | null;
    walletAddress?: string | null;
    excludeProfileId?: string | null;
  }): Profile | null {
    const normalizedEmail = args.email?.trim().toLowerCase() || null;
    const normalizedWalletAddress = args.walletAddress?.trim().toLowerCase() || null;

    return (
      readProfiles(localStorage).find((profile) => {
        if (args.excludeProfileId && profile.id === args.excludeProfileId) {
          return false;
        }

        return (
          profile.userId === args.userId ||
          (normalizedEmail && profile.email?.trim().toLowerCase() === normalizedEmail) ||
          (normalizedWalletAddress && profile.walletAddress?.trim().toLowerCase() === normalizedWalletAddress)
        );
      }) ?? null
    );
  }

  function reassignOrdersToProfile(fromProfileId: string, nextProfile: Profile) {
    let didChange = false;

    createdOrders = createdOrders.map((order) => {
      if (order.ownerProfileId !== fromProfileId) {
        return order;
      }

      didChange = true;
      return applyActorIdentityFallback(
        {
          ...order,
          ownerProfileId: nextProfile.id,
          ownerUsername: nextProfile.primaryHandle,
          ownerDisplayName: nextProfile.displayName
        },
        nextProfile.primaryHandleType === 'publickey'
          ? {
              actorHandle: nextProfile.primaryHandle,
              actorDid: `did:key:${nextProfile.primaryHandle}`
            }
          : undefined
      );
    });

    if (currentOrder?.ownerProfileId === fromProfileId) {
      currentOrder = applyActorIdentityFallback(
        {
          ...currentOrder,
          ownerProfileId: nextProfile.id,
          ownerUsername: nextProfile.primaryHandle,
          ownerDisplayName: nextProfile.displayName
        },
        nextProfile.primaryHandleType === 'publickey'
          ? {
              actorHandle: nextProfile.primaryHandle,
              actorDid: `did:key:${nextProfile.primaryHandle}`
            }
          : undefined
      );
      didChange = true;
    }

    if (didChange) {
      persistOrders();
    }
  }

  async function ensureTemporaryOrderProfile(options?: { createIfMissing?: boolean }) {
    if (!browser) {
      return null;
    }

    if (temporaryProfile) {
      return temporaryProfile;
    }

    let publicKey = loadGeneratedPublicKeyCookie();
    if (!publicKey && options?.createIfMissing === false) {
      return null;
    }

    if (!publicKey) {
      const { generatePortableActorKeyPair } = await loadAuthRoutes();
      const generated = await generatePortableActorKeyPair();
      publicKey = generated.publicKey;
      saveGeneratedPublicKeyCookie(generated.publicKey);
      saveGeneratedPrivateKeyCookie(generated.privateKey);
    }

    const nextTemporaryProfile = ensureProfileForSession({
      storage: localStorage,
      userId: publicKey,
      email: `portable+${publicKey.slice(0, 24)}@local.invalid`,
      displayName: `@${publicKey.slice(0, 16)}`,
      authType: 'publickey'
    });

    const normalizedProfile = isGeneratedProfile(nextTemporaryProfile)
      ? normalizeGeneratedProfile(nextTemporaryProfile)
      : nextTemporaryProfile;

    temporaryProfile = normalizedProfile;
    return normalizedProfile;
  }

  onMount(() => {
    if (!browser) return;
    void checkCraterHealth();
    hydrateAuthStateFromSession();
    loadPasskeySession();
    loadCreatedOrders();
    isSpecialRuntime = isSpecialRuntimeOrigin(window.location.origin);
    void ensureTemporaryOrderProfile({ createIfMissing: false });

    if (!authState.isConnected) {
      void (async () => {
        try {
          const { restoreGeneratedPortableActor } = await loadAuthRoutes();
          const restored = await restoreGeneratedPortableActor();
          if (!restored) {
            return;
          }

          updateAuthState({
            isConnected: true,
            address: null,
            chainId: null,
            email: restored.email,
            userId: restored.userId,
            handle: normalizeActorHandle(restored.handle || restored.publickey.key),
            displayName: restored.displayName,
            authType: 'publickey',
            status: 'connected'
          });
        } catch (error) {
          console.error('[publickey] restoreGeneratedPortableActor', error);
        }
      })();
    }

    const routeState = readTaskRouteState();
    const routeOrderId = routeState?.orderId || getNormalizedInitialOrderId();
    if (routeOrderId) {
      isHydratingRoute = true;
      void openOrderById(routeOrderId, routeState?.view ?? null);
    } else {
      restoreCloneDraftPrefill();
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemPrefersDark = mediaQuery.matches;

    const handleThemePreferenceChange = (event: MediaQueryListEvent) => {
      systemPrefersDark = event.matches;
    };

    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    themeMode = storedTheme === 'dark' || storedTheme === 'light' || storedTheme === 'auto' ? storedTheme : 'auto';
    document.documentElement.setAttribute('data-kefine-theme', resolvedTheme);
    document.documentElement.setAttribute('lang', $kefineLocale);
    mediaQuery.addEventListener('change', handleThemePreferenceChange);

    const syncReownAuthState = async () => {
      const { readReownAccountState } = await loadAppKitModule();
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

    let cancelReownSubscription: (() => void) | void;
    const cancelIdleReownSetup = runWhenIdle(() => {
      void syncReownAuthState();
      void loadAppKitModule()
        .then(({ subscribeToAppKitAccount }) =>
          subscribeToAppKitAccount(() => {
            void syncReownAuthState();
          })
        )
        .then((result) => {
          cancelReownSubscription = result;
        })
        .catch(() => {
          cancelReownSubscription = undefined;
        });
    });

    return () => {
      cancelIdleReownSetup();
      mediaQuery.removeEventListener('change', handleThemePreferenceChange);
      cancelReownSubscription?.();
      pollAbortController?.abort();
      activePollTokens.clear();
    };
  });

  $effect(() => {
    if (browser) {
      document.documentElement.setAttribute('data-kefine-theme', resolvedTheme);
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
      document.documentElement.setAttribute('lang', $kefineLocale);
      void loadAppKitModule()
        .then(({ syncAppKitTheme }) => syncAppKitTheme(resolvedTheme))
        .catch(() => undefined);
    }
  });

  $effect(() => {
    if (step === 'submitting' || step === 'error' || step === 'executing' || step === 'payment') {
      void ensureFlowStepComponentsLoaded();
    }
  });

  $effect(() => {
    if (authDialogOpen || passkeyDialogOpen || privateKeyDialogOpen) {
      void ensureDialogComponentsLoaded();
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

    if (temporaryProfile) {
      currentProfile = temporaryProfile;
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
    if (!browser || !isAuthenticated || (!draftQueued && !pendingCloneAction) || !currentProfile) {
      return;
    }

    void continueAfterAuth();
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
    if (step === 'executing' && currentOrder?.uiScenario === 'vpn-service' && !stagePreviewOpen && (walletReady || privateKeyReady || passkeyReady)) {
      return;
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
    if (!currentOrder || step !== 'payment' || paymentStage !== 'result-ready') {
      return;
    }

    if (currentOrder.uiScenario !== 'vpn-service' || currentOrder.resultDocument) {
      return;
    }

    const nextRefreshKey = `${currentOrder.id}|${currentOrder.status}|${currentOrder.createdAt}|${paymentStage}`;
    if (resultDocumentRefreshKey === nextRefreshKey) {
      return;
    }

    resultDocumentRefreshKey = nextRefreshKey;

    void (async () => {
      const updated = await requestOrderFromStatus(currentOrder.id, {
        title: currentOrder.title,
        description: currentOrder.description,
        currency: currentOrder.currency || localeText.defaults.defaultCurrency,
        createdAt: currentOrder.createdAt
      });

      if (!updated) {
        return;
      }

      const nextOrder = {
        ...currentOrder,
        ...updated,
        id: currentOrder.id
      };

      const nextOrderWithActor = applyActorIdentityFallback(nextOrder, currentOrder);
      currentOrder = nextOrderWithActor;
      upsertOrder(nextOrderWithActor);
    })();
  });

  $effect(() => {
    if (!currentOrder || step !== 'executing' || stagePreviewOpen) {
      return;
    }

    const normalizedStatus = currentOrder.status.trim().toLowerCase();
    if ((normalizedStatus === 'completed' || normalizedStatus === 'done') && currentOrder.uiScenario === 'vpn-service') {
      paymentStage = 'result-ready';
      step = 'payment';
    }
  });

  $effect(() => {
    if (!browser) return;
    if (isHydratingRoute) return;

    const nextUrl = new URL(window.location.href);
    const orderRouteId =
      (step === 'executing' || step === 'payment') && currentOrder?.id
        ? currentOrder.shareId?.trim() || currentOrder.id
        : null;
    const actorHandle =
      currentOrder?.actorHandle?.trim() ||
      getRouteActorHandleFallback();

    if (orderRouteId && actorHandle) {
      nextUrl.pathname = localizeAppPath(buildActorOrderPath(actorHandle, orderRouteId), activeLocale);
      nextUrl.search = '';
      nextUrl.hash =
        step === 'payment' && paymentStage === 'result-ready'
          ? '#result'
          : step === 'executing' && stagePreviewOpen
            ? '#stages'
            : '';

      if (window.location.href !== nextUrl.toString()) {
        replaceState(nextUrl, page.state);
      }
      return;
    }

    if (stripLocalePrefix(page.url.pathname) !== '/') {
      suppressProfileRedirect = false;
      sessionStorage.removeItem(BRAND_HOME_NAVIGATION_STORAGE_KEY);
    }

    nextUrl.pathname = buildLocaleHomePath(activeLocale);
    nextUrl.search = '';
    nextUrl.hash = '';

    if (window.location.href !== nextUrl.toString()) {
      replaceState(nextUrl, page.state);
    }
  });

  function resetTransactionState() {
    selectedAuthMethod = null;
    paymentMethod = null;
    paymentStage = 'payment-method-select';
    depositDialogOpen = false;
    stagePreviewOpen = false;
    suppressPostAuthProfileRedirect = false;
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
      const { performAuthentication, finishAuthentication } = await loadAuthRoutes();
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
    authButtonLoading = false;
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
    void goto(buildLocaleHomePath(activeLocale), { replaceState: true });
  }

  async function selectTopbarAuth() {
    if (isAuthenticated) {
      return;
    }

    authButtonLoading = true;
    await ensureDialogComponentsLoaded();
    authDialogOpen = true;
    await tick();
    authButtonLoading = false;
  }

  async function openTopbarProfile() {
    if (!currentProfile) {
      return;
    }

    await goto(localizeAppPath(buildProfilePath(currentProfile.primaryHandle), activeLocale));
  }

  async function openTopbarProfileSetup() {
    if (!isAuthenticated) {
      await selectTopbarAuth();
      return;
    }

    if (!currentProfile || !profileNeedsSetup) {
      return;
    }

    await goto(localizeAppPath(buildProfilePath(currentProfile.primaryHandle), activeLocale));
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

    const existingProfile = resolveAuthProfileMatch(args);

    if (isGeneratedProfile(temporaryProfile)) {
      let ensuredProfile = temporaryProfile;

      if (existingProfile && existingProfile.id !== temporaryProfile.id) {
        reassignOrdersToProfile(temporaryProfile.id, existingProfile);
        ensuredProfile = existingProfile;
        temporaryProfile = null;
      } else {
        const promotedProfile =
          updateStoredProfile(localStorage, temporaryProfile.id, (profile) => ({
            ...profile,
            email: args.email?.trim() || profile.email,
            displayName: args.displayName?.trim() || profile.displayName,
            avatarUrl: walletAvatarUrl || profile.avatarUrl,
            walletAddress: args.walletAddress?.trim().toLowerCase() || profile.walletAddress,
            walletAlias: args.walletAlias?.trim() || profile.walletAlias
          })) ?? temporaryProfile;

        ensuredProfile = promotedProfile;
        temporaryProfile = promotedProfile;
      }

      currentProfile = ensuredProfile;
      const shouldOpenProfile =
        args.force === true ||
        !existingProfile ||
        ensuredProfile.metadata?.['profileSetupCompleted'] !== true;

      if (shouldOpenProfile && !draftQueued && !pendingCloneAction && !currentOrder && !suppressPostAuthProfileRedirect) {
        await goto(localizeAppPath(buildProfilePath(ensuredProfile.primaryHandle), activeLocale));
      }
      return;
    }

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

    if (shouldOpenProfile && !draftQueued && !pendingCloneAction && !currentOrder && !suppressPostAuthProfileRedirect) {
      await goto(localizeAppPath(buildProfilePath(ensuredProfile.primaryHandle), activeLocale));
    }
  }

  async function signOutProfileSession() {
    try {
      const { disconnectAppKit } = await loadAppKitModule();
      await disconnectAppKit();
    } catch {
      // AppKit might not be initialized for passkey-only sessions.
    }

    clearAuthState();
    clearPasskeySession();
    selectedAuthMethod = null;
    paymentMethod = null;
    authDialogOpen = false;
    passkeyDialogOpen = false;
    privateKeyDialogOpen = false;
    currentProfile = null;
    pendingCloneAction = null;
  }

  function selectTopbarLocale(locale: KefineLocale) {
    setKefineLocale(locale);
    void goto(buildLocaleHomePath(locale));
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

  function resumeOrder(order: OrderView) {
    const resumedOrder: OrderView = {
      ...order,
      status: 'queued'
    };

    upsertOrder(resumedOrder);

    if (currentOrder?.id === order.id) {
      currentOrder = resumedOrder;
    }

    startOrderPolling(resumedOrder);
  }

  function readTaskRouteState() {
    if (!browser) return null;
    return readTaskRouteStateFromLocation(window.location);
  }

  function showOrderFlow(order: OrderView, preferredView: 'result' | 'stages' | null = null) {
    currentOrder = order;
    resetTransactionState();

    if (order.status === 'completed' && order.uiScenario === 'vpn-service') {
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
            const nextOrderWithActor = applyActorIdentityFallback(nextOrder, currentOrder ?? local);
            currentOrder = nextOrderWithActor;
            upsertOrder(nextOrderWithActor);
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
          const nextRemote = applyActorIdentityFallback({
            ...remote,
            actorHandle: remote.actorHandle || getRouteActorHandleFallback() || undefined
          });
          upsertOrder(nextRemote);
          showOrderFlow(nextRemote, preferredView);
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

  function downloadCloneFile(order: OrderView, format: TaskCloneFormat) {
    if (!browser) {
      return;
    }

    const file = buildTaskCloneFile(order, format);
    const href = URL.createObjectURL(new Blob([file.content], { type: file.mimeType }));
    const anchor = document.createElement('a');
    anchor.href = href;
    anchor.download = file.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  function saveCloneDraftPrefill(nextDraft: DraftOrder) {
    if (!browser) {
      return;
    }

    sessionStorage.setItem(CLONE_DRAFT_STORAGE_KEY, JSON.stringify(nextDraft));
  }

  function restoreCloneDraftPrefill() {
    if (!browser) {
      return false;
    }

    const raw = sessionStorage.getItem(CLONE_DRAFT_STORAGE_KEY);
    if (!raw) {
      return false;
    }

    sessionStorage.removeItem(CLONE_DRAFT_STORAGE_KEY);

    try {
      const parsed = JSON.parse(raw) as Partial<DraftOrder> | null;
      if (!parsed || typeof parsed !== 'object') {
        return false;
      }

      draft = {
        ...createEmptyDraft(),
        ...(typeof parsed.taskIcon === 'string' && parsed.taskIcon.trim() ? { taskIcon: parsed.taskIcon.trim() } : {}),
        title: typeof parsed.title === 'string' ? parsed.title : '',
        description: typeof parsed.description === 'string' ? parsed.description : '',
        tags: Array.isArray(parsed.tags) ? parsed.tags.filter((item): item is string => typeof item === 'string') : [],
        estimatedCost: typeof parsed.estimatedCost === 'string' ? parsed.estimatedCost : '',
        currency: typeof parsed.currency === 'string' ? parsed.currency : 'USD',
        executionEstimate: typeof parsed.executionEstimate === 'string' ? parsed.executionEstimate : ''
      };
      return true;
    } catch {
      return false;
    }
  }

  async function saveForeignTaskLocally(order: OrderView, runLocally: boolean) {
    const nextDraft = normalizeDraftOrder(cloneOrderToDraft(order), localeText);

    if (runLocally) {
      await createOrder(nextDraft, { background: true, focusInQueue: true });
      return;
    }

    saveCloneDraftPrefill(nextDraft);
    draft = nextDraft;
    draftQueued = null;
    currentOrder = null;
    pendingCloneAction = null;
    resetTransactionState();
    step = 'create';
    await goto(buildLocaleHomePath(activeLocale));
  }

  async function handleExportClone(format: TaskCloneFormat) {
    if (!currentOrder) {
      return;
    }

    downloadCloneFile(currentOrder, format);
  }

  async function handleSaveCloneLocally(runLocally: boolean) {
    if (!currentOrder) {
      return;
    }

    if (!isAuthenticated) {
      pendingCloneAction = {
        order: currentOrder,
        runLocally
      };
      suppressPostAuthProfileRedirect = true;
      await selectTopbarAuth();
      return;
    }

    await saveForeignTaskLocally(currentOrder, runLocally);
  }

  function loadMoreOrders() {
    if (!hasMoreOrders) {
      return;
    }

    visibleOrdersLimit = Math.min(visibleOrdersLimit + ORDER_PAGE_SIZE, createdOrders.length);
  }

  function orderApiBaseUrl(): string {
    return resolveOrderProxyBasePath();
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

  async function checkCraterHealth() {
    if (!browser) {
      return;
    }

    craterHealthState = 'checking';

    try {
      const response = await fetch('/api/health', {
        headers: {
          Accept: 'application/json'
        }
      });

      craterHealthState = response.ok ? 'ok' : 'failed';
    } catch {
      craterHealthState = 'failed';
    }
  }

  async function confirmCurrentExecutionStep() {
    if (!currentOrder || confirmStepLoading) {
      return;
    }

    const currentStep = executionPresentation.activeStep;
    if (!currentStep?.confirmation?.required || currentStep.confirmation.confirmed === true) {
      return;
    }

    confirmStepLoading = true;

    try {
      const confirmed = await confirmWorkspaceOrderStep({
        orderId: currentOrder.id,
        stepId: currentStep.id,
        fetchFn: fetch,
        orderApiBaseUrl: orderApiBaseUrl()
      });

      if (!confirmed) {
        return;
      }

      const updated = await requestOrderFromStatus(currentOrder.id, {
        title: currentOrder.title,
        description: currentOrder.description,
        currency: currentOrder.currency || localeText.defaults.defaultCurrency,
        createdAt: currentOrder.createdAt
      });

      if (!updated) {
        return;
      }

      const nextOrderWithActor = applyActorIdentityFallback(
        {
          ...currentOrder,
          ...updated,
          id: currentOrder.id
        },
        currentOrder
      );
      currentOrder = nextOrderWithActor;
      upsertOrder(nextOrderWithActor);
    } finally {
      confirmStepLoading = false;
    }
  }

  async function submitStepComment(stepId: string, content: string) {
    if (!currentOrder || !stepId.trim() || !content.trim() || stepCommentLoadingId) {
      return;
    }

    stepCommentLoadingId = stepId;

    try {
      const posted = await submitWorkspaceOrderStepComment({
        orderId: currentOrder.id,
        stepId,
        content,
        fetchFn: fetch,
        orderApiBaseUrl: orderApiBaseUrl()
      });

      if (!posted) {
        return;
      }

      const updated = await requestOrderFromStatus(currentOrder.id, {
        title: currentOrder.title,
        description: currentOrder.description,
        currency: currentOrder.currency || localeText.defaults.defaultCurrency,
        createdAt: currentOrder.createdAt
      });

      if (!updated) {
        return;
      }

      const nextOrderWithActor = applyActorIdentityFallback(
        {
          ...currentOrder,
          ...updated,
          id: currentOrder.id
        },
        currentOrder
      );
      currentOrder = nextOrderWithActor;
      upsertOrder(nextOrderWithActor);
    } finally {
      stepCommentLoadingId = null;
    }
  }

  async function saveCurrentOrderDocument(content: string) {
    if (!currentOrder) {
      return;
    }

    const updated = await saveWorkspaceOrderDocument({
      orderId: currentOrder.id,
      content,
      fetchFn: fetch,
      orderApiBaseUrl: orderApiBaseUrl(),
      localeText
    });

    if (!updated) {
      return;
    }

    const nextOrderWithActor = applyActorIdentityFallback(
      {
        ...currentOrder,
        ...updated,
        id: currentOrder.id
      },
      currentOrder
    );
    currentOrder = nextOrderWithActor;
    upsertOrder(nextOrderWithActor);
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

  async function createOrder(payload: DraftOrder, options?: { background?: boolean; focusInQueue?: boolean }) {
    const isBackground = options?.background === true;
    const focusInQueue = options?.focusInQueue === true;
    let optimisticOrderId: string | null = null;
    if (!isBackground || focusInQueue) {
      optimisticOrderId = `local-${crypto.randomUUID()}`;
      currentOrder = applyActorIdentityFallback({
        id: optimisticOrderId,
        ...(payload.taskIcon?.trim() ? { taskIcon: payload.taskIcon.trim() } : {}),
        title: payload.title || payload.description || localeText.defaults.taskTitle,
        description: payload.description,
        status: 'queued',
        solver: '',
        currency: payload.currency || localeText.defaults.defaultCurrency,
        createdAt: new Date().toISOString(),
        labels: payload.tags,
        templatePromptTemplate: payload.templatePromptTemplate,
        templateVariables: payload.templateVariables,
        templateVariableValues: payload.templateVariableValues,
        document: {
          format: 'markdown',
          content: payload.description || payload.title || localeText.defaults.taskTitle
        }
      });
      resetTransactionState();
      step = 'executing';
    }

    let tempOrderId: string | undefined;
    if (isBackground && !focusInQueue) {
      tempOrderId = `temp-${crypto.randomUUID()}`;
      const tempOrder: OrderView = {
        id: tempOrderId,
        ...(payload.taskIcon?.trim() ? { taskIcon: payload.taskIcon.trim() } : {}),
        title: payload.title || payload.description,
        description: payload.description,
        status: 'queued',
        solver: localeText.labels?.solver ?? '',
        currency: payload.currency || 'USDC',
        createdAt: new Date().toISOString(),
        labels: payload.tags,
        templatePromptTemplate: payload.templatePromptTemplate,
        templateVariables: payload.templateVariables,
        templateVariableValues: payload.templateVariableValues
      };
      upsertOrder(tempOrder);
    }

    const result = await submitWorkspaceOrder({
      payload,
      owner: {
        ownerProfileId: currentProfile?.id,
        ownerUsername: currentProfile?.primaryHandle,
        ownerDisplayName: currentProfile?.displayName,
        actorHandle:
          authState.authType === 'publickey' && normalizedActorHandle
            ? normalizedActorHandle
            : currentProfile?.primaryHandleType === 'publickey'
              ? currentProfile.primaryHandle
              : undefined,
        actorDid:
          authState.authType === 'publickey' && normalizedActorHandle
            ? `did:key:${normalizedActorHandle}`
            : currentProfile?.primaryHandleType === 'publickey'
              ? `did:key:${currentProfile.primaryHandle}`
              : undefined
      },
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
      if (!isBackground || focusInQueue) {
        currentOrder = null;
        errorMessage = result.message || localeText.errors.fallback;
        step = 'error';
      }
      return false;
    }

    const orderOwnerProfile = currentProfile ?? (await ensureTemporaryOrderProfile({ createIfMissing: true }));
    const orderOwnerActorHandle =
      authState.authType === 'publickey' && normalizedActorHandle
        ? normalizedActorHandle
        : orderOwnerProfile?.primaryHandleType === 'publickey'
          ? orderOwnerProfile.primaryHandle
          : null;
    const ownerOrder = {
      ...result.order,
      ...(result.order.taskIcon?.trim()
        ? { taskIcon: result.order.taskIcon.trim() }
        : payload.taskIcon?.trim()
          ? { taskIcon: payload.taskIcon.trim() }
          : {}),
      document: result.order.document ?? {
        format: 'markdown' as const,
        content: payload.description || payload.title || localeText.defaults.taskTitle
      },
      ...(orderOwnerActorHandle
        ? {
            actorHandle: orderOwnerActorHandle,
            actorDid: `did:key:${orderOwnerActorHandle}`
          }
        : {}),
      ...(orderOwnerProfile
        ? {
            ownerProfileId: orderOwnerProfile.id,
            ownerUsername: orderOwnerProfile.primaryHandle,
            ownerDisplayName: orderOwnerProfile.displayName,
            shareId: result.order.shareId || result.order.id,
            isClosedCompleted: result.order.status === 'completed' || result.order.status === 'done',
            isPublicTask: false,
            accessRules: {
              view: { enabled: false, priceUsd: 0 },
              watch: { enabled: false, priceUsd: 0 },
              join: { enabled: false, priceUsd: 0 }
            }
          }
        : {})
    };

    const ownerOrderWithActor = applyActorIdentityFallback(ownerOrder);

    upsertOrder(ownerOrderWithActor);
    startOrderPolling(ownerOrderWithActor);

    if (optimisticOrderId) {
      createdOrders = createdOrders.filter((order) => order.id !== optimisticOrderId);
      persistOrders();
    }

    if (browser && orderOwnerProfile) {
      const follow = readProfileFollows(localStorage).find((item) => item.followerProfileId === orderOwnerProfile.id);
      if (follow) {
        const targetProfile = getProfileById(localStorage, follow.targetProfileId);
        const amount = Number((((ownerOrderWithActor.estimatedCost ?? 0) * (targetProfile?.referralPercent ?? 0)) / 100).toFixed(2));
        if (targetProfile && amount > 0) {
          addProfileBonus({
            storage: localStorage,
            profileId: targetProfile.id,
            amountUsd: amount,
            source: 'follower-task',
            note: `Referral credit from task ${ownerOrderWithActor.title}`,
            orderId: ownerOrderWithActor.id
          });
        }
      }
    }

    if (!isBackground || focusInQueue) {
      currentOrder = ownerOrderWithActor;
      step = 'executing';
    }

    return true;
  }

  async function submitDraft(form: DraftOrder, options?: { background?: boolean; focusInQueue?: boolean }) {
    const normalized = normalizeDraftOrder(form, localeText);
    const created = await createOrder(normalized, options);

    if (created && options?.background) {
      draft = createEmptyDraft();
    }
  }

  async function continueAfterAuth() {
    if (!isAuthenticated) return;

    if (draftQueued) {
      const queued = draftQueued;
      draftQueued = null;
      await createOrder(queued);
      return;
    }

    if (pendingCloneAction) {
      const queuedClone = pendingCloneAction;
      pendingCloneAction = null;
      await saveForeignTaskLocally(queuedClone.order, queuedClone.runLocally);
    }
  }

  function handleSubmit() {
    void submitDraft(draft, { background: true, focusInQueue: true });
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
    draft.templateVariableValues = {
      ...draft.templateVariableValues,
      [key]: value
    };
  }

  function updateTags(tags: string[]) {
    draft.tags = tags;
  }

  function updateExecutionEstimate(value: string) {
    draft.executionEstimate = value;
  }

  function handleStopOrder(order: OrderView, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    stopOrder(order);
  }

  function handleDeleteOrder(order: OrderView, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    activePollTokens.delete(order.id);
    createdOrders = createdOrders.filter((item) => item.id !== order.id);
    visibleOrdersLimit = getVisibleOrdersLimit(createdOrders.length, visibleOrdersLimit, ORDER_PAGE_SIZE);
    persistOrders();

    if (currentOrder?.id === order.id) {
      newOrder();
    }
  }

  function newOrder() {
    draft = createEmptyDraft();
    draftQueued = null;
    pendingCloneAction = null;
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
    patch: Partial<Pick<OrderView, 'shareId' | 'isPublicTask' | 'accessRules' | 'vcsEnabled' | 'repository' | 'projectId'>>
  ) {
    createdOrders = createdOrders.map((order) => (order.id === orderId ? { ...order, ...patch } : order));
    if (currentOrder?.id === orderId) {
      currentOrder = { ...currentOrder, ...patch };
    }
    persistOrders();
  }

  async function handleUpdateTaskSettings(
    patch: Partial<Pick<OrderView, 'shareId' | 'isPublicTask' | 'vcsEnabled' | 'repository'>> & { gitSettings?: import('./kefine-workflow').RepositoryGitSettings }
  ) {
    if (!currentOrder) {
      return;
    }

    updateProfileTask(currentOrder.id, patch);

    if (patch.vcsEnabled === undefined && !patch.gitSettings) {
      return;
    }

    const updated = await updateWorkspaceOrderSettings({
      orderId: currentOrder.id,
      vcsEnabled: patch.vcsEnabled,
      gitSettings: patch.gitSettings,
      fetchFn: fetch,
      orderApiBaseUrl: orderApiBaseUrl(),
      localeText
    });

    if (!updated) {
      return;
    }

    const nextOrderWithActor = applyActorIdentityFallback(
      {
        ...currentOrder,
        ...updated,
        id: currentOrder.id
      },
      currentOrder
    );
    currentOrder = nextOrderWithActor;
    upsertOrder(nextOrderWithActor);
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

    if (draftQueued || pendingCloneAction) {
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

    suppressPostAuthProfileRedirect = false;
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
      const { loginWithPrivateKey } = await loadAuthRoutes();
      const privateKeySession = await loginWithPrivateKey(privateKeyInput);

      updateAuthState({
        isConnected: true,
        address: null,
        chainId: null,
        email: privateKeySession.email,
        userId: privateKeySession.userId,
        handle: normalizeActorHandle(privateKeySession.handle),
        displayName: privateKeySession.displayName,
        authType: 'publickey',
        status: 'connected'
      });

      if (draftQueued || pendingCloneAction) {
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

      privateKeyInput = '';
    } catch (error) {
      console.error('[publickey] choosePrivateKeyMethod', error);
      errorMessage = error instanceof Error ? error.message : localeText.errors.fallback;
      step = 'error';
    }
  }

  async function chooseGeneratedPrivateKeyMethod() {
    privateKeyDialogOpen = false;
    selectedAuthMethod = 'publickey';
    paymentMethod = 'other';

    try {
      const { loginWithGeneratedPortableActor } = await loadAuthRoutes();
      const generatedSession = await loginWithGeneratedPortableActor();

      updateAuthState({
        isConnected: true,
        address: null,
        chainId: null,
        email: generatedSession.email,
        userId: generatedSession.userId,
        handle: normalizeActorHandle(generatedSession.handle || generatedSession.publickey.key),
        displayName: generatedSession.displayName,
        authType: 'publickey',
        status: 'connected'
      });

      if (draftQueued || pendingCloneAction) {
        void continueAfterAuth();
        return;
      }

    } catch (error) {
      console.error('[publickey] chooseGeneratedPrivateKeyMethod', error);
      errorMessage = error instanceof Error ? error.message : localeText.errors.fallback;
      step = 'error';
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
    suppressPostAuthProfileRedirect = true;
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

<kefine-shell data-sidebar-expanded={leftNavExpanded}>
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
    authenticatedAvatarUrl={authState.isConnected ? walletAvatarUrl : null}
    authMenuLabel={localeText.profile.title}
    openProfileLabel={profileNeedsSetup ? localeText.profile.onboardingTitle : localeText.profile.title}
    signOutLabel={localeText.profile.signOut}
    isAuthenticated={isAuthenticated}
    isAuthLoading={authButtonLoading}
    isDarkTheme={isDarkTheme}
    isExpanded={leftNavExpanded}
    locale={$kefineLocale}
    languageEnglishLabel={localeText.topbar.languageEnglish}
    languageRussianLabel={localeText.topbar.languageRussian}
    languageArmenianLabel={localeText.topbar.languageArmenian}
    socialLinks={sidebarSocialLinks}
    showSocialLinks={false}
    legalLinks={sidebarLegalLinks}
    onExpandedChange={(expanded) => { leftNavExpanded = expanded; }}
    onBrandClick={handleTopbarBrandClick}
    onOpenEmailDialog={() => {
      if (browser) {
        window.location.assign(localizeAppPath(`/@${runtimeConfig.defaultActor.handle}`, activeLocale));
      }
    }}
    onThemeChange={(theme) => { themeMode = theme; }}
    onAuth={selectTopbarAuth}
    onOpenProfile={openTopbarProfile}
    onSignOut={() => { void signOutProfileSession(); }}
    onAuthDoubleClick={() => { void openTopbarProfileSetup(); }}
    onLocale={selectTopbarLocale}
  />

  <main>
  <kefine-layout data-mode={layoutMode} data-step={step}>
    {#if craterHealthState === 'failed'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <article class="kefine-card kefine-card--wide kefine-template-unavailable">
          <h2>{localeText.errors.backendUnavailableTitle}</h2>
          <p>{localeText.errors.backendUnavailableDetail}</p>
        </article>
      </kefine-screen>
    {:else if step === 'create'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefineCreateStep
          draft={draft}
          template={null}
          serviceSetup={null}
          title={localeText.create.title}
          subtitle={localeText.create.subtitle}
          pinnedServices={pinnedCreateServices}
          pinnedServicesTitle={localeText.profile.templates}
          pinnedServicesSubtitle={localeText.create.pinnedServicesSubtitle}
          afe={{
            title: localeText.afe.title,
            labels: localeText.afe.labels,
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
          addDescriptionLabel={localeText.create.addDescription}
          addExecutionEstimateLabel={localeText.create.addExecutionEstimate}
          fileCountLabel={localeText.create.fileCount}
          composerHints={localeText.create.composerHints}
          richEditorDescription={localeText.create.richEditorDescription}
          timeLeftLabel={localeText.labels.timeLeft}
          openTaskLabel={localeText.labels.openOrderLink}
          summaryLabel={localeText.labels.summary}
          executionLabel={localeText.labels.execution}
          relatedItemsLabel={localeText.labels.relatedItems}
          windowLabel={localeText.labels.window}
          executionEstimateLabel={localeText.labels.executionEstimate}
          statusLabel={localeText.labels.taskStatus}
          stopTaskLabel={localeText.buttons.stopTask}
          deleteTaskLabel={localeText.buttons.delete}
          onSubmit={handleSubmit}
          onQueueTask={queueTaskBelow}
          onAttachFiles={attachFiles}
          onRemoveFile={removeAttachedFile}
          onStopOrder={handleStopOrder}
          onDeleteOrder={handleDeleteOrder}
          onOpenOrder={openOrder}
          onCreateServiceFromOrder={() => {}}
          onDescriptionChange={updateDescription}
          onTemplateVariableChange={updateTemplateVariableValue}
          onTagsChange={updateTags}
          onExecutionEstimateChange={updateExecutionEstimate}
        />
      </kefine-screen>
    {/if}

    {#if step === 'submitting'}
      <kefine-screen class="kefine-screen--centered" in:softScreenTransition out:softScreenTransition>
        {#if SubmittingStepComponent}
          <SubmittingStepComponent
            ariaLabel={localeText.meta.locale === 'ru'
              ? 'Пересылка документа на сервер'
              : localeText.meta.locale === 'hy'
                ? 'Փաստաթղթի փոխանցում սերվերին'
                : 'Forwarding document to server'}
          />
        {:else}
          <article class="kefine-card kefine-card--wide kefine-loading-panel" aria-busy="true">
            <KefineLoadingDocuments ariaLabel="Loading" />
          </article>
        {/if}
      </kefine-screen>
    {/if}

    {#if step === 'error'}
      <kefine-screen class="kefine-screen" in:softScreenTransition out:softScreenTransition>
        {#if ErrorStepComponent}
          <ErrorStepComponent
            message={errorMessage}
            retryLabel={localeText.buttons.tryAgain}
            onRetry={() => {
              errorMessage = '';
              step = 'create';
            }}
          />
        {:else}
          <article class="kefine-card kefine-card--wide kefine-loading-panel" aria-busy="true">
            <h2>{localeText.errors.fallback}</h2>
          </article>
        {/if}
      </kefine-screen>
    {/if}

    {#if step === 'executing'}
      <kefine-screen in:softScreenTransition out:softScreenTransition>
        <KefineExecutingStep
          currentOrder={currentOrder}
          queuedOrders={[]}
          execution={executionPresentation}
          canSaveCloneLocally={canSaveCurrentOrderLocally}
          canManageTask={canManageCurrentOrder}
          isHydratingTitle={isHydratingRoute && !currentOrder?.title.trim()}
          isConfirmingStep={confirmStepLoading}
          commentSubmittingStepId={stepCommentLoadingId}
          confirmCurrentStepLabel={localeText.buttons.confirmStep}
          onConfirmCurrentStep={confirmCurrentExecutionStep}
          onSubmitStepComment={submitStepComment}
          onSaveDocument={saveCurrentOrderDocument}
          onExportClone={handleExportClone}
          onSaveCloneLocally={handleSaveCloneLocally}
          onUpdateTaskSettings={handleUpdateTaskSettings}
          onPauseSearch={() => {
            if (currentOrder) {
              stopOrder(currentOrder);
            }
          }}
          onResumeSearch={() => {
            if (currentOrder) {
              resumeOrder(currentOrder);
            }
          }}
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
            price: localeText.labels.price,
            exchangeWaiting: localeText.labels.exchangeWaiting,
            performers: localeText.labels.performers,
            notebook: localeText.labels.notebook,
            iterations: localeText.labels.iterations,
            interimResult: localeText.labels.interimResult,
            finalResult: localeText.labels.finalResult,
            leaveComment: localeText.labels.leaveComment,
            noNotebookYet: localeText.labels.noNotebookYet,
            boardTitle: localeText.labels.taskQueue,
            treeTitle: localeText.labels.taskTree,
            feedTitle: localeText.labels.taskFeed,
            saving: localeText.status.savingDocument,
            apply: localeText.buttons.apply,
            richEditorDescription: localeText.create.richEditorDescription
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
        {#if PaymentStepComponent}
          <PaymentStepComponent
            currentOrder={currentOrder}
            resultSurface={resultSurface}
            remainingAmount={remainingAmount}
            paymentInvoiceFallback={`/api/pay/${currentOrder?.id ?? ''}`}
            selectedAuthMethod={selectedAuthMethod}
            paymentMethod={paymentMethod}
            paymentStage={paymentStage}
            depositDialogOpen={depositDialogOpen}
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
        {:else}
          <article class="kefine-card kefine-card--wide kefine-loading-panel" aria-busy="true">
            <h2>{localeText.payment.summaryTitle}</h2>
          </article>
        {/if}
      </kefine-screen>
    {/if}

  </kefine-layout>
  </main>

  {#if AuthDialogComponent}
    <AuthDialogComponent
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
  {/if}

  {#if PasskeyDialogComponent}
    <PasskeyDialogComponent
      open={passkeyDialogOpen}
      title={localeText.auth.passkeyTitle}
      onClose={() => { passkeyDialogOpen = false; }}
      onSuccess={loginWithPasskey}
      onError={handlePasskeyError}
    />
  {/if}

  {#if PrivateKeyDialogComponent}
    <PrivateKeyDialogComponent
      open={privateKeyDialogOpen}
      title={localeText.auth.privateKeyTitle}
      description={localeText.auth.privateKeyDescription}
      value={privateKeyInput}
      placeholder="pqsk_... or -----BEGIN PRIVATE KEY-----"
      submitLabel="Sign"
      closeLabel={localeText.buttons.closeDialog}
      generateLabel={localeText.auth.privateKeyGenerateLabel}
      onClose={() => { privateKeyDialogOpen = false; }}
      onInput={(value: string) => { privateKeyInput = value; }}
      onSubmit={choosePrivateKeyMethod}
      onGenerate={chooseGeneratedPrivateKeyMethod}
    />
  {/if}

</kefine-shell>

<style>
  kefine-shell {
    min-height: 100vh;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    align-items: stretch;
    padding: clamp(0.75rem, 2vw, 1.4rem);
  }

  main {
    display: contents;
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

  kefine-layout[data-step='submitting'] {
    min-height: calc(100vh - clamp(1.5rem, 4vw, 2.8rem));
    align-items: center;
    align-content: center;
    padding-top: 0;
    padding-bottom: 0;
  }

  kefine-layout > * {
    min-width: 0;
    width: 100%;
  }

  kefine-screen {
    display: grid;
    width: 100%;
  }

  kefine-screen.kefine-screen--centered {
    min-height: calc(100vh - clamp(1.5rem, 4vw, 2.8rem));
    place-items: center;
    align-content: center;
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

  .kefine-loading-panel {
    display: grid;
    place-items: center;
    min-height: 14rem;
    text-align: center;
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

    kefine-shell[data-sidebar-expanded='true'] kefine-layout[data-mode='create'] {
      padding-top: 21rem;
    }

    kefine-shell[data-sidebar-expanded='true'] kefine-layout[data-mode='flow'] {
      padding-top: 20rem;
    }
  }
</style>
