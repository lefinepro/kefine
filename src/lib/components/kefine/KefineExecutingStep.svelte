<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import type { AuthMethod, ExecutionPresentation, OrderView } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineWalletProviderGrid from '$lib/components/kefine/KefineWalletProviderGrid.svelte';
  import KefineVpnGuide from '$lib/components/kefine/KefineVpnGuide.svelte';
  import { KEFINE_AUTH_ICONS } from '$lib/components/kefine/kefine-auth-constants';

  let {
    currentOrder,
    execution,
    isHydratingTitle = false,
    forceFinalVpnStep = false,
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
    forceFinalVpnStep?: boolean;
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
      walletLabel: string | null;
      passkeyLabel: string | null;
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
  let cancelCopyFeedback: (() => void) | null = null;

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
  const orderCompleted = $derived(currentOrder?.status === 'completed' || currentOrder?.status === 'done');
  const showVpnEstimate = $derived(Boolean(isVpnScenario && activeVpnStep?.revealExecutionEstimate));
  const showVpnWidget = $derived(Boolean(isVpnScenario && activeVpnStep?.revealWidget));
  const showResolvedVpnWidget = $derived(Boolean(showVpnWidget && (forceFinalVpnStep || orderCompleted)));
  const vpnFlowKey = $derived(isVpnScenario && currentOrder ? `${currentOrder.id}:${execution.scenario}` : null);
  const genericFlowKey = $derived(
    !isVpnScenario && currentOrder
      ? `${currentOrder.id}:${execution.stage}:${genericSteps.map((step) => `${step.id}:${step.state}`).join('|')}`
      : null
  );
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
      cancelCopyFeedback?.();
      cancelCopyFeedback = scheduleAfter(1400, () => {
        if (copiedSolverHandle === handle) {
          copiedSolverHandle = null;
        }
        cancelCopyFeedback = null;
      });
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

  function mistDissolve(_: Element): TransitionConfig {
    return {
      duration: prefersReducedMotion ? 0 : 540,
      easing: cubicOut,
      css: (t, u) => {
        const blur = u * 8;
        const scale = 0.99 + t * 0.01;
        return `
          opacity: ${t};
          transform: scale(${scale});
          filter: blur(${blur}px);
        `;
      }
    };
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
    visibleVpnSteps = currentVpnFlow && forceFinalVpnStep ? currentVpnFlow.steps.length : 1;
    elapsedSeconds = 0;
    vpnResultMode = 'entry';
    let frameId = 0;
    let effectCancelled = false;
    let elapsedStart: number | null = null;
    const cancelStepTransitions: Array<() => void> = [];

    const tickElapsed = (timestamp: number) => {
      if (effectCancelled) {
        return;
      }

      if (elapsedStart === null) {
        elapsedStart = timestamp;
      }

      elapsedSeconds = Math.floor((timestamp - elapsedStart) / 1000);
      frameId = window.requestAnimationFrame(tickElapsed);
    };

    frameId = window.requestAnimationFrame(tickElapsed);

    if (!isVpnScenario || !currentVpnFlow) {
      return () => {
        effectCancelled = true;
        window.cancelAnimationFrame(frameId);
      };
    }

    if (forceFinalVpnStep) {
      visibleVpnSteps = currentVpnFlow.steps.length;
      return () => {
        effectCancelled = true;
        window.cancelAnimationFrame(frameId);
      };
    }

    if (prefersReducedMotion) {
      visibleVpnSteps = currentVpnFlow.steps.length;
      return () => {
        effectCancelled = true;
        window.cancelAnimationFrame(frameId);
      };
    }

    currentVpnFlow.stepDelaysMs.slice(1).forEach((delay, index) => {
      cancelStepTransitions.push(
        scheduleAfter(delay, () => {
          visibleVpnSteps = Math.min(index + 2, currentVpnFlow.steps.length);
        })
      );
    });

    return () => {
      effectCancelled = true;
      window.cancelAnimationFrame(frameId);
      for (const cancelTransition of cancelStepTransitions) {
        cancelTransition();
      }
    };
  });
