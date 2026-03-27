<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { fade } from 'svelte/transition';
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
    isHydratingTitle = false,
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
    isHydratingTitle?: boolean;
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
      anonymousDetail: string;
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

  let visibleVpnSteps = $state(1);
  let elapsedSeconds = $state(0);
  let prefersReducedMotion = $state(false);
  let copiedSolverHandle = $state<string | null>(null);
  let vpnResultMode = $state<'entry' | 'guest-offer'>('entry');

  const isVpnScenario = $derived(execution.scenario === 'vpn-service' && execution.vpnFlow !== null);
  const vpnFlow = $derived(execution.vpnFlow);
  const genericSteps = $derived(
    execution.subtasks.length > 0
      ? execution.subtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          detail: subtask.detail,
          state: subtask.state
        }))
      : execution.stageItems.map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.detail,
          state: item.state
        }))
  );
  const activeVpnStep = $derived(vpnFlow ? vpnFlow.steps[Math.max(visibleVpnSteps - 1, 0)] : null);
  const activeGenericStepIndex = $derived.by(() => {
    const activeIndex = genericSteps.findIndex((step) => step.state === 'active');
    if (activeIndex >= 0) return activeIndex;

    const completedIndex = genericSteps.findLastIndex((step) => step.state === 'completed');
    return completedIndex >= 0 ? completedIndex : 0;
  });
  const activeGenericStep = $derived(genericSteps[activeGenericStepIndex] ?? null);
  const showVpnEstimate = $derived(Boolean(isVpnScenario && activeVpnStep?.revealExecutionEstimate));
  const showVpnWidget = $derived(Boolean(isVpnScenario && activeVpnStep?.revealWidget));
  const vpnFlowKey = $derived(isVpnScenario && currentOrder ? `${currentOrder.id}:${execution.scenario}` : null);
  const genericFlowKey = $derived(
    !isVpnScenario && currentOrder
      ? `${currentOrder.id}:${execution.stage}:${genericSteps.map((step) => `${step.id}:${step.state}`).join('|')}`
      : null
  );
  const motionDuration = $derived(prefersReducedMotion ? 0 : 260);
  const formattedElapsed = $derived(formatElapsed(elapsedSeconds));
  const vpnProgressPercent = $derived(
    vpnFlow ? Math.max(18, Math.round((visibleVpnSteps / vpnFlow.steps.length) * 100)) : 0
  );
  const genericProgressPercent = $derived(
    genericSteps.length > 0 ? Math.max(18, Math.round(((activeGenericStepIndex + 1) / genericSteps.length) * 100)) : 0
  );
  const copyFeedbackLabel = 'Copied';
  const vpnStepHeadline = $derived(
    activeVpnStep ? `${vpnFlow?.labels.step} ${visibleVpnSteps} ${vpnFlow?.labels.of} ${vpnFlow?.steps.length} - ${activeVpnStep.badge}` : ''
  );
  const genericStepHeadline = $derived(
    activeGenericStep
      ? `Step ${activeGenericStepIndex + 1} of ${Math.max(genericSteps.length, 1)} - ${activeGenericStep.title}`
      : execution.headline
  );

  function formatElapsed(totalSeconds: number) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  async function copySolverHandle(handle: string) {
    if (!browser || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(handle);
      copiedSolverHandle = handle;
      window.setTimeout(() => {
        if (copiedSolverHandle === handle) {
          copiedSolverHandle = null;
        }
      }, 1400);
    } catch {
      copiedSolverHandle = null;
    }
  }

  function stepBackward() {
    if (!vpnFlow) return;
    visibleVpnSteps = Math.max(1, visibleVpnSteps - 1);
  }

  function stepForward() {
    if (!vpnFlow) return;
    visibleVpnSteps = Math.min(vpnFlow.steps.length, visibleVpnSteps + 1);
  }

  function getSolverInitial(handle: string, name: string) {
    const normalizedHandle = handle.trim().replace(/^@+/, '');
    const firstFromHandle = normalizedHandle.charAt(0);
    if (firstFromHandle) {
      return firstFromHandle.toUpperCase();
    }

    const firstFromName = name.trim().charAt(0);
    return firstFromName ? firstFromName.toUpperCase() : '?';
  }

  function openVpnGuestOffer() {
    vpnResultMode = 'guest-offer';
  }

  $effect(() => {
    const flowKey = isVpnScenario ? vpnFlowKey : genericFlowKey;
    const currentVpnFlow = vpnFlow;

    if (!browser || !flowKey) {
      visibleVpnSteps = 1;
      elapsedSeconds = 0;
      prefersReducedMotion = false;
      return;
    }

    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    visibleVpnSteps = 1;
    elapsedSeconds = 0;
    vpnResultMode = 'entry';

    const intervalId = window.setInterval(() => {
      elapsedSeconds += 1;
    }, 1000);

    if (!isVpnScenario || !currentVpnFlow) {
      return () => {
        window.clearInterval(intervalId);
      };
    }

    if (prefersReducedMotion) {
      visibleVpnSteps = currentVpnFlow.steps.length;
      return () => {
        window.clearInterval(intervalId);
      };
    }

    const timeoutIds = currentVpnFlow.stepDelaysMs
      .slice(1)
      .map((delay, index) =>
        window.setTimeout(() => {
          visibleVpnSteps = Math.min(index + 2, currentVpnFlow.steps.length);
        }, delay)
      );

    return () => {
      window.clearInterval(intervalId);
      for (const timeoutId of timeoutIds) {
        window.clearTimeout(timeoutId);
      }
    };
  });
