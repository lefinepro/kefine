<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { AuthMethod, ExecutionPresentation, OrderView } from './kefine-workflow';

  const walletProviders = [
    { icon: 'logos:metamask-icon', label: 'MetaMask', className: 'is-metamask' },
    { icon: 'simple-icons:walletconnect', label: 'WalletConnect', className: 'is-walletconnect' },
    { icon: 'material-symbols:alternate-email-rounded', label: 'Email', className: 'is-email' },
    { icon: 'logos:google-icon', label: 'Google', className: 'is-google' }
  ];

  const authIcons = {
    passkey: 'mdi:fingerprint',
    anonymous: 'mdi:incognito'
  } as const;

  let {
    currentOrder,
    execution,
    labels,
    authLabels,
    authDisplay,
    walletNetworkLabel,
    onWalletLogin,
    onPasskeyLogin,
    onAnonymous,
    onCancel
  }: {
    currentOrder: OrderView | null;
    execution: ExecutionPresentation;
    labels: {
      solver: string;
      subtasks: string;
      price: string;
      timeLeft: string;
      chooseMethod: string;
      cancel: string;
    };
    authLabels: {
      walletTitle: string;
      passkeyTitle: string;
      anonymousTitle: string;
      walletAccount: string;
    };
    authDisplay: {
      appIconUrl: string;
      socialAvatarUrl: string | null;
      passkeyAvatarUrl: string | null;
      actorAvatarUrl: string | null;
      activeMethod: AuthMethod;
    };
    walletNetworkLabel: string;
    onWalletLogin: () => void;
    onPasskeyLogin: () => void;
    onAnonymous: () => void;
    onCancel: () => void;
  } = $props();
</script>

<article class="kefine-card kefine-card--wide kefine-order-flow">
  <section class="kefine-flow-panel kefine-flow-panel--hero">
    <div class="kefine-flow-topline">
      <button type="button" class="kefine-flow-back" onclick={onCancel} aria-label={labels.cancel}>←</button>
    </div>

    <h2>{currentOrder?.title}</h2>
    {#if currentOrder?.description && currentOrder.description !== currentOrder.title}
      <p class="kefine-flow-copy">{currentOrder.description}</p>
    {/if}

  </section>

  <section class="kefine-flow-panel">
    <div class="kefine-section-head">
      <p>{labels.subtasks}</p>
      {#if currentOrder?.solver}
        <span class="kefine-solver-pill">{labels.solver} {currentOrder.solver}</span>
      {/if}
    </div>

    {#if execution.subtasks.length > 0}
      <ol class="kefine-subtask-list" data-testid="kefine-subtask-list">
        {#each execution.subtasks as subtask}
          <li class="kefine-subtask-item" data-state={subtask.state}>
            <span class="kefine-subtask-mark" aria-hidden="true"></span>
            <div>
              <strong>{subtask.title}</strong>
              <p>{subtask.detail}</p>
            </div>
          </li>
        {/each}
      </ol>
    {:else}
      <div class="kefine-solver-fallback" data-testid="kefine-solver-fallback">
        <strong>{currentOrder?.solver}</strong>
        <p>{execution.supportingText}</p>
      </div>
    {/if}
  </section>

  <section class="kefine-flow-panel kefine-metrics-grid">
    <div class="kefine-metric-card" data-testid="kefine-price-metric">
      <p>{labels.price}</p>
      <div class="kefine-metric-value">
        <strong>{execution.primaryMetric.value}</strong>
        <span>{execution.primaryMetric.unit}</span>
      </div>
    </div>

    <div class="kefine-metric-card" data-testid="kefine-time-metric">
      <p>{labels.timeLeft}</p>
      <div class="kefine-metric-value">
        <strong>{execution.secondaryMetric.value}</strong>
        <span>{execution.secondaryMetric.unit}</span>
      </div>
    </div>
  </section>

  <section class="kefine-flow-panel">
    <div class="kefine-section-head">
      <p>{labels.chooseMethod}</p>
    </div>

    <div class="kefine-auth-grid">
      <button
        type="button"
        class="kefine-auth-tile kefine-auth-tile--wallet"
        data-active={authDisplay.activeMethod === 'wallet'}
        data-testid="kefine-wallet-tile"
        onclick={onWalletLogin}
      >
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
        {#if authDisplay.activeMethod === 'wallet'}
          <small>{authLabels.walletAccount}: {walletNetworkLabel}</small>
        {/if}
      </button>

      <button
        type="button"
        class="kefine-auth-tile kefine-auth-tile--passkey"
        data-active={authDisplay.activeMethod === 'passkey'}
        data-testid="kefine-passkey-tile"
        onclick={onPasskeyLogin}
      >
        <div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
          <span class="kefine-auth-icon">
            <Icon icon={authIcons.passkey} width="100%" height="100%" aria-hidden="true" />
          </span>
        </div>
        <strong>{authLabels.passkeyTitle}</strong>
      </button>

      <button
        type="button"
        class="kefine-auth-tile kefine-auth-tile--anonymous"
        data-active={authDisplay.activeMethod === 'anonymous'}
        data-testid="kefine-anonymous-tile"
        onclick={onAnonymous}
      >
        <div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true">
          <span class="kefine-auth-icon">
            <Icon icon={authIcons.anonymous} width="100%" height="100%" aria-hidden="true" />
          </span>
        </div>
        <strong>{authLabels.anonymousTitle}</strong>
      </button>
    </div>
  </section>
</article>