</script>

<article class="kefine-card kefine-card--wide kefine-order-flow">
  <section class="kefine-flow-panel kefine-flow-panel--hero">
    <lefine-box class="kefine-flow-topline">
      <button type="button" class="kefine-flow-back" onclick={onCancel} aria-label={labels.cancel}>←</button>
    </lefine-box>

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
      <lefine-box class="kefine-section-head">
        <p>{vpnFlow.labels.scenario}</p>
        <lefine-box class="kefine-flow-badges">
          <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
            {vpnFlow.labels.timer}: {formattedElapsed}
          </lefine-text>
          {#if showVpnEstimate}
            <lefine-text class="kefine-flow-badge">
              {vpnFlow.labels.executionEstimate}: {currentOrder?.executionEstimate}
            </lefine-text>
          {/if}
        </lefine-box>
      </lefine-box>

      <section class="kefine-vpn-progress-panel">
        <lefine-box class="kefine-vpn-progress-meta">
          <strong>{vpnStepHeadline}</strong>
          <lefine-box class="kefine-vpn-progress-controls">
            <lefine-text>{vpnProgressPercent}%</lefine-text>
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
          </lefine-box>
        </lefine-box>
        <lefine-box class="kefine-vpn-progress-track" aria-hidden="true">
          <lefine-text class="kefine-vpn-progress-fill" style={`width: ${vpnProgressPercent}%`}></lefine-text>
        </lefine-box>

        {#if activeVpnStep}
          {#key activeVpnStep.id}
            <lefine-box class="kefine-vpn-stage-copy" in:mistDissolve out:mistDissolve>
              <lefine-box class="kefine-vpn-stage-meta">
                <lefine-text class="kefine-vpn-stage-label">{vpnFlow.labels.current}</lefine-text>
                <lefine-text class="kefine-flow-badge">
                  {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </lefine-text>
              </lefine-box>
              <lefine-box class="kefine-vpn-solver-row">
                <lefine-text class="kefine-vpn-solver-avatar" aria-hidden="true">
                  {getSolverInitial(activeVpnStep.solver.handle, activeVpnStep.solver.name)}
                </lefine-text>
                <lefine-box class="kefine-vpn-solver-copy">
                  <lefine-text class="kefine-vpn-solver-name">
                    <strong>{activeVpnStep.solver.name}</strong>
                    <lefine-text class="kefine-vpn-solver-actions">
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
                    </lefine-text>
                  </lefine-text>
                  <lefine-text>{activeVpnStep.solver.handle}</lefine-text>
                </lefine-box>
              </lefine-box>
              {#if !showVpnWidget}
                <h3>{activeVpnStep.title}</h3>
                <p>{activeVpnStep.detail}</p>
              {/if}
            </lefine-box>
          {/key}
        {/if}

      </section>

    </section>

    {#if showVpnWidget}
      <section class="kefine-flow-panel" in:mistDissolve out:mistDissolve data-testid="kefine-vpn-widget-panel">
        <lefine-box class="kefine-vpn-widget-surface">
          {#if showResolvedVpnWidget}
            <lefine-box class="kefine-vpn-widget-body">
              <strong>{currentOrder?.vpnGuide?.title ?? vpnFlow.widget.title}</strong>
              <p>{currentOrder?.vpnGuide?.summary ?? vpnFlow.widget.summary}</p>
              {#if currentOrder?.vpnGuide}
                <KefineVpnGuide guide={currentOrder.vpnGuide} />
              {:else}
                <lefine-box class="kefine-vpn-widget-lines" aria-hidden="true">
                  <lefine-text></lefine-text>
                  <lefine-text></lefine-text>
                  <lefine-text></lefine-text>
                </lefine-box>
              {/if}
            </lefine-box>
          {:else}
            <lefine-box class="kefine-vpn-widget-body">
              <strong>{vpnFlow.widget.title}</strong>
              <p>{vpnFlow.widget.summary}</p>
              {#if activeVpnStep?.instructions && activeVpnStep.instructions.length > 0}
                <lefine-box class="kefine-vpn-instruction-list">
                  {#each activeVpnStep.instructions as instruction}
                    <article class="kefine-vpn-instruction-card">
                      <strong>{instruction.title}</strong>
                      <p>{instruction.detail}</p>
                    </article>
                  {/each}
                </lefine-box>
              {/if}
              <lefine-box class="kefine-vpn-widget-lines" aria-hidden="true">
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
              </lefine-box>
            </lefine-box>
            <lefine-box class="kefine-vpn-widget-overlay"></lefine-box>
            <lefine-box class="kefine-vpn-widget-gate">
              {#if vpnResultMode === 'entry'}
                <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
                  {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </lefine-text>
                <strong>Open result</strong>
                <p>Choose how to continue to the solver result.</p>
                <lefine-box class="kefine-vpn-widget-actions kefine-auth-grid">
                  <button type="button" class="kefine-auth-tile kefine-auth-tile--wallet" onclick={onWalletLogin}>
                    <lefine-box class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">
                      <KefineWalletProviderGrid />
                    </lefine-box>
                    <strong>Login</strong>
                  </button>

                  <button type="button" class="kefine-auth-tile kefine-auth-tile--anonymous" onclick={openVpnGuestOffer}>
                    <lefine-box class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true">
                      <lefine-text class="kefine-test-badge">10 min</lefine-text>
                    </lefine-box>
                    <strong>Test Now</strong>
                  </button>

                  <button type="button" class="kefine-auth-tile kefine-auth-tile--passkey" onclick={onPasskeyLogin}>
                    <lefine-box class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
                      <lefine-text class="kefine-auth-icon">
                        <Icon icon={KEFINE_AUTH_ICONS.passkey} width="100%" height="100%" aria-hidden="true" />
                      </lefine-text>
                    </lefine-box>
                    <strong>Passkey</strong>
                  </button>
                </lefine-box>
              {:else}
                <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
                  {vpnFlow.labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </lefine-text>
                <strong>Guest access ready</strong>
                <p>The background changed to guest mode. Test the VPN for 10 minutes or pay for permanent access.</p>
                <lefine-box class="kefine-vpn-download-card">
                  <lefine-box class="kefine-vpn-download-actions">
                    <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onAnonymous}>
                      Test for 10 minutes
                    </button>
                    <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onWalletLogin}>
                      Pay for permanent access
                    </button>
                  </lefine-box>
                  <lefine-box class="kefine-vpn-download-copy">
                    <strong>Download info</strong>
                    <p>1. Download the VPN profile bundle from the solver result page.</p>
                    <p>2. Import the `.conf` file into WireGuard or your selected VPN client.</p>
                    <p>3. Keep the QR code nearby for mobile import and save the fallback credentials file.</p>
                    <p>4. The guest test stays available for 10 minutes, then the profile expires automatically.</p>
                  </lefine-box>
                </lefine-box>
              {/if}
            </lefine-box>
          {/if}
        </lefine-box>
      </section>
    {/if}
  {:else}
    <section class="kefine-flow-panel">
      <lefine-box class="kefine-section-head">
        <p>{execution.eyebrow}</p>
        <lefine-box class="kefine-flow-badges">
          <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">{labels.timeLeft}: {formattedElapsed}</lefine-text>
          <lefine-text class="kefine-flow-badge">{labels.timeLeft}: {execution.secondaryMetric.value} {execution.secondaryMetric.unit}</lefine-text>
          <lefine-text class="kefine-flow-badge" data-testid="kefine-price-metric">{labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}</lefine-text>
        </lefine-box>
      </lefine-box>

      <section class="kefine-vpn-progress-panel">
        <lefine-box class="kefine-vpn-progress-meta">
          <strong>{genericStepHeadline}</strong>
          <lefine-text>{genericProgressPercent}%</lefine-text>
        </lefine-box>
        <lefine-box class="kefine-vpn-progress-track" aria-hidden="true">
          <lefine-text class="kefine-vpn-progress-fill" style={`width: ${genericProgressPercent}%`}></lefine-text>
        </lefine-box>

        <lefine-box class="kefine-vpn-stage-copy">
          <lefine-box class="kefine-vpn-stage-meta">
            <lefine-text class="kefine-vpn-stage-label">Now</lefine-text>
            <lefine-text class="kefine-flow-badge">{labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}</lefine-text>
          </lefine-box>
          {#if currentOrder?.solver}
            <lefine-box class="kefine-vpn-solver-row" data-testid="kefine-solver-fallback">
              <lefine-text class="kefine-vpn-solver-avatar" aria-hidden="true">
                {getSolverInitial(currentOrder.solver, currentOrder.solver)}
              </lefine-text>
              <lefine-box class="kefine-vpn-solver-copy">
                <lefine-text class="kefine-vpn-solver-name">
                  <strong>{currentOrder.solver}</strong>
                </lefine-text>
              </lefine-box>
            </lefine-box>
          {/if}
          {#if activeGenericStep}
            <h3>{activeGenericStep.title}</h3>
            <p>{activeGenericStep.detail}</p>
          {:else}
            <h3>{execution.headline}</h3>
            <p>{execution.supportingText}</p>
          {/if}

          {#if genericSteps.length > 1}
            <lefine-box class="kefine-vpn-instruction-list" data-testid="kefine-subtask-list">
              {#each genericSteps as stepItem, index}
                <article class="kefine-vpn-instruction-card" data-state={stepItem.state}>
                  <strong>Step {index + 1}</strong>
                  <p>{stepItem.title}</p>
                </article>
              {/each}
            </lefine-box>
          {/if}
        </lefine-box>
      </section>
    </section>
  {/if}

  {#if !isVpnScenario}
    <section class="kefine-flow-panel">
      <lefine-box class="kefine-section-head">
        <p>{labels.chooseMethod}</p>
      </lefine-box>

      <lefine-box class="kefine-auth-grid">
        <button
          type="button"
          class="kefine-auth-tile kefine-auth-tile--wallet"
          data-active={authDisplay.activeMethod === 'wallet'}
          data-testid="kefine-wallet-tile"
          onclick={onWalletLogin}
        >
          <lefine-box class="kefine-auth-hero kefine-auth-hero--wallet" aria-hidden="true">
            <KefineWalletProviderGrid />
          </lefine-box>
          {#if authDisplay.walletLabel}
            <strong>{authDisplay.walletLabel}</strong>
          {/if}
          {#if authDisplay.activeMethod === 'wallet'}
            <small>{authDisplay.walletLabel ? walletNetworkLabel : `${authLabels.walletAccount}: ${walletNetworkLabel}`}</small>
          {/if}
        </button>

        <button
          type="button"
          class="kefine-auth-tile kefine-auth-tile--passkey"
          data-active={authDisplay.activeMethod === 'passkey'}
          data-testid="kefine-passkey-tile"
          onclick={onPasskeyLogin}
        >
          <lefine-box class="kefine-auth-hero kefine-auth-hero--passkey" aria-hidden="true">
            <lefine-text class="kefine-auth-icon">
              <Icon icon={KEFINE_AUTH_ICONS.passkey} width="100%" height="100%" aria-hidden="true" />
            </lefine-text>
          </lefine-box>
          <strong>{authLabels.passkeyTitle}</strong>
          {#if authDisplay.passkeyLabel}
            <small>{authDisplay.passkeyLabel}</small>
          {/if}
        </button>

        <button
          type="button"
          class="kefine-auth-tile kefine-auth-tile--anonymous"
          data-active={authDisplay.activeMethod === 'anonymous'}
          data-testid="kefine-anonymous-tile"
          onclick={onAnonymous}
        >
          <lefine-box class="kefine-auth-hero kefine-auth-hero--guest" aria-hidden="true">
            <lefine-text class="kefine-test-badge">10</lefine-text>
          </lefine-box>
          <strong>{authLabels.anonymousTitle}</strong>
          <small>{authLabels.anonymousDetail}</small>
        </button>
      </lefine-box>
    </section>
  {/if}
</article>