</script>

<article class="kefine-card kefine-card--wide kefine-order-flow">
  <section class="kefine-flow-panel kefine-flow-panel--hero">
    <div class="kefine-flow-topline">
      <button type="button" class="kefine-flow-back" onclick={onCancel} aria-label={labels.cancel}>←</button>
    </div>

    {#if isHydratingTitle}
      <h2 class="kefine-title-skeleton" aria-label="Loading task title"></h2>
    {:else}
      <h2>{currentOrder?.title}</h2>
    {/if}

    {#if currentOrder?.description && currentOrder.description !== currentOrder.title}
      <p class="kefine-flow-copy">{currentOrder.description}</p>
    {/if}
  </section>

  {#if isVpnScenario && vpnFlow}
    <section class="kefine-flow-panel">
      <div class="kefine-section-head">
        <p>{vpnFlow.labels.scenario}</p>
        <div class="kefine-flow-badges">
          <span class="kefine-flow-badge kefine-flow-badge--timer">
            {vpnFlow.labels.timer}: {formattedElapsed}
          </span>
          {#if showVpnEstimate}
            <span class="kefine-flow-badge">
              {vpnFlow.labels.executionEstimate}: {currentOrder?.executionEstimate}
            </span>
          {/if}
        </div>
      </div>

      <section class="kefine-vpn-progress-panel">
        <div class="kefine-vpn-progress-meta">
          <strong>{vpnStepHeadline}</strong>
          <div class="kefine-vpn-progress-controls">
            <span>{vpnProgressPercent}%</span>
            <button type="button" class="kefine-vpn-arrow" aria-label="Previous step" onclick={stepBackward} disabled={visibleVpnSteps <= 1}>
              ←
            </button>
            <button
              type="button"
              class="kefine-vpn-arrow"
              aria-label="Next step"
              onclick={stepForward}
              disabled={visibleVpnSteps >= vpnFlow.steps.length}
            >
              →
            </button>
          </div>
        </div>
        <div class="kefine-vpn-progress-track" aria-hidden="true">
          <span class="kefine-vpn-progress-fill" style={`width: ${vpnProgressPercent}%`}></span>
        </div>

        {#if activeVpnStep}
          {#key activeVpnStep.id}
            <div class="kefine-vpn-stage-copy" in:fade={{ duration: motionDuration }} out:fade={{ duration: motionDuration }}>
              <div class="kefine-vpn-stage-meta">
                <span class="kefine-vpn-stage-label">{vpnFlow.labels.current}</span>
                <span class="kefine-flow-badge">
                  {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </span>
              </div>
              <div class="kefine-vpn-solver-row">
                <span class="kefine-vpn-solver-avatar" aria-hidden="true">
                  {getSolverInitial(activeVpnStep.solver.handle, activeVpnStep.solver.name)}
                </span>
                <div class="kefine-vpn-solver-copy">
                  <span class="kefine-vpn-solver-name">
                    <strong>{activeVpnStep.solver.name}</strong>
                    <span class="kefine-vpn-solver-actions">
                      <a
                        class="kefine-vpn-icon-action"
                        href={activeVpnStep.solver.profileUrl}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={vpnFlow.labels.profile}
                        title={vpnFlow.labels.profile}
                      >
                        <Icon icon="mdi:open-in-new" width="16" height="16" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        class="kefine-vpn-icon-action"
                        onclick={() => copySolverHandle(activeVpnStep.solver.handle)}
                        aria-label={copiedSolverHandle === activeVpnStep.solver.handle ? copyFeedbackLabel : vpnFlow.labels.copy}
                        title={copiedSolverHandle === activeVpnStep.solver.handle ? copyFeedbackLabel : vpnFlow.labels.copy}
                      >
                        <Icon
                          icon={copiedSolverHandle === activeVpnStep.solver.handle ? 'mdi:check' : 'mdi:content-copy'}
                          width="14"
                          height="14"
                          aria-hidden="true"
                        />
                      </button>
                    </span>
                  </span>
                  <span>{activeVpnStep.solver.handle}</span>
                </div>
              </div>
              {#if !showVpnWidget}
                <h3>{activeVpnStep.title}</h3>
                <p>{activeVpnStep.detail}</p>
              {/if}
            </div>
          {/key}
        {/if}

      </section>

    </section>

    {#if showVpnWidget}
      <section class="kefine-flow-panel" in:fade={{ duration: motionDuration }} data-testid="kefine-vpn-widget-panel">
        <div class="kefine-vpn-widget-surface">
          <div class="kefine-vpn-widget-body">
            <strong>{vpnFlow.widget.title}</strong>
            <p>{vpnFlow.widget.summary}</p>
            {#if activeVpnStep?.instructions && activeVpnStep.instructions.length > 0}
              <div class="kefine-vpn-instruction-list">
                {#each activeVpnStep.instructions as instruction}
                  <article class="kefine-vpn-instruction-card">
                    <strong>{instruction.title}</strong>
                    <p>{instruction.detail}</p>
                  </article>
                {/each}
              </div>
            {/if}
            <div class="kefine-vpn-widget-lines" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <div class="kefine-vpn-widget-overlay"></div>
          <div class="kefine-vpn-widget-gate">
            {#if vpnResultMode === 'entry'}
              <span class="kefine-flow-badge kefine-flow-badge--timer">
                {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
              </span>
              <strong>Open result</strong>
              <p>Choose how to continue to the solver result.</p>
              <div class="kefine-vpn-widget-actions kefine-auth-grid">
                <button type="button" class="kefine-auth-tile kefine-auth-tile--wallet" onclick={onWalletLogin}>
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
                  <strong>Login</strong>
                </button>

                <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous" onclick={openVpnGuestOffer}>
                  <div class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true">
                    <span class="kefine-test-badge">10 min</span>
                  </div>
                  <strong>Test Now</strong>
                </button>

                <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey" onclick={onPasskeyLogin}>
                  <div class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
                    <span class="kefine-auth-icon">
                      <Icon icon={authIcons.passkey} width="100%" height="100%" aria-hidden="true" />
                    </span>
                  </div>
                  <strong>Passkey</strong>
                </button>
              </div>
            {:else}
              <span class="kefine-flow-badge kefine-flow-badge--timer">
                {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
              </span>
              <strong>Guest access ready</strong>
              <p>The background changed to guest mode. Test the VPN for 10 minutes or pay for permanent access.</p>
              <div class="kefine-vpn-download-card">
                <div class="kefine-vpn-download-actions">
                  <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onAnonymous}>
                    Test for 10 minutes
                  </button>
                  <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onWalletLogin}>
                    Pay for permanent access
                  </button>
                </div>
                <div class="kefine-vpn-download-copy">
                  <strong>Download info</strong>
                  <p>1. Download the VPN profile bundle from the solver result page.</p>
                  <p>2. Import the `.conf` file into WireGuard or your selected VPN client.</p>
                  <p>3. Keep the QR code nearby for mobile import and save the fallback credentials file.</p>
                  <p>4. The guest test stays available for 10 minutes, then the profile expires automatically.</p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </section>
    {/if}
  {:else}
    <section class="kefine-flow-panel">
      <div class="kefine-section-head">
        <p>{execution.eyebrow}</p>
        <div class="kefine-flow-badges">
          <span class="kefine-flow-badge kefine-flow-badge--timer">{labels.timeLeft}: {formattedElapsed}</span>
          <span class="kefine-flow-badge">{labels.timeLeft}: {execution.secondaryMetric.value} {execution.secondaryMetric.unit}</span>
          <span class="kefine-flow-badge">{labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}</span>
        </div>
      </div>

      <section class="kefine-vpn-progress-panel">
        <div class="kefine-vpn-progress-meta">
          <strong>{genericStepHeadline}</strong>
          <span>{genericProgressPercent}%</span>
        </div>
        <div class="kefine-vpn-progress-track" aria-hidden="true">
          <span class="kefine-vpn-progress-fill" style={`width: ${genericProgressPercent}%`}></span>
        </div>

        <div class="kefine-vpn-stage-copy">
          <div class="kefine-vpn-stage-meta">
            <span class="kefine-vpn-stage-label">Now</span>
            <span class="kefine-flow-badge">{labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}</span>
          </div>
          {#if currentOrder?.solver}
            <div class="kefine-vpn-solver-row">
              <span class="kefine-vpn-solver-avatar" aria-hidden="true">
                {getSolverInitial(currentOrder.solver, currentOrder.solver)}
              </span>
              <div class="kefine-vpn-solver-copy">
                <span class="kefine-vpn-solver-name">
                  <strong>{currentOrder.solver}</strong>
                </span>
              </div>
            </div>
          {/if}
          {#if activeGenericStep}
            <h3>{activeGenericStep.title}</h3>
            <p>{activeGenericStep.detail}</p>
          {:else}
            <h3>{execution.headline}</h3>
            <p>{execution.supportingText}</p>
          {/if}

          {#if genericSteps.length > 1}
            <div class="kefine-vpn-instruction-list" data-testid="kefine-subtask-list">
              {#each genericSteps as stepItem, index}
                <article class="kefine-vpn-instruction-card" data-state={stepItem.state}>
                  <strong>Step {index + 1}</strong>
                  <p>{stepItem.title}</p>
                </article>
              {/each}
            </div>
          {/if}
        </div>
      </section>
    </section>
  {/if}

  {#if !isVpnScenario}
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
            <span class="kefine-test-badge">10</span>
          </div>
          <strong>{authLabels.anonymousTitle}</strong>
          <small>{authLabels.anonymousDetail}</small>
        </button>
      </div>
    </section>
  {/if}
</article>
