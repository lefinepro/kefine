<script lang="ts">
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import { authState } from '$lib/auth/auth-store.svelte.js';
  import { apSessionStore, loadAPSession, setAPSession } from '$lib/auth/session';
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
    deriveResultSurface,
    extractStatusPayload,
    parseStoredOrders,
    readCreateResponse,
    resolveExecutionEstimate,
    toNumber
  } from '$lib/components/kefine/kefine-workflow';

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

  let isDarkTheme = $state(false);
  let selectedAuthMethod = $state<AuthMethod>(null);
  let paymentMethod = $state<PaymentMethod>(null);
  let paymentStage = $state<PaymentStage>('payment-method-select');
  let depositDialogOpen = $state(false);
  let authDialogOpen = $state(false);
  let contactDialogOpen = $state(false);
  let passkeyDialogOpen = $state(false);
  let contactName = $state('');
  let contactEmail = $state('');
  let contactMessage = $state('');
  let isHydratingRoute = $state(Boolean(getNormalizedInitialOrderId()));
  const activePollTokens = new Map<string, symbol>();

  const passkeySession = $derived($apSessionStore);
  const isPasskeyActive = $derived(passkeySession ? passkeySession.expiresAt.getTime() > Date.now() : false);
  const isAuthenticated = $derived(authState.isConnected || isPasskeyActive);
  const walletNetworkLabel = $derived(
    authState.chainId === 100 ? localeText.auth.walletNetworkGnosis : localeText.auth.walletNetworkEthereum
  );
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
  const remainingAmount = $derived(currentOrder?.estimatedCost ?? 0);
  const executionPresentation = $derived(
    deriveExecutionPresentation(currentOrder, localeText, selectedAuthMethod, step === 'payment')
  );
  const resultSurface = $derived(
    deriveResultSurface(currentOrder, localeText, `${craterBaseUrl()}/pay/${currentOrder?.id ?? ''}`)
  );
  const authDisplay = $derived({
    appIconUrl: '/favicon.png',
    socialAvatarUrl: null as string | null,
    passkeyAvatarUrl: null as string | null,
    actorAvatarUrl: null as string | null,
    activeMethod: selectedAuthMethod
  });

  const TITLE_FONT_MAX = 2.2;
  const TITLE_FONT_MIN = 1.1;
  const TITLE_FONT_SHRINK_AT = 34;
  const TITLE_FONT_SHRINK_STEP = 18;
  const titleFontSize = $derived(
    Math.max(
      TITLE_FONT_MIN,
      TITLE_FONT_MAX - Math.max(0, (draft.title.length - TITLE_FONT_SHRINK_AT) / TITLE_FONT_SHRINK_STEP)
    )
  );

  onMount(() => {
    if (!browser) return;
    loadAPSession();
    loadCreatedOrders();

    const routeOrderId = readOrderIdFromPath() || getNormalizedInitialOrderId();
    if (routeOrderId) {
      isHydratingRoute = true;
      void openOrderById(routeOrderId);
    }

    isDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.setAttribute('data-kefine-theme', isDarkTheme ? 'dark' : 'light');
    document.documentElement.setAttribute('lang', $kefineLocale);
  });
  $effect(() => {
    if (browser) {
      const theme = isDarkTheme ? 'dark' : 'light';
      document.documentElement.setAttribute('data-kefine-theme', theme);
      document.documentElement.setAttribute('lang', $kefineLocale);
      syncAppKitTheme(theme);
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
    if (step === 'executing' && (walletReady || passkeyReady || selectedAuthMethod === 'anonymous')) {
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
    nextUrl.hash = orderId ? `#/task/${encodeURIComponent(orderId)}` : '';

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
      const { appkit } = await import('$lib/auth/appkit.js');
      if (!appkit) {
        openAuthDialog();
        return;
      }
      appkit.open();
    } catch {
      openAuthDialog();
    }
  }


  async function loginWithDefaultPasskey() {
    if (!browser) return;

    try {
      const authnResp = await performAuthentication();
      const result = await finishAuthentication(authnResp);
      loginWithPasskey(result);
    } catch {
      handlePasskeyError('');
    }
  }

  function toggleLeftNav() {
    leftNavExpanded = !leftNavExpanded;
  }

  function selectTopbarCreate() {
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

  function readOrderIdFromPath() {
    if (!browser) return null;
    const hash = window.location.hash.replace(/^#/, '').replace(/\/+$/, '');
    const hashTaskPrefix = '/task/';
    const hashLegacyPrefix = '/order/';

    if (hash.startsWith(hashTaskPrefix) || hash.startsWith(hashLegacyPrefix)) {
      const prefix = hash.startsWith(hashTaskPrefix) ? hashTaskPrefix : hashLegacyPrefix;
      const encodedId = hash.slice(prefix.length);
      if (!encodedId) return null;

      try {
        return decodeURIComponent(encodedId);
      } catch {
        return encodedId;
      }
    }

    const rawPath = window.location.pathname.replace(/\/+$/, '');
    const taskPrefix = '/task/';
    const legacyPrefix = '/order/';

    if (!rawPath.startsWith(taskPrefix) && !rawPath.startsWith(legacyPrefix)) {
      return null;
    }

    const prefix = rawPath.startsWith(taskPrefix) ? taskPrefix : legacyPrefix;
    const encodedId = rawPath.slice(prefix.length);
    if (!encodedId) return null;

    try {
      return decodeURIComponent(encodedId);
    } catch {
      return encodedId;
    }
  }

  async function openOrderById(orderId: string) {
    if (!orderId) return;
    try {
      const local = createdOrders.find((item) => item.id === orderId);
      if (local) {
        currentOrder = local;
        resetTransactionState();
        step = 'executing';

        if (local.status !== 'completed') {
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
        title: localeText.defaults.taskTitle,
        description: localeText.defaults.defaultDescription || '',
        currency: localeText.defaults.defaultCurrency,
        createdAt: new Date().toISOString()
      });

      if (remote) {
        currentOrder = remote;
        upsertOrder(remote);
        resetTransactionState();
        step = 'executing';
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
    step = 'executing';
  }

  function loadMoreOrders() {
    if (!hasMoreOrders) {
      return;
    }

    visibleOrdersLimit = Math.min(visibleOrdersLimit + ORDER_PAGE_SIZE, createdOrders.length);
  }

  function craterBaseUrl(): string {
    if (!browser) return 'http://localhost:3001';

    const configured = import.meta.env.VITE_CRATER_BASE_URL;
    if (typeof configured === 'string' && configured.trim()) {
      try {
        const configuredUrl = new URL(configured);
        const pageHostname = window.location.hostname;
        const isLocalConfiguredHost =
          configuredUrl.hostname === 'localhost' ||
          configuredUrl.hostname === '127.0.0.1' ||
          configuredUrl.hostname === '0.0.0.0';
        const isLocalPageHost =
          pageHostname === 'localhost' ||
          pageHostname === '127.0.0.1' ||
          pageHostname === '0.0.0.0';

        if (isLocalConfiguredHost && !isLocalPageHost) {
          configuredUrl.hostname = pageHostname;
          configuredUrl.protocol = window.location.protocol;
        }

        configuredUrl.pathname = configuredUrl.pathname.replace(/\/$/, '');
        configuredUrl.search = '';
        configuredUrl.hash = '';
        return configuredUrl.toString().replace(/\/$/, '');
      } catch {
        return configured.replace(/\/$/, '');
      }
    }

    return `${window.location.protocol}//${window.location.hostname}:3001`;
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
    try {
      const response = await fetch(`${craterBaseUrl()}/status/${encodeURIComponent(orderId)}`, {
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
    const token = Symbol(order.id);
    activePollTokens.set(order.id, token);
    void pollOrderInBackground(order, token);
  }

  async function pollOrderInBackground(order: OrderView, token: symbol): Promise<void> {
    let tries = 0;
    let latestOrder = order;

    while (tries < POLL_LIMIT) {
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
      await new Promise((resolve) => {
        setTimeout(resolve, POLL_INTERVAL_MS);
      });
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
      const response = await fetch(`${craterBaseUrl()}/create`, {
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
        paymentUrl: undefined
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
      void error;
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

  function handleSubmit(event: Event) {
    event.preventDefault();
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
    closeAuthDialog();
    closePasskeyDialog();

    setAPSession({
      token: session.token,
      username: session.username,
      actorId: `${craterBaseUrl()}/actor/${encodeURIComponent(session.username)}`,
      expiresAt: new Date(session.expiresAt)
    });

    if (draftQueued) {
      void continueAfterAuth();
      return;
    }

    if (currentOrder && step === 'executing') {
      step = 'payment';
    }
  }

  function handlePasskeyError(error: Error | string) {
    void error;
  }

  function chooseWalletMethod() {
    closeAuthDialog();
    selectedAuthMethod = 'wallet';
    paymentMethod = 'wallet';
    void openSocialAuth();
  }

  async function choosePasskeyMethod() {
    closeAuthDialog();
    selectedAuthMethod = 'passkey';
    paymentMethod = 'linked-wallet';
    if (isPasskeyActive) {
      step = 'payment';
      return;
    }

    await loginWithDefaultPasskey();
  }

  function chooseAnonymousMethod() {
    selectedAuthMethod = 'anonymous';
    paymentMethod = 'promo';
    step = 'payment';
  }

  function closeDepositDialog() {
    depositDialogOpen = false;
  }

  function selectDepositMethod(method: Exclude<PaymentMethod, null>) {
    paymentMethod = method;
    paymentStage = 'deposit-pending';
    depositDialogOpen = false;
  }

  function confirmPayment() {
    paymentStage = 'paid';
  }

  function revealResult() {
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

<main class="kefine-shell">
  <KefineTopbar
    brandLabel={localeText.brand.name}
    navigationLabel={localeText.topbar.quickActions}
    openSidebarLabel={localeText.topbar.openActionsMenu}
    collapseSidebarLabel={localeText.topbar.closeActionsMenu}
    dockLabel={localeText.topbar.dockLabel}
    socialLabel={localeText.topbar.socialLabel}
    mailLabel={localeText.topbar.mailLabel}
    githubLabel={localeText.topbar.githubLabel}
    githubUrl={localeText.topbar.githubUrl}
    themeLabel={topbarThemeActionLabel}
    signInLabel={localeText.topbar.signIn}
    signedInLabel={localeText.topbar.signedIn}
    isAuthenticated={isAuthenticated}
    isDarkTheme={isDarkTheme}
    isExpanded={leftNavExpanded}
    locale={$kefineLocale}
    languageEnglishLabel={localeText.topbar.languageEnglish}
    languageRussianLabel={localeText.topbar.languageRussian}
    socialLinks={sidebarSocialLinks}
    onToggleExpand={toggleLeftNav}
    onOpenCreate={selectTopbarCreate}
    onOpenEmailDraft={openContactEmailDraft}
    onOpenEmailDialog={openContactDialog}
    onTheme={selectTopbarTheme}
    onAuth={selectTopbarAuth}
    onLocale={selectTopbarLocale}
  />

  <section class="kefine-layout">
    {#if step === 'create'}
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
        stopTaskLabel={localeText.buttons.stopTask}
        onSubmit={handleSubmit}
        onQueueTask={queueTaskBelow}
        onStopOrder={handleStopOrder}
        onOpenOrder={openOrder}
        loadMoreHint={localeText.labels.loadMoreHint}
      />
    {/if}

    {#if step === 'submitting'}
      <KefineSubmittingStep />
    {/if}

    {#if step === 'executing'}
      <KefineExecutingStep
        currentOrder={currentOrder}
        execution={executionPresentation}
        onWalletLogin={chooseWalletMethod}
        onPasskeyLogin={choosePasskeyMethod}
        onAnonymous={chooseAnonymousMethod}
        onCancel={cancelExecutingActions}
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
          walletAccount: localeText.auth.walletAccount
        }}
      />
    {/if}

    {#if step === 'payment'}
      <KefinePaymentStep
        currentOrder={currentOrder}
        remainingAmount={remainingAmount}
        paymentInvoiceFallback={`${craterBaseUrl()}/pay/${currentOrder?.id ?? ''}`}
        selectedAuthMethod={selectedAuthMethod}
        paymentMethod={paymentMethod}
        paymentStage={paymentStage}
        depositDialogOpen={depositDialogOpen}
        resultSurface={resultSurface}
        onCreateNew={newOrder}
        onOpenDepositDialog={() => {
          depositDialogOpen = true;
        }}
        onCloseDepositDialog={closeDepositDialog}
        onSelectDepositMethod={selectDepositMethod}
        onConfirmPayment={confirmPayment}
        onRevealResult={revealResult}
        onSaveAnonymousResult={saveAnonymousResult}
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
        buttons={{
          apply: localeText.buttons.apply,
          payNow: localeText.buttons.payNow,
          confirmLinkedWallet: localeText.buttons.confirmLinkedWallet,
          depositNow: localeText.buttons.depositNow,
          payWithPromo: localeText.buttons.payWithPromo,
          openResult: localeText.buttons.openResult,
          saveResult: localeText.buttons.saveResult,
          closeDialog: localeText.buttons.closeDialog
        }}
      />
    {/if}

  </section>

  <KefineAuthDialog
    open={authDialogOpen}
    title={localeText.executionFlow['awaiting-auth'].title}
    description={localeText.executionFlow['awaiting-auth'].detail}
    walletTitle={localeText.auth.walletTitle}
    walletDetail={localeText.auth.walletDetail}
    passkeyTitle={localeText.auth.passkeyTitle}
    passkeyDetail={localeText.auth.passkeyDetail}
    closeLabel={localeText.buttons.closeDialog}
    onClose={closeAuthDialog}
    onWallet={chooseWalletMethod}
    onPasskey={choosePasskeyMethod}
  />

  <KefinePasskeyDialog
    open={passkeyDialogOpen}
    title={localeText.auth.passkeyTitle}
    closeLabel={localeText.buttons.closeDialog}
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
