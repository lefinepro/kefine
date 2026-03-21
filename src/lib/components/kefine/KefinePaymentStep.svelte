<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { AuthMethod, PaymentMethod, PaymentStage, ResultSurface, OrderView } from './kefine-workflow';

  let {
    currentOrder,
    remainingAmount,
    paymentInvoiceFallback,
    selectedAuthMethod,
    paymentMethod,
    paymentStage,
    depositDialogOpen,
    resultSurface,
    labels,
    paymentLabels,
    resultLabels,
    buttons,
    onCreateNew,
    onOpenDepositDialog,
    onCloseDepositDialog,
    onSelectDepositMethod,
    onConfirmPayment,
    onRevealResult,
    onSaveAnonymousResult
  }: {
    currentOrder: OrderView | null;
    remainingAmount: number;
    paymentInvoiceFallback: string;
    selectedAuthMethod: AuthMethod;
    paymentMethod: PaymentMethod;
    paymentStage: PaymentStage;
    depositDialogOpen: boolean;
    resultSurface: ResultSurface;
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
    buttons: {
      payNow: string;
      confirmLinkedWallet: string;
      depositNow: string;
      payWithPromo: string;
      apply: string;
      openResult: string;
      saveResult: string;
      closeDialog: string;
    };
    onCreateNew: () => void;
    onOpenDepositDialog: () => void;
    onCloseDepositDialog: () => void;
    onSelectDepositMethod: (method: Exclude<PaymentMethod, null>) => void;
    onConfirmPayment: () => void;
    onRevealResult: () => void;
    onSaveAnonymousResult: () => void;
  } = $props();

  let promoCode = $state('');
  let promoFeedback = $state('');
  let promoFeedbackTone = $state<'neutral' | 'success' | 'error'>('neutral');
  let promoEditorOpen = $state(false);

  function methodLabel(method: AuthMethod | PaymentMethod) {
    switch (method) {
      case 'wallet':
        return 'Wallet';
      case 'passkey':
        return 'Passkey';
      case 'linked-wallet':
        return 'Passkey + linked wallet';
      case 'promo':
        return 'Promo';
      case 'reown':
        return 'Reown / WalletConnect';
      case 'deposit':
        return 'Deposit';
      case 'other':
        return 'Other';
      case 'anonymous':
        return 'Anonymous';
      default:
        return 'Pending';
    }
  }

  function applyPromoCode() {
    const normalized = promoCode.trim().toUpperCase();

    if (!normalized) {
      promoFeedback = paymentLabels.promoEmpty;
      promoFeedbackTone = 'error';
      return;
    }

    if (normalized === 'WELCOME10') {
      promoFeedback = paymentLabels.promoOk;
      promoFeedbackTone = 'success';
      onSelectDepositMethod('promo');
      return;
    }

    promoFeedback = paymentLabels.promoWrong;
    promoFeedbackTone = 'error';
  }

  function openPromoEditor() {
    promoEditorOpen = true;
    promoFeedback = '';
    promoFeedbackTone = 'neutral';
  }

  $effect(() => {
    if (paymentMethod === 'promo') {
      promoEditorOpen = true;
    }
  });
</script>

