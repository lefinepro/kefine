<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import {
    isVpnOrder,
    readPaymentQuote,
    type AuthMethod,
    type PaymentMethod,
    type PaymentQuote,
    type PaymentStage,
    type OrderView,
    type ResultSurface
  } from './kefine-workflow';

  const ZERO_EVM_ADDRESS = '0x0000000000000000000000000000000000000000';

  let {
    currentOrder,
    resultSurface,
    paymentInvoiceFallback,
    selectedAuthMethod,
    paymentStage,
    labels,
    paymentLabels,
    resultLabels,
    authDisplay,
    buttons,
    onBack,
    onRejectResult,
    onOpenStages,
    onConfirmPayment,
    onRevealResult,
    onSaveAnonymousResult,
    onWalletLogin,
    onPasskeyLogin,
    onAnonymousLogin
  }: {
    currentOrder: OrderView | null;
    resultSurface: ResultSurface;
    remainingAmount: number;
    paymentInvoiceFallback: string;
    selectedAuthMethod: AuthMethod;
    paymentMethod: PaymentMethod;
    paymentStage: PaymentStage;
    depositDialogOpen: boolean;
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
      rejectResult: string;
      saveResult: string;
      closeDialog: string;
      openAllTasks: string;
    };
    onBack: () => void;
    onRejectResult: () => void;
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

  const localeText = $derived($kefineLocaleText);
  const paymentCopy = $derived(localeText.payment);
  let promoCode = $state('');
  let promoFeedback = $state('');
  let promoFeedbackTone = $state<'neutral' | 'success' | 'error'>('neutral');
  let paymentQuote = $state<PaymentQuote | null>(null);
  let paymentLoading = $state(false);
  let paySubmitting = $state(false);
  let paymentError = $state('');
  let promoApplying = $state(false);
  const effectivePaymentAmount = $derived(paymentQuote?.effectiveAmount ?? currentOrder?.estimatedCost ?? 0);
  const effectivePaymentCurrency = $derived(paymentQuote?.currency ?? currentOrder?.currency ?? 'USDC');
  const payButtonLabel = $derived.by(() => {
    const amount = effectivePaymentAmount;
    const currency = effectivePaymentCurrency;
    const formattedAmount = Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
    return paymentCopy.payAmount(formattedAmount, currency);
  });
  const quoteReady = $derived(paymentQuote !== null && !paymentLoading);
  const paymentRequestLabel = $derived(paymentQuote?.paymentTokenSymbol ? `EVM ${paymentQuote.paymentTokenSymbol}` : paymentCopy.evmPayment);
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
  const compactPaymentAddress = $derived(paymentQuote?.paymentAddress || paymentCopy.waitingAddress);

  function formatAmount(amount: number | undefined) {
    if (amount === undefined) return '0';
    return Number.isInteger(amount) ? String(amount) : amount.toFixed(2).replace(/\.?0+$/, '');
  }

  function buildPaymentRequest(config: PaymentQuote, amount: number) {
    const address = config.paymentAddress;
    if (!address || address.toLowerCase() === ZERO_EVM_ADDRESS || amount <= 0) {
      return undefined;
    }

    const atomicAmount = Math.round(amount * 10 ** config.paymentTokenDecimals);
    return `ethereum:${config.paymentTokenAddress}@${config.paymentChainId}/transfer?address=${address}&uint256=${atomicAmount}`;
  }

  function buildFallbackQuote(code?: string): PaymentQuote | null {
    if (!currentOrder || !paymentQuote) {
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
      promoMessage: normalizedCode ? (promoApplied ? paymentCopy.promoAppliedMessage : paymentCopy.promoWrongMessage) : undefined,
      strikeOriginalPrice: promoApplied && originalAmount > 0,
      freeUnlock: promoApplied,
      paymentAddress: paymentQuote.paymentAddress,
      paymentRequest: buildPaymentRequest(paymentQuote, effectiveAmount),
      paymentChainId: paymentQuote.paymentChainId,
      paymentTokenAddress: paymentQuote.paymentTokenAddress,
      paymentTokenSymbol: paymentQuote.paymentTokenSymbol,
      paymentTokenDecimals: paymentQuote.paymentTokenDecimals,
      paymentUrl: currentOrder.paymentUrl ?? paymentInvoiceFallback,
      labels
    };
  }

  async function readJsonOrThrow(response: Response) {
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error((body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' ? body.error : null) ?? paymentCopy.requestFailed);
    }

    return body;
  }

  async function loadPaymentQuote() {
    if (!browser || !currentOrder?.id || paymentStage === 'result-ready') return;

    paymentLoading = true;
    paymentError = '';

    try {
      const response = await fetch(`/api/payment/${encodeURIComponent(currentOrder.id)}`, {
        headers: { Accept: 'application/json' }
      });
      const body = await readJsonOrThrow(response);
      const parsed = readPaymentQuote(body);

      if (!parsed) {
        throw new Error(paymentCopy.invalidQuote);
      }

      paymentQuote = parsed;
      promoFeedback = parsed.promoMessage ?? '';
      promoFeedbackTone = parsed.promoApplied ? 'success' : 'neutral';
      if (parsed.promoCode) {
        promoCode = parsed.promoCode;
      }
    } catch (error) {
      const fallback = buildFallbackQuote();
      if (fallback) {
        paymentQuote = fallback;
        paymentError = '';
      } else {
        paymentError = error instanceof Error ? error.message : paymentCopy.loadQuoteFailed;
      }
    } finally {
      paymentLoading = false;
    }
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
      const response = await fetch(`/api/payment/${encodeURIComponent(currentOrder.id)}/promo`, {
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
        throw new Error(paymentCopy.invalidQuote);
      }

      paymentQuote = parsed;
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
    const appKitModule = await import('$lib/auth/appkit.js');

    try {
      if (paymentQuote.paymentAddress.toLowerCase() === ZERO_EVM_ADDRESS) {
        throw new Error(paymentCopy.recipientMissing);
      }

      await appKitModule.payWithReownErc20Transfer({
        chainId: paymentQuote.paymentChainId,
        tokenAddress: paymentQuote.paymentTokenAddress as `0x${string}`,
        recipientAddress: paymentQuote.paymentAddress as `0x${string}`,
        amount: paymentQuote.effectiveAmount,
        decimals: paymentQuote.paymentTokenDecimals
      });

      onConfirmPayment();
    } catch (error) {
      if (error instanceof appKitModule.ReownPaymentError && error.code === 'wallet_not_connected') {
        await appKitModule.openAppKit();
      }

      paymentError = error instanceof Error ? error.message : paymentCopy.paymentFailed;
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

    void loadPaymentQuote();
  });

</script>

<article class="kefine-card kefine-card--wide kefine-order-flow" class:kefine-result-mode={paymentStage === 'result-ready'} data-testid={selectedAuthMethod === 'anonymous' ? 'kefine-anonymous-payment' : undefined}>
  <lefine-box class="kefine-result-background" aria-hidden={paymentStage === 'result-ready'}>
    <section class="kefine-payment-layout kefine-payment-layout--fadein" data-testid="kefine-payment-redesign">
      <lefine-box class="kefine-payment-layout__left">
        <lefine-box class="kefine-payment-panel">
          <lefine-box class="kefine-section-head">
            <p>{paymentRequestLabel}</p>
            {#if paymentQuote?.paymentTokenSymbol}
              <lefine-text class="kefine-payment-chip">{paymentCopy.onChain(paymentQuote.paymentTokenSymbol, paymentQuote.paymentChainId)}</lefine-text>
            {/if}
          </lefine-box>

          <lefine-box class="kefine-payment-qr-surface">
            {#if qrImageUrl}
              <img class="kefine-payment-qr-image" src={qrImageUrl} alt={paymentCopy.qrAlt} loading="eager" />
            {:else}
              <lefine-box class="kefine-payment-qr-placeholder">
                <Icon icon="mdi:qrcode" width="72" height="72" aria-hidden="true" />
                <small>{paymentCopy.qrPending}</small>
              </lefine-box>
            {/if}
          </lefine-box>

          <lefine-box class="kefine-payment-address-block">
            <lefine-text class="kefine-payment-address-label">{paymentCopy.evmAddress}</lefine-text>
            <code>{compactPaymentAddress}</code>
          </lefine-box>
        </lefine-box>
      </lefine-box>

      <lefine-box class="kefine-payment-layout__right">
        <lefine-box class="kefine-payment-panel kefine-payment-panel--pricing">
          <lefine-box class="kefine-section-head">
            <p>{paymentLabels.summaryTitle}</p>
            {#if currentOrder?.id}
              <lefine-text class="kefine-payment-chip">{labels.taskId} {currentOrder.id}</lefine-text>
            {/if}
          </lefine-box>

          <lefine-box class="kefine-payment-hero">
            <strong>{currentOrder?.title ?? labels.resultTitle}</strong>
            <p>{currentOrder?.executionEstimate ? `${labels.executionEstimate} ${currentOrder.executionEstimate}` : paymentLabels.payCtaHint}</p>
          </lefine-box>

          <lefine-box class="kefine-payment-price-stack">
            {#if paymentQuote?.strikeOriginalPrice}
              <lefine-text class="kefine-payment-price--struck">
                {formatAmount(paymentQuote.originalAmount)} {paymentQuote.currency}
              </lefine-text>
            {/if}
            <strong class="kefine-payment-price-current">
              {formatAmount(paymentQuote?.effectiveAmount ?? currentOrder?.estimatedCost)} {paymentQuote?.currency ?? currentOrder?.currency}
            </strong>
          </lefine-box>

          <lefine-box class="kefine-promo-block kefine-promo-block--payment">
            <label class="kefine-promo-label" for="payment-promo-code">{paymentLabels.promoCodeLabel}</label>
            <lefine-box class="kefine-promo-row">
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
                {promoApplying ? paymentCopy.applying : buttons.apply}
              </button>
            </lefine-box>
            {#if promoFeedback}
              <p class="kefine-promo-feedback" data-tone={promoFeedbackTone}>{promoFeedback}</p>
            {/if}
          </lefine-box>

          {#if paymentError}
            <p class="kefine-promo-feedback" data-tone="error">{paymentError}</p>
          {/if}

          <lefine-box class="kefine-payment-action-row">
            <button type="button" data-variant="primary" onclick={handlePrimaryPaymentAction} disabled={paySubmitting || (!quoteReady && !paymentError)}>
              {#if paySubmitting}
                {paymentCopy.processing}
              {:else if paymentQuote?.freeUnlock}
                {buttons.openResult}
              {:else}
                {payButtonLabel}
              {/if}
            </button>
          </lefine-box>

        </lefine-box>
      </lefine-box>
    </section>
  </lefine-box>

  {#if paymentStage === 'result-ready'}
    <section class="kefine-result-overlay" data-testid="kefine-result-panel">
      <lefine-box class="kefine-result-shell">
        <lefine-box class="kefine-result-header">
          <button type="button" class="kefine-flow-back" aria-label={paymentCopy.back} onclick={onBack}>←</button>
          <lefine-box class="kefine-result-title-block">
            <p>{paymentCopy.completedTask(currentOrder?.title ?? '-')}</p>
          </lefine-box>
          <lefine-box class="kefine-result-actions">
            <button type="button" data-variant="ghost" onclick={onOpenStages}>{paymentCopy.viewStages}</button>
            <button type="button" data-variant="ghost" onclick={onRejectResult}>{buttons.rejectResult}</button>
          </lefine-box>
        </lefine-box>

        <lefine-box class="kefine-result-summary">
          <lefine-text class="kefine-payment-chip">{labels.executionEstimate} {currentOrder?.executionEstimate ?? '-'}</lefine-text>
        </lefine-box>

        <lefine-box class="kefine-result-card">
          <strong>{resultSurface.title}</strong>
          <p>{resultSurface.summary}</p>

          {#if resultSurface.type === 'json'}
            <lef-result-json>{resultSurface.content}</lef-result-json>
          {:else if resultSurface.type === 'iframe'}
            <iframe srcdoc={resultSurface.srcdoc} title={resultSurface.title}></iframe>
          {:else if resultSurface.type === 'external-link'}
            <button
              type="button"
              data-variant="primary"
              onclick={() => window.open(resultSurface.href, '_blank', 'noopener,noreferrer')}
            >
              {resultSurface.ctaLabel}
            </button>
          {:else}
            <button type="button" data-variant="primary" onclick={onOpenStages}>
              {resultSurface.ctaLabel}
            </button>
          {/if}
        </lefine-box>

      </lefine-box>

    </section>
  {/if}

  {#if paymentStage === 'result-ready' && selectedAuthMethod === 'anonymous'}
    <section class="kefine-anonymous-save kefine-anonymous-save--result">
      <p>{resultLabels.anonymousSaveHint}</p>
      <button type="button" data-variant="ghost" data-testid="kefine-save-result" onclick={onSaveAnonymousResult}>{buttons.saveResult}</button>
    </section>
  {/if}
</article>

<style>
  lef-result-json {
    display: block;
    margin: 0;
    padding: 1rem;
    border: 1px solid color-mix(in oklab, var(--kef-color-text) 16%, transparent);
    border-radius: 1rem;
    background: color-mix(in oklab, var(--kef-color-bg-card) 88%, transparent);
    color: var(--kef-color-text);
    font: 0.9rem/1.5 var(--kef-font-family-mono);
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
