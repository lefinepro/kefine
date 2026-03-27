<script lang="ts">
  import { browser } from '$app/environment';
  import { buildOrderProxyUrl, resolveOrderProxyBasePath } from '$lib/order-proxy-path';
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import { authState, hydrateAuthStateFromSession, updateAuthState } from '$lib/auth/auth-store.svelte.js';
  import {
    loadPasskeySession,
    passkeySessionStore,
    setPasskeySession
  } from '$lib/auth/passkey-session';
  import { syncAppKitTheme } from '$lib/auth/appkit';
  import {
    performAuthentication,
    finishAuthentication,
    type PasskeyAuthSuccess
  } from '$lib/auth/routes';
  import {
    getLocaleText,
    kefineLocale,
    setKefineLocale
  } from '$lib/constants/kefine-locale';
  import KefineTopbar from '$lib/components/kefine/KefineTopbar.svelte';
  import KefineCreateStep from '$lib/components/kefine/KefineCreateStep.svelte';
  import KefineAuthDialog from '$lib/components/kefine/KefineAuthDialog.svelte';
  import KefineContactDialog from '$lib/components/kefine/KefineContactDialog.svelte';
  import KefinePasskeyDialog from '$lib/components/kefine/KefinePasskeyDialog.svelte';
  import KefineSubmittingStep from '$lib/components/kefine/KefineSubmittingStep.svelte';
  import KefineExecutingStep from '$lib/components/kefine/KefineExecutingStep.svelte';
  import KefinePaymentStep from '$lib/components/kefine/KefinePaymentStep.svelte';
  import mockOrderStatus from '../../../../.meta/data/mocks/order-status.mock.json';
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
    buildCreatePayload,
    deriveExecutionPresentation,
    extractStatusPayload,
    parseStoredOrders,
    readCreateResponse,
    resolveExecutionEstimate,
    toNumber
  } from '$lib/components/kefine/kefine-workflow';
  import { waitForDelay } from '$lib/utils/helpers';

  let {
    initialOrderId
  }: {
    initialOrderId?: string;
  } = $props();
  const localeText = $derived(getLocaleText($kefineLocale));

  function getNormalizedInitialOrderId() {
    return initialOrderId?.trim() || null;
  }

  let step = $state<FlowStep>(getNormalizedInitialOrderId() ? 'executing' : 'create');
  let draft = $state<DraftOrder>({
    title: '',
    description: '',
    estimatedCost: '',
    currency: 'USDC',
    executionEstimate: ''
  });
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
  let isLocalhostRuntime = $state(false);

  let isDarkTheme = $state(false);
  let selectedAuthMethod = $state<AuthMethod>(null);
  let paymentMethod = $state<PaymentMethod>(null);
  let paymentStage = $state<PaymentStage>('payment-method-select');
  let depositDialogOpen = $state(false);
  let authDialogOpen = $state(false);
  let contactDialogOpen = $state(false);
  let passkeyDialogOpen = $state(false);
  let stagePreviewOpen = $state(false);
  let contactName = $state('');
  let contactEmail = $state('');
  let contactMessage = $state('');
  let isHydratingRoute = $state(Boolean(getNormalizedInitialOrderId()));
  const activePollTokens = new Map<string, symbol>();
  let pollAbortController = $state<AbortController | null>(null);

  const passkeySession = $derived($passkeySessionStore);
  const isPasskeyActive = $derived(passkeySession ? passkeySession.expiresAt.getTime() > Date.now() : false);
  const isAuthenticated = $derived(authState.isConnected || isPasskeyActive);
  const walletNetworkLabel = $derived(
    authState.chainId === 100 ? localeText.auth.walletNetworkGnosis : localeText.auth.walletNetworkEthereum
  );
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
  const authenticatedLabel = $derived.by(() => {
    if (selectedAuthMethod === 'passkey' && normalizedPasskeyLabel) {
      return normalizedPasskeyLabel;
    }

    if (selectedAuthMethod === 'wallet' && normalizedWalletLabel) {
      return normalizedWalletLabel;
    }

    return normalizedPasskeyLabel ?? normalizedWalletLabel;
  });
  const ORDER_PAGE_SIZE = 12;
  let visibleOrdersLimit = $state(ORDER_PAGE_SIZE);
  const visibleOrders = $derived(createdOrders.slice(0, visibleOrdersLimit));
  const hasMoreOrders = $derived(visibleOrdersLimit < createdOrders.length);
  const topbarThemeActionLabel = $derived(
    isDarkTheme ? localeText.topbar.theme.switchToLight : localeText.topbar.theme.switchToDark
  );
  const matchedOrders = $derived.by(() => {
    const query = draft.title.trim().toLowerCase();
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
  const sidebarSocialLinks = $derived([
    {
      id: 'mastodon' as const,
      label: localeText.topbar.socialLinks.mastodon.label,
      href: localeText.topbar.socialLinks.mastodon.href,
      icon: 'mdi:mastodon'
    },
    {
      id: 'discord' as const,
      label: localeText.topbar.socialLinks.discord.label,
      href: localeText.topbar.socialLinks.discord.href,
      icon: 'mdi:discord'
    },
    {
      id: 'linkedin' as const,
      label: localeText.topbar.socialLinks.linkedin.label,
      href: localeText.topbar.socialLinks.linkedin.href,
      icon: 'mdi:linkedin'
    },
    {
      id: 'telegram' as const,
      label: localeText.topbar.socialLinks.telegram.label,
      href: localeText.topbar.socialLinks.telegram.href,
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
      id: 'refund' as const,
      label: localeText.topbar.legalLinks.refund,
      href: '/refund-policy'
    }
  ]);
  const remainingAmount = $derived(currentOrder?.estimatedCost ?? 0);
  const executionPresentation = $derived(
    deriveExecutionPresentation(currentOrder, localeText, selectedAuthMethod, step === 'payment')
  );
  const demoOrders = $derived.by(() => {
    const vpnDemo = mockOrderStatus['vpn-demo-1'];
    if (!vpnDemo) {
      return [] satisfies OrderView[];
    }

    const parsed = extractStatusPayload(
      vpnDemo,
      {
        title: localeText.defaults.taskTitle,
        description: localeText.defaults.defaultDescription || '',
        currency: localeText.defaults.defaultCurrency,
        createdAt: new Date('2026-03-24T10:00:00.000Z').toISOString()
      },
      localeText
    );

    return parsed ? [parsed] satisfies OrderView[] : ([] satisfies OrderView[]);
  });
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

    return 'Kefine Solver Exchange';
  });
  const authDisplay = $derived({
    appIconUrl: '/favicon.png',
    socialAvatarUrl: null as string | null,
    passkeyAvatarUrl: null as string | null,
    actorAvatarUrl: null as string | null,
    activeMethod: selectedAuthMethod,
    walletLabel: normalizedWalletLabel,
    passkeyLabel: normalizedPasskeyLabel
  });

  const TITLE_FONT_MAX = 2.2;
  const TITLE_FONT_MIN = 1.1;
  const TITLE_FONT_SHRINK_AT = 34;
  const TITLE_FONT_SHRINK_STEP = 18;
  const screenDissolveTransition = {
    duration: 240,
    easing: cubicOut
  } as const;
  const titleFontSize = $derived(
    Math.max(
      TITLE_FONT_MIN,
      TITLE_FONT_MAX - Math.max(0, (draft.title.length - TITLE_FONT_SHRINK_AT) / TITLE_FONT_SHRINK_STEP)
    )
  );

  onMount(() => {
    if (!browser) return;
    hydrateAuthStateFromSession();
    loadPasskeySession();
    loadCreatedOrders();
    isLocalhostRuntime = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);

    const routeState = readTaskRouteState();
    const routeOrderId = routeState?.orderId || getNormalizedInitialOrderId();
    if (routeOrderId) {
      isHydratingRoute = true;
      void openOrderById(routeOrderId, routeState?.view ?? null);
    }

    isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-kefine-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('lang', $kefineLocale);

    return () => {
      pollAbortController?.abort();
      activePollTokens.clear();
    };
  });
  $effect(() => {
    if (browser) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-kefine-theme', theme);
      document.documentElement.setAttribute('lang', $kefineLocale);
      void syncAppKitTheme(theme);
    }
  });

  $effect(() => {
    if (isPasskeyActive) {
      if (!selectedAuthMethod || selectedAuthMethod === 'passkey') {
        selectedAuthMethod = 'passkey';
      }
      return;
    }

    if (authState.isConnected) {
      if (!selectedAuthMethod || selectedAuthMethod === 'wallet') {
        selectedAuthMethod = 'wallet';
      }
      return;
    }
  });

  $effect(() => {
    const walletReady = selectedAuthMethod === 'wallet' && authState.isConnected;
    const passkeyReady = selectedAuthMethod === 'passkey' && isPasskeyActive;
    if (step === 'executing' && !stagePreviewOpen && (walletReady || passkeyReady || selectedAuthMethod === 'anonymous')) {
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

    if (selectedAuthMethod === 'anonymous' && !paymentMethod) {
      paymentMethod = 'promo';
    }
  });

  $effect(() => {
    if (!browser) return;
    if (isHydratingRoute) return;
    const nextUrl = new URL(window.location.href);
    const orderId =
      (step === 'executing' || step === 'payment') && currentOrder?.id
        ? currentOrder.id
        : null;

    nextUrl.pathname = '/';
    nextUrl.search = '';
    if (!orderId) {
      nextUrl.hash = '';
    } else if (step === 'payment' && paymentStage === 'result-ready') {
      nextUrl.hash = `#/task/${encodeURIComponent(orderId)}/result`;
    } else if (step === 'executing' && stagePreviewOpen) {
      nextUrl.hash = `#/task/${encodeURIComponent(orderId)}/stages`;
    } else {
      nextUrl.hash = `#/task/${encodeURIComponent(orderId)}`;
    }

    if (window.location.href !== nextUrl.toString()) {
      window.history.replaceState({}, '', nextUrl);
    }
  });

  function toggleTheme() {
    isDarkTheme = !isDarkTheme;
  }

  function resetTransactionState() {
    selectedAuthMethod = null;
    paymentMethod = null;
    paymentStage = 'payment-method-select';
    depositDialogOpen = false;
    stagePreviewOpen = false;
  }

  function openAuthDialog() {
    authDialogOpen = true;
  }

  function closeAuthDialog() {
    authDialogOpen = false;
  }

  function closePasskeyDialog() {
    passkeyDialogOpen = false;
  }
  async function openSocialAuth() {
        if (!browser) {
      openAuthDialog();
      return;
    }

    try {
      const { openAppKit } = await import('$lib/auth/appkit.js');
      await openAppKit();
    } catch {
      openAuthDialog();
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

  function toggleLeftNav() {
    leftNavExpanded = !leftNavExpanded;
  }

  function handleTopbarBrandClick() {
    leftNavExpanded = false;
    newOrder();
  }

  function selectTopbarTheme() {
    toggleTheme();
  }

  function openContactDialog() {
    contactDialogOpen = true;
  }

  function closeContactDialog() {
    contactDialogOpen = false;
  }

  function openContactEmailDraft() {
    if (!browser) return;

    window.location.href = `mailto:${localeText.topbar.contactEmail}`;
  }

  function selectTopbarAuth() {
    openAuthDialog();
  }

  function selectTopbarLocale(locale: 'en' | 'ru') {
    setKefineLocale(locale);
  }

  function updateContactName(value: string) {
    contactName = value;
  }

  function updateContactEmail(value: string) {
    contactEmail = value;
  }

  function updateContactMessage(value: string) {
    contactMessage = value;
  }

  function submitContactEmail() {
    if (!browser) return;

    const subjectSource = contactName.trim() || localeText.brand.name;
    const bodyLines = [
      contactName.trim() ? `Name: ${contactName.trim()}` : '',
      contactEmail.trim() ? `Email: ${contactEmail.trim()}` : '',
      '',
      contactMessage.trim()
    ].filter(Boolean);

    const mailto = new URL(`mailto:${localeText.topbar.contactEmail}`);
    mailto.searchParams.set('subject', `${localeText.brand.name}: ${subjectSource}`);
    mailto.searchParams.set('body', bodyLines.join('\n'));
    window.location.href = mailto.toString();
    closeContactDialog();
  }

  function loadCreatedOrders() {
    try {
      const raw = localStorage.getItem(ORDER_STORAGE_KEY);
      createdOrders = parseStoredOrders(raw, localeText);
      if (raw !== null) {
        localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(createdOrders));
      }
    } catch {
      createdOrders = [];
    }

    for (const demoOrder of demoOrders) {
      const existingIndex = createdOrders.findIndex((order) => order.id === demoOrder.id);
      if (existingIndex === -1) {
        createdOrders = [demoOrder, ...createdOrders];
        continue;
      }

      const existingOrder = createdOrders[existingIndex];
      if (!existingOrder) continue;

      createdOrders = [
        ...createdOrders.slice(0, existingIndex),
        { ...existingOrder, ...demoOrder, id: existingOrder.id },
        ...createdOrders.slice(existingIndex + 1)
      ];
    }

    persistOrders();

    visibleOrdersLimit = Math.min(ORDER_PAGE_SIZE, createdOrders.length);
  }

  function persistOrders() {
    if (!browser) return;
    localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(createdOrders));
  }

  function upsertOrder(order: OrderView) {
    const index = createdOrders.findIndex((item) => item.id === order.id);
    if (index === -1) {
      createdOrders = [order, ...createdOrders];
    } else {
      const current = createdOrders[index];
      if (!current) return;
      createdOrders = [...createdOrders.slice(0, index), { ...current, ...order, id: current.id }, ...createdOrders.slice(index + 1)];
    }

    if (createdOrders.length > 0) {
      visibleOrdersLimit = Math.min(Math.max(visibleOrdersLimit, 1), createdOrders.length);
    } else {
      visibleOrdersLimit = ORDER_PAGE_SIZE;
    }

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
    const hash = window.location.hash.replace(/^#/, '').replace(/\/+$/, '');
    const hashTaskPrefix = '/task/';
    const hashLegacyPrefix = '/order/';

    if (hash.startsWith(hashTaskPrefix) || hash.startsWith(hashLegacyPrefix)) {
      const prefix = hash.startsWith(hashTaskPrefix) ? hashTaskPrefix : hashLegacyPrefix;
      const remainder = hash.slice(prefix.length);
      const [encodedId, view] = remainder.split('/');
      if (!encodedId) return null;

      try {
        return {
          orderId: decodeURIComponent(encodedId),
          view: view === 'result' || view === 'stages' ? view : null
        } as const;
      } catch {
        return {
          orderId: encodedId,
          view: view === 'result' || view === 'stages' ? view : null
        } as const;
      }
    }

    const rawPath = window.location.pathname.replace(/\/+$/, '');
    const taskPrefix = '/task/';
    const legacyPrefix = '/order/';

    if (!rawPath.startsWith(taskPrefix) && !rawPath.startsWith(legacyPrefix)) {
      return null;
    }

    const prefix = rawPath.startsWith(taskPrefix) ? taskPrefix : legacyPrefix;
    const remainder = rawPath.slice(prefix.length);
    const [encodedId, view] = remainder.split('/');
    if (!encodedId) return null;

    try {
      return {
        orderId: decodeURIComponent(encodedId),
        view: view === 'result' || view === 'stages' ? view : null
      } as const;
    } catch {
      return {
        orderId: encodedId,
        view: view === 'result' || view === 'stages' ? view : null
      } as const;
    }
  }

  async function openOrderById(orderId: string, preferredView: 'result' | 'stages' | null = null) {
    if (!orderId) return;
    try {
      const local = createdOrders.find((item) => item.id === orderId);
      if (local) {
        currentOrder = local;
        resetTransactionState();
        if (local.status === 'completed') {
          if (preferredView === 'stages') {
            stagePreviewOpen = true;
            step = 'executing';
          } else {
            paymentStage = 'result-ready';
            step = 'payment';
          }
        } else {
          step = 'executing';
        }

        if (!local.id.startsWith('local-') && local.status !== 'completed') {
          const updated = await requestOrderFromStatus(orderId, {
            title: local.title,
            description: local.description,
            currency: local.currency,
            createdAt: local.createdAt
          });

          if (updated) {
            currentOrder = { ...currentOrder, ...updated, id: currentOrder.id };
            upsertOrder(currentOrder);
          }
        }

        return;
      }

      const remote = await requestOrderFromStatus(orderId, {
        title: '',
        description: localeText.defaults.defaultDescription || '',
        currency: localeText.defaults.defaultCurrency,
        createdAt: new Date().toISOString()
      });

      if (remote) {
        currentOrder = remote;
        upsertOrder(remote);
        resetTransactionState();
        if (remote.status === 'completed') {
          if (preferredView === 'stages') {
            stagePreviewOpen = true;
            step = 'executing';
          } else {
            paymentStage = 'result-ready';
            step = 'payment';
          }
        } else {
          step = 'executing';
        }
        return;
      }

      step = 'create';
    } finally {
      isHydratingRoute = false;
    }
  }

  function openOrder(order: OrderView) {
    currentOrder = order;
    resetTransactionState();
    if (order.status === 'completed') {
      paymentStage = 'result-ready';
      step = 'payment';
      return;
    }

    step = 'executing';
  }

  function loadMoreOrders() {
    if (!hasMoreOrders) {
      return;
    }

    visibleOrdersLimit = Math.min(visibleOrdersLimit + ORDER_PAGE_SIZE, createdOrders.length);
  }

  function orderApiBaseUrl(): string {
    return resolveOrderProxyBasePath('');
  }

  function craterBaseUrl(): string {
    if (!browser) return '';
    return window.location.origin;
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
    if (orderId.startsWith('local-')) {
      return null;
    }

    const mockPayload = mockOrderStatus[orderId as keyof typeof mockOrderStatus];
    if (mockPayload) {
      return extractStatusPayload(
        mockPayload,
        {
          title: fallbackOrder.title,
          description: fallbackOrder.description,
          currency: fallbackOrder.currency,
          createdAt: fallbackOrder.createdAt
        },
        localeText
      );
    }

    try {
      const response = await fetch(buildOrderProxyUrl(`/status/${encodeURIComponent(orderId)}`, orderApiBaseUrl()), {
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) {
        return null;
      }

      const payload: unknown = await response.json();

      return extractStatusPayload(
        payload,
        {
          title: fallbackOrder.title,
          description: fallbackOrder.description,
          currency: fallbackOrder.currency,
          createdAt: fallbackOrder.createdAt
        },
        localeText
      );
    } catch {
      return null;
    }
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
    let tries = 0;
    let latestOrder = order;

    while (tries < POLL_LIMIT) {
      if (signal.aborted) {
        activePollTokens.delete(order.id);
        return;
      }

      if (activePollTokens.get(order.id) !== token) {
        return;
      }

      const updated = await requestOrderFromStatus(order.id, {
        title: latestOrder.title,
        description: latestOrder.description,
        currency: latestOrder.currency || localeText.defaults.defaultCurrency,
        createdAt: latestOrder.createdAt
      });

      if (activePollTokens.get(order.id) !== token) {
        return;
      }

      if (updated) {
        latestOrder = { ...latestOrder, ...updated, id: latestOrder.id };
        upsertOrder(latestOrder);

        if (currentOrder?.id === latestOrder.id) {
          currentOrder = { ...currentOrder, ...updated, id: currentOrder.id };
        }

        if (updated.status === 'completed') {
          activePollTokens.delete(order.id);
          return;
        }
      }

      tries += 1;

      try {
        await waitForDelay(POLL_INTERVAL_MS, signal);
      } catch {
        activePollTokens.delete(order.id);
        return;
      }
    }

    if (activePollTokens.get(order.id) === token) {
      activePollTokens.delete(order.id);
    }
  }

  async function createOrder(payload: DraftOrder, options?: { background?: boolean }) {
    const isBackground = options?.background === true;
    if (!isBackground) {
      step = 'submitting';
    }

    try {
      const response = await fetch(buildOrderProxyUrl('/create', orderApiBaseUrl()), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(buildCreatePayload(payload))
      });

      const body: unknown = await response.json();
      const parsed = response.ok ? readCreateResponse(body) : null;
      if (!response.ok || !parsed) {
        throw new Error(localeText.errors.fallback);
      }

      const createdOrder: OrderView = {
        id: parsed.orderId,
        solver: parsed.solver || localeText.defaults.openSolverMarket,
        status: parsed.status || 'queued',
        title: payload.title || localeText.defaults.taskTitle,
        description: payload.description || '',
        createdAt: new Date().toISOString(),
        estimatedCost: toNumber(payload.estimatedCost) || undefined,
        currency: payload.currency || localeText.defaults.defaultCurrency,
        executionEstimate: resolveExecutionEstimate(payload.executionEstimate, payload.title, localeText),
        paymentUrl: undefined,
        uiScenario: parsed.uiScenario
      };

      upsertOrder(createdOrder);

      startOrderPolling(createdOrder);

      if (isBackground) {
        return;
      }

      currentOrder = createdOrder;
      resetTransactionState();
      step = 'executing';
    } catch (error) {
      const isNetworkError =
        error instanceof TypeError ||
        (error instanceof Error && /network|fetch|failed to fetch|load failed/i.test(error.message));

      if (isNetworkError) {
        const offlineOrder: OrderView = {
          id:
            typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
              ? `local-${globalThis.crypto.randomUUID()}`
              : `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
          solver: localeText.defaults.solverNetwork,
          status: 'queued',
          title: payload.title || localeText.defaults.taskTitle,
          description: payload.description || '',
          createdAt: new Date().toISOString(),
          estimatedCost: toNumber(payload.estimatedCost) || undefined,
          currency: payload.currency || localeText.defaults.defaultCurrency,
          executionEstimate: resolveExecutionEstimate(payload.executionEstimate, payload.title, localeText),
          paymentUrl: undefined
        };

        upsertOrder(offlineOrder);

        if (!isBackground) {
          currentOrder = offlineOrder;
          resetTransactionState();
          step = 'executing';
        }

        return;
      }

      if (!isBackground) {
        step = 'create';
      }
    }
  }

  async function submitDraft(form: DraftOrder, options?: { background?: boolean }) {
    const normalized: DraftOrder = {
      title: form.title.trim(),
      description: form.description.trim() || form.title.trim(),
      estimatedCost: form.estimatedCost.trim() || '0',
      currency: form.currency.trim() || localeText.defaults.defaultCurrency,
      executionEstimate: form.executionEstimate.trim()
    };

    if (!normalized.title) {
      normalized.title = localeText.defaults.taskTitle;
    }

    await createOrder(normalized, options);
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

  async function queueTaskBelow(title: string) {
    const normalizedTitle = title.trim();
    if (!normalizedTitle) return;

    await submitDraft(
      {
        ...draft,
        title: normalizedTitle
      },
      { background: true }
    );
  }

  function handleStopOrder(order: OrderView, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    stopOrder(order);
  }

  function newOrder() {
    draft = {
      title: '',
      description: '',
      estimatedCost: '',
      currency: draft.currency,
      executionEstimate: ''
    };
    draftQueued = null;
    currentOrder = null;
    resetTransactionState();
    step = 'create';
  }

  function loginWithPasskey(session: PasskeyAuthSuccess) {
    console.info('[passkey] loginWithPasskey', {
      username: session.username,
      userId: session.userId,
      expiresAt: session.expiresAt
    });
    closeAuthDialog();
    closePasskeyDialog();

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

  function chooseLocalhostMethod() {
    closeAuthDialog();
    stagePreviewOpen = false;
    selectedAuthMethod = 'wallet';
    paymentMethod = 'wallet';
    updateAuthState({
      isConnected: true,
      address: null,
      chainId: null,
      email: 'localhost',
      authType: 'localhost',
      status: 'connected'
    });

    if (draftQueued) {
      void continueAfterAuth();
      return;
    }

    if (currentOrder && step === 'executing') {
      step = 'payment';
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

  function closeDepositDialog() {
    depositDialogOpen = false;
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

<main class="kefine-shell">
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
    githubUrl={localeText.topbar.githubUrl}
    themeLabel={topbarThemeActionLabel}
    signInLabel={localeText.topbar.signIn}
    signedInLabel={localeText.topbar.signedIn}
    authenticatedLabel={authenticatedLabel}
    isAuthenticated={isAuthenticated}
    isDarkTheme={isDarkTheme}
    isExpanded={leftNavExpanded}
    locale={$kefineLocale}
    languageEnglishLabel={localeText.topbar.languageEnglish}
    languageRussianLabel={localeText.topbar.languageRussian}
    socialLinks={sidebarSocialLinks}
    legalLinks={sidebarLegalLinks}
    onToggleExpand={toggleLeftNav}
    onBrandClick={handleTopbarBrandClick}
    onOpenEmailDraft={openContactEmailDraft}
    onOpenEmailDialog={openContactDialog}
    onTheme={selectTopbarTheme}
    onAuth={selectTopbarAuth}
    onLocale={selectTopbarLocale}
  />

  <section
    class="kefine-layout"
    class:kefine-layout--create={step === 'create'}
    class:kefine-layout--flow={step === 'executing' || step === 'payment' || step === 'submitting'}
  >
    {#if step === 'create'}
      <kefine-screen class="kefine-screen" in:fade={screenDissolveTransition} out:fade={screenDissolveTransition}>
        <KefineCreateStep
          draft={draft}
          title={localeText.create.title}
          titleFontSize={titleFontSize}
          placeholder={localeText.create.placeholder}
          placeholderVariants={localeText.create.placeholderVariants}
          executeAria={localeText.create.executeAria}
          solverLabel={localeText.labels.solver}
          recentOrders={visibleOrders}
          matchedOrders={matchedOrders}
          isSearching={draft.title.trim().length > 0}
          totalOrders={createdOrders.length}
          hasMoreOrders={hasMoreOrders}
          onLoadMoreOrders={loadMoreOrders}
          matchedTasksLabel={localeText.create.matchedTasks}
          timeLeftLabel={localeText.labels.timeLeft}
          priceLabel={localeText.labels.price}
          statusLabel={localeText.labels.taskStatus}
          stopTaskLabel={localeText.buttons.stopTask}
          onSubmit={handleSubmit}
          onQueueTask={queueTaskBelow}
          onStopOrder={handleStopOrder}
          onOpenOrder={openOrder}
        />
      </kefine-screen>
    {/if}

    {#if step === 'submitting'}
      <kefine-screen class="kefine-screen" in:fade={screenDissolveTransition} out:fade={screenDissolveTransition}>
        <KefineSubmittingStep />
      </kefine-screen>
    {/if}

    {#if step === 'executing'}
      <kefine-screen class="kefine-screen" in:fade={screenDissolveTransition} out:fade={screenDissolveTransition}>
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
      <kefine-screen class="kefine-screen" in:fade={screenDissolveTransition} out:fade={screenDissolveTransition}>
        <KefinePaymentStep
          currentOrder={currentOrder}
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
          onOpenStages={() => {
            stagePreviewOpen = true;
            step = 'executing';
          }}
          onOpenDepositDialog={() => {
            depositDialogOpen = true;
          }}
          onCloseDepositDialog={closeDepositDialog}
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
          authLabels={{
            walletTitle: localeText.auth.walletTitle,
            walletAccount: localeText.auth.walletAccount,
            passkeyTitle: localeText.auth.passkeyTitle,
            anonymousTitle: localeText.auth.anonymousTitle,
            anonymousDetail: localeText.auth.anonymousDetail
          }}
          authDisplay={authDisplay}
          buttons={{
            apply: localeText.buttons.apply,
            payNow: localeText.buttons.payNow,
            confirmLinkedWallet: localeText.buttons.confirmLinkedWallet,
            depositNow: localeText.buttons.depositNow,
            payWithPromo: localeText.buttons.payWithPromo,
            openResult: localeText.buttons.openResult,
            openAllTasks: localeText.buttons.openAllTasks,
            saveResult: localeText.buttons.saveResult,
            closeDialog: localeText.buttons.closeDialog
          }}
        />
      </kefine-screen>
    {/if}

  </section>

  <KefineAuthDialog
    open={authDialogOpen}
    title={localeText.executionFlow['awaiting-auth'].title}
    description={localeText.executionFlow['awaiting-auth'].detail}
    walletTitle={localeText.auth.walletTitle}
    passkeyTitle={localeText.auth.passkeyTitle}
    localhostTitle={localeText.auth.localhostTitle}
    showLocalhost={isLocalhostRuntime}
    closeLabel={localeText.buttons.closeDialog}
    onClose={closeAuthDialog}
    onWallet={chooseWalletMethod}
    onPasskey={choosePasskeyMethod}
    onLocalhost={chooseLocalhostMethod}
  />

  <KefinePasskeyDialog
    open={passkeyDialogOpen}
    title={localeText.auth.passkeyTitle}
    onClose={closePasskeyDialog}
    onSuccess={loginWithPasskey}
    onError={handlePasskeyError}
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
    onClose={closeContactDialog}
    onNameInput={updateContactName}
    onEmailInput={updateContactEmail}
    onMessageInput={updateContactMessage}
    onSubmit={submitContactEmail}
  />
</main>