<article class="kefine-card kefine-card--wide kefine-order-flow">
  <section class="kefine-flow-panel">
    <div class="kefine-section-head">
      <p>{paymentLabels.summaryTitle}</p>
      <span class="kefine-payment-chip">{labels.selectedMethod}: {methodLabel(selectedAuthMethod ?? paymentMethod)}</span>
    </div>

    <div class="kefine-payment-summary">
      <div>
        <small>{labels.taskId}</small>
        <strong>{currentOrder?.id}</strong>
      </div>
      <div>
        <small>{labels.amount}</small>
        <strong>{currentOrder?.estimatedCost} {currentOrder?.currency}</strong>
      </div>
      <div>
        <small>{labels.remainingBalance}</small>
        <strong data-testid="kefine-remaining-balance">{remainingAmount.toFixed(2).replace(/\.?0+$/, '')} {currentOrder?.currency}</strong>
      </div>
      <div>
        <small>{labels.executionEstimate}</small>
        <strong>{currentOrder?.executionEstimate}</strong>
      </div>
    </div>

    <div class="kefine-payment-meta">
      <p>{paymentLabels.promoHint}</p>
    </div>
  </section>

  <section class="kefine-flow-panel">
    <div class="kefine-section-head">
      <p>{paymentLabels.methodSelectTitle}</p>
    </div>

    {#if selectedAuthMethod === 'wallet'}
      <div class="kefine-action-card" data-testid="kefine-wallet-payment">
        <h3>{paymentLabels.walletReadyTitle}</h3>
        <p>{paymentLabels.payCtaHint}</p>
        <button type="button" data-variant="primary" data-testid="kefine-pay-now" onclick={onConfirmPayment}>{buttons.payNow}</button>
      </div>
    {:else if selectedAuthMethod === 'passkey'}
      <div class="kefine-action-card" data-testid="kefine-passkey-payment">
        <h3>{paymentLabels.passkeyReadyTitle}</h3>
        <p>{paymentLabels.linkedWalletHint}</p>
        <button type="button" data-variant="primary" data-testid="kefine-confirm-linked-wallet" onclick={onConfirmPayment}>
          {buttons.confirmLinkedWallet}
        </button>
      </div>
    {:else}
      <div class="kefine-action-card" data-testid="kefine-anonymous-payment">
        <h3>{paymentLabels.anonymousReadyTitle}</h3>
        <p>{paymentLabels.promoHint}</p>
        <div class="kefine-payment-choice-row">
          <button type="button" class="kefine-payment-choice" data-testid="kefine-open-deposit-dialog" onclick={onOpenDepositDialog}>
            <Icon icon="solar:card-send-linear" width="24" height="24" aria-hidden="true" />
            <span>{buttons.depositNow}</span>
          </button>
          <button type="button" class="kefine-payment-choice" data-testid="kefine-open-promo-editor" onclick={openPromoEditor}>
            <Icon icon="material-symbols:local-offer-outline-rounded" width="24" height="24" aria-hidden="true" />
            <span>{buttons.payWithPromo}</span>
          </button>
        </div>
        {#if promoEditorOpen}
          <div class="kefine-promo-block">
            <label class="kefine-promo-label" for="anonymous-promo-code">{paymentLabels.promoCodeLabel}</label>
            <div class="kefine-promo-row">
              <input
                id="anonymous-promo-code"
                class="kefine-promo-input"
                type="text"
                bind:value={promoCode}
                placeholder={paymentLabels.promoCodePlaceholder}
                autocomplete="off"
                data-testid="kefine-anonymous-promo-input"
              />
              <button type="button" data-variant="primary" data-testid="kefine-select-promo-payment" onclick={applyPromoCode}>
                {buttons.apply}
              </button>
            </div>
            {#if promoFeedback}
              <p class="kefine-promo-feedback" data-tone={promoFeedbackTone}>{promoFeedback}</p>
            {/if}
          </div>
        {/if}
      </div>
    {/if}

    {#if paymentStage === 'deposit-pending'}
      <div class="kefine-payment-status" data-testid="kefine-deposit-pending">
        <strong>{paymentLabels.depositPendingTitle}</strong>
        <p>{paymentLabels.depositPendingDetail}</p>
        <button type="button" data-variant="ghost" onclick={onRevealResult}>Continue to result</button>
      </div>
    {/if}

    {#if paymentStage === 'paid'}
      <div class="kefine-payment-status" data-testid="kefine-paid-state">
        <strong>{paymentLabels.paidTitle}</strong>
        <p>{paymentLabels.paidDetail}</p>
        <button type="button" data-variant="primary" data-testid="kefine-open-result" onclick={onRevealResult}>{buttons.openResult}</button>
      </div>
    {/if}
  </section>

  {#if depositDialogOpen}
    <section class="kefine-flow-panel kefine-deposit-dialog" data-testid="kefine-deposit-dialog">
      <div class="kefine-section-head">
        <p>{paymentLabels.depositDialogTitle}</p>
        <button type="button" data-variant="ghost" onclick={onCloseDepositDialog}>{buttons.closeDialog}</button>
      </div>
      <p class="kefine-flow-copy">{paymentLabels.depositDialogDetail}</p>
      <div class="kefine-deposit-options">
        <button type="button" class="kefine-deposit-option" data-testid="kefine-deposit-reown" onclick={() => onSelectDepositMethod('reown')}>
          Reown / WalletConnect
        </button>
        <button type="button" class="kefine-deposit-option" data-testid="kefine-deposit-promo" onclick={() => onSelectDepositMethod('promo')}>
          Promo + balance
        </button>
        <button type="button" class="kefine-deposit-option" data-testid="kefine-deposit-other" onclick={() => onSelectDepositMethod('other')}>
          Other methods
        </button>
      </div>
    </section>
  {/if}

  {#if paymentStage === 'result-ready'}
    <section class="kefine-flow-panel" data-testid="kefine-result-panel">
      <div class="kefine-section-head">
        <p>{labels.resultTitle}</p>
      </div>

      {#if resultSurface.type === 'widget'}
        <div class="kefine-result-card">
          <h3>{resultSurface.title}</h3>
          <p>{resultSurface.summary}</p>
          <button type="button" data-variant="primary">{resultSurface.ctaLabel}</button>
        </div>
      {:else if resultSurface.type === 'iframe'}
        <div class="kefine-result-card">
          <h3>{resultSurface.title}</h3>
          <p>{resultSurface.summary}</p>
          <iframe title={resultSurface.title} srcdoc={resultSurface.srcdoc}></iframe>
        </div>
      {:else}
        <div class="kefine-result-card">
          <h3>{resultSurface.title}</h3>
          <p>{resultSurface.summary}</p>
          <a href={resultSurface.href} target="_blank" rel="noreferrer">{resultSurface.ctaLabel}</a>
        </div>
      {/if}

      {#if selectedAuthMethod === 'anonymous'}
        <div class="kefine-anonymous-save">
          <p>{resultLabels.anonymousSaveHint}</p>
          <button type="button" data-variant="ghost" data-testid="kefine-save-result" onclick={onSaveAnonymousResult}>{buttons.saveResult}</button>
        </div>
      {/if}
    </section>
  {/if}

  <section class="kefine-flow-panel kefine-payment-footer">
    {#if selectedAuthMethod !== 'anonymous'}
      <a href={currentOrder?.paymentUrl ?? paymentInvoiceFallback} target="_blank" rel="noreferrer">
        {labels.paymentInvoice}
      </a>
    {/if}
    <button type="button" data-variant="ghost" onclick={onCreateNew}>{labels.createNewTask}</button>
  </section>
</article>
