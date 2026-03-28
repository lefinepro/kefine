<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { readPaymentQuote, type AuthMethod, type PaymentMethod, type PaymentQuote, type PaymentStage, type OrderView } from './kefine-workflow';

  const walletProviders = [
    { icon: 'logos:metamask-icon', label: 'MetaMask', className: 'is-metamask' },
    { icon: 'simple-icons:walletconnect', label: 'WalletConnect', className: 'is-walletconnect' },
    { icon: 'material-symbols:alternate-email-rounded', label: 'Email', className: 'is-email' },
    { icon: 'logos:google-icon', label: 'Google', className: 'is-google' }
  ];

  const authIcons = {
    passkey: 'mdi:fingerprint'
  } as const;
  type PaymentConfig = {
    paymentAddress: string;
    paymentChainId: number;
    paymentTokenAddress: string;
    paymentTokenSymbol: string;
    paymentTokenDecimals: number;
  };

  const ZERO_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';

  let {
    currentOrder,
    paymentInvoiceFallback,
    selectedAuthMethod,
    paymentStage,
    isAuthenticated,
    labels,
    paymentLabels,
    resultLabels,
    authLabels,
    authDisplay,
    buttons,
    onBack,
    onOpenStages,
    onConfirmPayment,
    onRevealResult,
    onSaveAnonymousResult,
    onWalletLogin,
    onPasskeyLogin,
    onAnonymousLogin
  }: {
    currentOrder: OrderView | null;
    remainingAmount: number;
    paymentInvoiceFallback: string;
    selectedAuthMethod: AuthMethod;
    paymentMethod: PaymentMethod;
    paymentStage: PaymentStage;
    depositDialogOpen: boolean;
    isAuthenticated: boolean;
    labels: {
      taskId: string;
      amount: string;
      executionEstimate: string;
      paymentInvoice: string;
      createNewTask: string;
      selectedMethod: string;
      remainingBalance: string;
      resultTitle: string;
    };
    paymentLabels: {
      summaryTitle: string;
      methodSelectTitle: string;
      walletReadyTitle: string;
      passkeyReadyTitle: string;
      anonymousReadyTitle: string;
      promoHint: string;
      promoCodeLabel: string;
      promoCodePlaceholder: string;
      promoEmpty: string;
      promoOk: string;
      promoWrong: string;
      depositDialogTitle: string;
      depositDialogDetail: string;
      depositPendingTitle: string;
      depositPendingDetail: string;
      paidTitle: string;
      paidDetail: string;
      linkedWalletHint: string;
      payCtaHint: string;
    };
    resultLabels: {
      anonymousSaveHint: string;
    };
    authLabels: {
      walletTitle: string;
      walletAccount: string;
      passkeyTitle: string;
      anonymousTitle: string;
      anonymousDetail: string;
    };
    authDisplay: {
      walletLabel: string | null;
      passkeyLabel: string | null;
    };
    buttons: {
      payNow: string;
      confirmLinkedWallet: string;
      depositNow: string;
      payWithPromo: string;
      apply: string;
      openResult: string;
      saveResult: string;
      closeDialog: string;
      openAllTasks: string;
    };
    onBack: () => void;
    onOpenStages: () => void;
    onOpenDepositDialog: () => void;
    onCloseDepositDialog: () => void;
    onSelectDepositMethod: (method: Exclude<PaymentMethod, null>) => void;
    onConfirmPayment: () => void;
    onRevealResult: () => void;
    onSaveAnonymousResult: () => void;
    onWalletLogin: () => void;
    onPasskeyLogin: () => void;
    onAnonymousLogin: () => void;
  } = $props();

  let promoCode = $state('');
  let promoFeedback = $state('');
  let promoFeedbackTone = $state<'neutral' | 'success' | 'error'>('neutral');
  let paymentQuote = $state<PaymentQuote | null>(null);
  let paymentConfig = $state<PaymentConfig | null>(null);
  let paymentLoading = $state(false);
  let paySubmitting = $state(false);
  let paymentError = $state('');
  let promoApplying = $state(false);
  let guestAccessStartedAt = $state<number | null>(null);
  let nowTs = $state(Date.now());

  const VPN_GUEST_ACCESS_MS = 10 * 60 * 1000;
  const vpnGuideAvailable = $derived(
    currentOrder?.uiScenario === 'vpn-service' && paymentStage === 'result-ready' && Boolean(currentOrder?.vpnGuide)
  );
  const guestResultAccess = $derived(vpnGuideAvailable && (isAuthenticated || selectedAuthMethod === 'anonymous'));
  const effectivePaymentAmount = $derived(paymentQuote?.effectiveAmount ?? currentOrder?.estimatedCost ?? 0);
  const effectivePaymentCurrency = $derived(paymentQuote?.currency ?? currentOrder?.currency ?? 'USDC');
  const payButtonLabel = $derived.by(() => {
    const amount = effectivePaymentAmount;
    const currency = effectivePaymentCurrency;
    const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
    return `Pay ${formattedAmount} ${currency}`.trim();
  });
  const guestAccessRemainingMs = $derived.by(() => {
    if (!guestResultAccess || !guestAccessStartedAt) {
      return VPN_GUEST_ACCESS_MS;
    }

    return Math.max(0, guestAccessStartedAt + VPN_GUEST_ACCESS_MS - nowTs);
  });
  const guestAccessExpired = $derived(guestResultAccess && guestAccessRemainingMs <= 0);
  const guestAccessTimerLabel = $derived.by(() => {
    const totalSeconds = Math.ceil(guestAccessRemainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(Math.max(0, minutes)).padStart(2, '0')}:${String(Math.max(0, seconds)).padStart(2, '0')}`;
  });
  const quoteReady = $derived(paymentQuote !== null && !paymentLoading);
  const paymentRequestLabel = $derived(paymentQuote?.paymentTokenSymbol ? `EVM ${paymentQuote.paymentTokenSymbol}` : 'EVM payment');
  const qrPayload = $derived(paymentQuote?.paymentAddress ?? null);
  const qrImageUrl = $derived.by(() => {
    if (!qrPayload) {
      return null;
    }

    const params = new URLSearchParams({
      size: '320x320',
      format: 'svg',
      data: qrPayload
    });

    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  });
  const compactPaymentAddress = $derived(paymentQuote?.paymentAddress || 'Waiting for crater payment address');

  function formatAmount(amount: number | undefined) {
    if (amount === undefined) return '0';
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
  }

  function guestAccessStorageKey(orderId: string) {
    return `kefine-vpn-guest-access:${orderId}`;
  }

  function buildPaymentRequest(config: PaymentConfig, amount: number) {
    const address = config.paymentAddress;
    if (!address || address.toLowerCase() === ZERO_EVM_ADDRESS || amount <= 0) {
      return undefined;
    }

    const atomicAmount = Math.round(amount * 10 ** config.paymentTokenDecimals);
    return `ethereum:${config.paymentTokenAddress}@${config.paymentChainId}/transfer?address=${address}&uint256=${atomicAmount}`;
  }

  function buildFallbackQuote(code?: string): PaymentQuote | null {
    if (!currentOrder || !paymentConfig) {
      return null;
    }

    const normalizedCode = code?.trim().toUpperCase();
    const labels = currentOrder.labels ?? [];
    const vpnEligible = labels.some((label) => label.toLowerCase().includes('vpn'));
    const originalAmount = currentOrder.estimatedCost ?? 0;
    const promoApplied = normalizedCode === 'SHARDSTATEVPN' && vpnEligible;
    const effectiveAmount = promoApplied ? 0 : originalAmount;

    return {
      orderId: currentOrder.id,
      title: currentOrder.title,
      status: currentOrder.status,
      currency: currentOrder.currency,
      originalAmount,
      effectiveAmount,
      promoCode: normalizedCode,
      promoApplied,
      promoMessage: normalizedCode ? (promoApplied ? 'Promo applied. VPN delivery is now unlocked.' : 'Promo code not recognized.') : undefined,
      strikeOriginalPrice: promoApplied && originalAmount > 0,
      freeUnlock: promoApplied,
      paymentAddress: paymentConfig.paymentAddress,
      paymentRequest: buildPaymentRequest(paymentConfig, effectiveAmount),
      paymentChainId: paymentConfig.paymentChainId,
      paymentTokenAddress: paymentConfig.paymentTokenAddress,
      paymentTokenSymbol: paymentConfig.paymentTokenSymbol,
      paymentTokenDecimals: paymentConfig.paymentTokenDecimals,
      paymentUrl: currentOrder.paymentUrl ?? paymentInvoiceFallback,
      labels
    };
  }

  function readPaymentConfig(body: unknown): PaymentConfig | null {
    if (!body || typeof body !== 'object') {
      return null;
    }

    const record = body as Record<string, unknown>;
    const paymentAddress = typeof record.paymentAddress === 'string' ? record.paymentAddress.trim() : '';
    const paymentTokenAddress = typeof record.paymentTokenAddress === 'string' ? record.paymentTokenAddress.trim() : '';
    const paymentTokenSymbol = typeof record.paymentTokenSymbol === 'string' ? record.paymentTokenSymbol.trim() : '';
    const paymentChainId = typeof record.paymentChainId === 'number' ? record.paymentChainId : Number(record.paymentChainId);
    const paymentTokenDecimals =
      typeof record.paymentTokenDecimals === 'number' ? record.paymentTokenDecimals : Number(record.paymentTokenDecimals);

    if (
      !paymentAddress ||
      !paymentTokenAddress ||
      !paymentTokenSymbol ||
      paymentAddress.toLowerCase() === ZERO_EVM_ADDRESS ||
      paymentTokenAddress.toLowerCase() === ZERO_EVM_ADDRESS ||
      !Number.isFinite(paymentChainId) ||
      !Number.isFinite(paymentTokenDecimals)
    ) {
      return null;
    }

    return {
      paymentAddress,
      paymentChainId,
      paymentTokenAddress,
      paymentTokenSymbol,
      paymentTokenDecimals
    };
  }

  function resetGuestAccess() {
    if (!browser || !currentOrder?.id) return;

    const startedAt = Date.now();
    window.localStorage.setItem(guestAccessStorageKey(currentOrder.id), String(startedAt));
    guestAccessStartedAt = startedAt;
    nowTs = startedAt;
  }

  function resolveExpiredActionLabel() {
    return 'Request again';
  }

  function handleExpiredAction() {
    resetGuestAccess();
  }

  async function readJsonOrThrow(response: Response) {
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : null) ?? 'Request failed');
    }

    return body;
  }

  async function loadPaymentQuote() {
    if (!browser || !currentOrder?.id || paymentStage === 'result-ready') return;

    paymentLoading = true;
    paymentError = '';

    try {
      const response = await fetch(`/payment/${encodeURIComponent(currentOrder.id)}`, {
        headers: { Accept: 'application/json' }
      });
      const body = await readJsonOrThrow(response);
      const parsed = readPaymentQuote(body);

      if (!parsed) {
        throw new Error('Payment quote is invalid.');
      }

      paymentQuote = parsed;
      paymentConfig = {
        paymentAddress: parsed.paymentAddress,
        paymentChainId: parsed.paymentChainId,
        paymentTokenAddress: parsed.paymentTokenAddress,
        paymentTokenSymbol: parsed.paymentTokenSymbol,
        paymentTokenDecimals: parsed.paymentTokenDecimals
      };
      promoFeedback = parsed.promoMessage ?? '';
      promoFeedbackTone = parsed.promoApplied ? 'success' : 'neutral';
      if (parsed.promoCode) {
        promoCode = parsed.promoCode;
      }
    } catch (error) {
      await ensurePaymentConfig();
      const fallback = buildFallbackQuote();
      if (fallback) {
        paymentQuote = fallback;
        paymentError = '';
      } else {
        paymentError = error instanceof Error ? error.message : 'Failed to load payment quote.';
      }
    } finally {
      paymentLoading = false;
    }
  }

  async function ensurePaymentConfig() {
    if (paymentConfig) {
      return paymentConfig;
    }

    const response = await fetch('/api/kefine/payment-config', {
      headers: { Accept: 'application/json' }
    });
    const body = await readJsonOrThrow(response);
    const parsed = readPaymentConfig(body);
    if (!parsed) {
      throw new Error('Payment config is invalid or not configured on the server.');
    }

    paymentConfig = parsed;
    return parsed;
  }

  async function applyPromoCode() {
    const normalized = promoCode.trim();
    if (!normalized || !currentOrder?.id) {
      promoFeedback = paymentLabels.promoEmpty;
      promoFeedbackTone = 'error';
      return;
    }

    promoApplying = true;
    paymentError = '';

    try {
      const response = await fetch(`/payment/${encodeURIComponent(currentOrder.id)}/promo`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: normalized,
          subject: authDisplay.passkeyLabel ?? authDisplay.walletLabel ?? selectedAuthMethod ?? 'anonymous'
        })
      });
      const body = await readJsonOrThrow(response);
      const parsed = readPaymentQuote(body);

      if (!parsed) {
        throw new Error('Payment quote is invalid.');
      }

      paymentQuote = parsed;
      paymentConfig = {
        paymentAddress: parsed.paymentAddress,
        paymentChainId: parsed.paymentChainId,
        paymentTokenAddress: parsed.paymentTokenAddress,
        paymentTokenSymbol: parsed.paymentTokenSymbol,
        paymentTokenDecimals: parsed.paymentTokenDecimals
      };
      promoFeedback = parsed.promoMessage ?? (parsed.promoApplied ? paymentLabels.promoOk : paymentLabels.promoWrong);
      promoFeedbackTone = parsed.promoApplied ? 'success' : 'error';

      if (parsed.freeUnlock) {
        onRevealResult();
      }
    } catch (error) {
      const fallback = buildFallbackQuote(normalized);
      if (fallback) {
        paymentQuote = fallback;
        promoFeedback = fallback.promoMessage ?? paymentLabels.promoWrong;
        promoFeedbackTone = fallback.promoApplied ? 'success' : 'error';
        if (fallback.freeUnlock) {
          onRevealResult();
        }
      } else {
        promoFeedback = error instanceof Error ? error.message : paymentLabels.promoWrong;
        promoFeedbackTone = 'error';
      }
    } finally {
      promoApplying = false;
    }
  }

  async function handlePrimaryPaymentAction() {
    if (paymentQuote?.freeUnlock) {
      onRevealResult();
      return;
    }

    if (!paymentQuote?.paymentAddress || !paymentQuote.paymentTokenAddress || !paymentQuote.paymentChainId) {
      onConfirmPayment();
      return;
    }

    paySubmitting = true;
    paymentError = '';

    try {
      if (paymentQuote.paymentAddress.toLowerCase() === ZERO_EVM_ADDRESS) {
        throw new Error('Payment recipient address is not configured on the server.');
      }

      const { openAppKit, payWithReownErc20Transfer, ReownPaymentError } = await import('$lib/auth/appkit.js');

      await payWithReownErc20Transfer({
        chainId: paymentQuote.paymentChainId,
        tokenAddress: paymentQuote.paymentTokenAddress as `0x${string}`,
        recipientAddress: paymentQuote.paymentAddress as `0x${string}`,
        amount: paymentQuote.effectiveAmount,
        decimals: paymentQuote.paymentTokenDecimals
      });

      onConfirmPayment();
    } catch (error) {
      if (error instanceof ReownPaymentError && error.code === 'wallet_not_connected') {
        await openAppKit();
      }

      paymentError = error instanceof Error ? error.message : 'Failed to complete Reown payment.';
    } finally {
      paySubmitting = false;
    }
  }

  async function handlePayAction() {
    await handlePrimaryPaymentAction();
  }

  $effect(() => {
    if (!browser || paymentStage === 'result-ready') {
      return;
    }

    void ensurePaymentConfig().catch(() => undefined);
    void loadPaymentQuote();
  });

  $effect(() => {
    if (!browser || !guestResultAccess || !currentOrder?.id) {
      guestAccessStartedAt = null;
      return;
    }

    const storageKey = guestAccessStorageKey(currentOrder.id);
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? Number(raw) : Number.NaN;
    const startedAt = Number.isFinite(parsed) ? parsed : Date.now();

    if (!Number.isFinite(parsed)) {
      window.localStorage.setItem(storageKey, String(startedAt));
    }

    guestAccessStartedAt = startedAt;
  });

  $effect(() => {
    if (!browser || !guestResultAccess) {
      return;
    }

    nowTs = Date.now();
    let frameId = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) {
        return;
      }

      nowTs = Date.now();
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  });
</script>

<article class="kefine-card kefine-card--wide kefine-order-flow" class:kefine-result-mode={paymentStage === 'result-ready'}>
  <div class="kefine-result-background" aria-hidden={paymentStage === 'result-ready'}>
    <section class="kefine-payment-layout kefine-payment-layout--fadein" data-testid="kefine-payment-redesign">
      <div class="kefine-payment-layout__left">
        <div class="kefine-payment-panel">
          <div class="kefine-section-head">
            <p>{paymentRequestLabel}</p>
            {#if paymentQuote?.paymentTokenSymbol}
              <span class="kefine-payment-chip">{paymentQuote.paymentTokenSymbol} on chain {paymentQuote.paymentChainId}</span>
            {/if}
          </div>

          <div class="kefine-payment-qr-surface">
            {#if qrImageUrl}
              <img class="kefine-payment-qr-image" src={qrImageUrl} alt="Payment QR code" loading="eager" />
            {:else}
              <div class="kefine-payment-qr-placeholder">
                <Icon icon="mdi:qrcode" width="72" height="72" aria-hidden="true" />
                <small>QR will appear when payment details are ready.</small>
              </div>
            {/if}
          </div>

          <div class="kefine-payment-address-block">
            <span class="kefine-payment-address-label">EVM address</span>
            <code>{compactPaymentAddress}</code>
          </div>
        </div>
      </div>

      <div class="kefine-payment-layout__right">
        <div class="kefine-payment-panel kefine-payment-panel--pricing">
          <div class="kefine-section-head">
            <p>{paymentLabels.summaryTitle}</p>
            {#if currentOrder?.id}
              <span class="kefine-payment-chip">{labels.taskId} {currentOrder.id}</span>
            {/if}
          </div>

          <div class="kefine-payment-hero">
            <strong>{currentOrder?.title ?? labels.resultTitle}</strong>
            <p>{currentOrder?.executionEstimate ? `${labels.executionEstimate} ${currentOrder.executionEstimate}` : paymentLabels.payCtaHint}</p>
          </div>

          <div class="kefine-payment-price-stack">
            {#if paymentQuote?.strikeOriginalPrice}
              <span class="kefine-payment-price--struck">
                {formatAmount(paymentQuote.originalAmount)} {paymentQuote.currency}
              </span>
            {/if}
            <strong class="kefine-payment-price-current">
              {formatAmount(paymentQuote?.effectiveAmount ?? currentOrder?.estimatedCost)} {paymentQuote?.currency ?? currentOrder?.currency}
            </strong>
          </div>

          <div class="kefine-promo-block kefine-promo-block--payment">
            <label class="kefine-promo-label" for="payment-promo-code">{paymentLabels.promoCodeLabel}</label>
            <div class="kefine-promo-row">
              <input
                id="payment-promo-code"
                class="kefine-promo-input"
                type="text"
                bind:value={promoCode}
                placeholder={paymentLabels.promoCodePlaceholder}
                autocomplete="off"
                data-testid="kefine-payment-promo-input"
              />
              <button type="button" data-variant="primary" onclick={applyPromoCode} disabled={promoApplying}>
                {promoApplying ? 'Applying...' : buttons.apply}
              </button>
            </div>
            {#if promoFeedback}
              <p class="kefine-promo-feedback" data-tone={promoFeedbackTone}>{promoFeedback}</p>
            {/if}
          </div>

          {#if paymentError}
            <p class="kefine-promo-feedback" data-tone="error">{paymentError}</p>
          {/if}

          <div class="kefine-payment-action-row">
            <button type="button" data-variant="primary" onclick={handlePrimaryPaymentAction} disabled={paySubmitting || (!quoteReady && !paymentError)}>
              {#if paySubmitting}
                Processing...
              {:else if paymentQuote?.freeUnlock}
                {buttons.openResult}
              {:else}
                {payButtonLabel}
              {/if}
            </button>
          </div>

        </div>
      </div>
    </section>
  </div>

  {#if paymentStage === 'result-ready'}
    <section class="kefine-result-overlay" data-testid="kefine-result-panel">
      <div class="kefine-result-shell">
        <div class="kefine-result-header">
          <button type="button" class="kefine-flow-back" aria-label="Back" onclick={onBack}>←</button>
          <div class="kefine-result-title-block">
            <p>Completed your task: {currentOrder?.title ?? '-'}</p>
          </div>
          <div class="kefine-result-actions">
            <span class="kefine-flow-badge kefine-flow-badge--timer">{guestAccessTimerLabel}</span>
            <button type="button" data-variant="ghost" onclick={handlePayAction}>{payButtonLabel}</button>
            <button type="button" data-variant="ghost" onclick={onOpenStages}>View stages</button>
          </div>
        </div>

        <div class="kefine-result-summary">
          <span class="kefine-payment-chip">{labels.executionEstimate} {currentOrder?.executionEstimate ?? '-'}</span>
        </div>

        {#if guestResultAccess && currentOrder?.vpnGuide}
          <div class="kefine-vpn-guide" class:kefine-vpn-guide--blurred={guestAccessExpired}>
            <header class="kefine-vpn-guide__header">
              <strong>{currentOrder.vpnGuide.title}</strong>
              <p>{currentOrder.vpnGuide.summary}</p>
            </header>

            <div class="kefine-vpn-guide__steps">
              {#each currentOrder.vpnGuide.steps as step}
                <article class="kefine-vpn-guide__card" data-step={step.id}>
                  <h3>{step.title}</h3>
                  <p>{step.summary}</p>

                  {#if step.apps}
                    <div class="kefine-vpn-guide__apps">
                      {#each step.apps as app}
                        <a class="kefine-vpn-guide__pill kefine-vpn-guide__pill--link" href={app.href} target="_blank" rel="noreferrer">
                          {app.label}
                        </a>
                      {/each}
                    </div>
                  {/if}

                  {#if step.exampleVlessLink}
                    <pre class="kefine-vpn-guide__code"><code>{step.exampleVlessLink}</code></pre>
                  {/if}

                  {#if step.linuxClient}
                    <ol class="kefine-vpn-guide__list">
                      {#each step.linuxClient as item}
                        <li>{item}</li>
                      {/each}
                    </ol>
                  {/if}

                  {#if step.otherClientsNote}
                    <small class="kefine-vpn-guide__note">{step.otherClientsNote}</small>
                  {/if}
                </article>
              {/each}
            </div>
          </div>

          {#if guestAccessExpired}
            <div class="kefine-vpn-guide__expired-gate">
              <span class="kefine-flow-badge kefine-flow-badge--timer">Guest access expired</span>
              <strong>Continue when you need the package again</strong>
              <p>The 10 minute preview has ended.</p>
              <div class="kefine-vpn-guide__expired-actions">
                <button type="button" data-variant="primary" onclick={handleExpiredAction}>
                  {resolveExpiredActionLabel()}
                </button>
                <button type="button" data-variant="ghost" onclick={handlePayAction}>
                  {payButtonLabel}
                </button>
              </div>
            </div>
          {/if}
        {:else if !isAuthenticated}
          <div class="kefine-auth-grid">
            <button type="button" class="kefine-auth-tile kefine-auth-tile--wallet" data-testid="kefine-result-wallet-tile" onclick={onWalletLogin}>
              <div class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">
                <div class="kefine-wallet-grid">
                  {#each walletProviders as provider}
                    <span class={provider.className} aria-label={provider.label}>
                      <span class="kefine-wallet-icon">
                        <Icon icon={provider.icon} width="100%" height="100%" aria-hidden="true" />
                      </span>
                      <small>{provider.label}</small>
                    </span>
                  {/each}
                </div>
              </div>
              <strong>{authDisplay.walletLabel ?? authLabels.walletTitle}</strong>
              <small>{authLabels.walletAccount}</small>
            </button>

            <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey" data-testid="kefine-result-passkey-tile" onclick={onPasskeyLogin}>
              <div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
                <span class="kefine-auth-icon">
                  <Icon icon={authIcons.passkey} width="100%" height="100%" aria-hidden="true" />
                </span>
              </div>
              <strong>{authLabels.passkeyTitle}</strong>
              {#if authDisplay.passkeyLabel}
                <small>{authDisplay.passkeyLabel}</small>
              {/if}
            </button>

            <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous" data-testid="kefine-result-anonymous-tile" onclick={onAnonymousLogin}>
              <div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true">
                <span class="kefine-test-badge">10</span>
              </div>
              <strong>{authLabels.anonymousTitle}</strong>
              <small>{authLabels.anonymousDetail}</small>
            </button>
          </div>
        {:else}
          <div class="kefine-vpn-guide__fallback">
            <strong>{labels.resultTitle}</strong>
            <p>The delivery package is ready for this order.</p>
          </div>
        {/if}

      </div>

    </section>
  {/if}

  {#if paymentStage === 'result-ready' && selectedAuthMethod === 'anonymous'}
    <section class="kefine-anonymous-save kefine-anonymous-save--result">
      <p>{resultLabels.anonymousSaveHint}</p>
      <button type="button" data-variant="ghost" data-testid="kefine-save-result" onclick={onSaveAnonymousResult}>{buttons.saveResult}</button>
    </section>
  {/if}
</article>
