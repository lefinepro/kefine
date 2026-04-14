<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import type { AuthMethod, ExecutionPresentation, OrderView } from './kefine-workflow';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineWalletProviderGrid from '$lib/components/kefine/KefineWalletProviderGrid.svelte';
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

  let elapsedSeconds = $state(0);
  let prefersReducedMotion = $state(false);
  let copiedSolverHandle = $state<string | null>(null);
  let vpnResultMode = $state<'entry' | 'guest-offer'>('entry');
  let cancelCopyFeedback: (() => void) | null = null;

  const isVpnScenario = $derived(execution.scenario === 'vpn-service');
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
  const activeGenericStepIndex = $derived.by(() => {
    const activeIndex = genericSteps.findIndex((step) => step.state === 'active');
    if (activeIndex >= 0) return activeIndex;

    const completedIndex = genericSteps.findLastIndex((step) => step.state === 'completed');
    return completedIndex >= 0 ? completedIndex : 0;
  });
  const activeGenericStep = $derived(genericSteps[activeGenericStepIndex] ?? null);
  const orderCompleted = $derived(currentOrder?.status === 'completed' || currentOrder?.status === 'done');
  const showVpnWidget = $derived(Boolean(isVpnScenario && (forceFinalVpnStep || orderCompleted)));
  const vpnFlowKey = $derived(isVpnScenario && currentOrder ? `${currentOrder.id}:${execution.scenario}:${currentOrder.status}` : null);
  const genericFlowKey = $derived(
    !isVpnScenario && currentOrder
      ? `${currentOrder.id}:${execution.stage}:${genericSteps.map((step) => `${step.id}:${step.state}`).join('|')}`
      : null
  );
  const formattedElapsed = $derived(formatElapsed(elapsedSeconds));
  const vpnProgressPercent = $derived(
    orderCompleted ? 100 : execution.stage === 'bridging' ? 78 : execution.stage === 'competition' ? 42 : 18
  );
  const genericProgressPercent = $derived(
    genericSteps.length > 0 ? Math.max(18, Math.round(((activeGenericStepIndex + 1) / genericSteps.length) * 100)) : 0
  );
  const copyFeedbackLabel = 'Copied';
  const vpnStepHeadline = $derived(orderCompleted ? 'VPN package ready' : execution.headline);
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

    if (!browser || !flowKey) {
      elapsedSeconds = 0;
      prefersReducedMotion = false;
      return;
    }

    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    elapsedSeconds = 0;
    vpnResultMode = 'entry';
    let frameId = 0;
    let effectCancelled = false;
    let elapsedStart: number | null = null;

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

    return () => {
      effectCancelled = true;
      window.cancelAnimationFrame(frameId);
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

  {#if isVpnScenario}
    <section class="kefine-flow-panel">
      <lefine-box class="kefine-section-head">
        <p>VPN service runbook</p>
        <lefine-box class="kefine-flow-badges">
          <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
            ETA: {formattedElapsed}
          </lefine-text>
          {#if currentOrder?.executionEstimate}
            <lefine-text class="kefine-flow-badge">
              Execution window: {currentOrder?.executionEstimate}
            </lefine-text>
          {/if}
        </lefine-box>
      </lefine-box>

      <lef-flow-progress-panel>
        <lef-flow-progress-meta>
          <strong>{vpnStepHeadline}</strong>
          <lef-flow-progress-controls>
            <lefine-text>{vpnProgressPercent}%</lefine-text>
          </lef-flow-progress-controls>
        </lef-flow-progress-meta>
        <lef-flow-progress-track aria-hidden="true">
          <progress value={vpnProgressPercent} max="100"></progress>
        </lef-flow-progress-track>

        <lef-flow-stage-copy in:mistDissolve out:mistDissolve>
          <lef-flow-stage-meta>
            <lef-flow-stage-label>Current phase</lef-flow-stage-label>
            <lefine-text class="kefine-flow-badge">
              Price: {execution.primaryMetric.value} {execution.primaryMetric.unit}
            </lefine-text>
          </lef-flow-stage-meta>
          {#if currentOrder?.solver}
            <lef-solver-row>
              <lef-solver-avatar aria-hidden="true">
                {getSolverInitial(currentOrder.solverHandle || currentOrder.solverName || currentOrder.solver, currentOrder.solver)}
              </lef-solver-avatar>
              <lef-solver-copy>
                <lef-solver-name>
                  <strong>{currentOrder.solverName || currentOrder.solver}</strong>
                  <lef-solver-actions>
                    {#if currentOrder.solverProfileUrl}
                      <lef-icon-action>
                        <a
                          href={currentOrder.solverProfileUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Solver profile"
                          title="Solver profile"
                        >
                          <Icon icon="mdi:open-in-new" width="16" height="16" aria-hidden="true" />
                        </a>
                      </lef-icon-action>
                    {/if}
                    {#if currentOrder.solverHandle}
                      <lef-icon-action>
                        <button
                          type="button"
                          onclick={() => copySolverHandle(currentOrder.solverHandle || '')}
                          aria-label={copiedSolverHandle === currentOrder.solverHandle ? copyFeedbackLabel : 'Copy solver handle'}
                          title={copiedSolverHandle === currentOrder.solverHandle ? copyFeedbackLabel : 'Copy solver handle'}
                        >
                          <Icon
                            icon={copiedSolverHandle === currentOrder.solverHandle ? 'mdi:check' : 'mdi:content-copy'}
                            width="14"
                            height="14"
                            aria-hidden="true"
                          />
                        </button>
                      </lef-icon-action>
                    {/if}
                  </lef-solver-actions>
                </lef-solver-name>
                {#if currentOrder.solverHandle}
                  <lefine-text>{currentOrder.solverHandle}</lefine-text>
                {/if}
              </lef-solver-copy>
            </lef-solver-row>
          {/if}
          <h3>{execution.headline}</h3>
          <p>{execution.supportingText}</p>
        </lef-flow-stage-copy>

      </lef-flow-progress-panel>

    </section>

    {#if showVpnWidget}
      <section class="kefine-flow-panel" in:mistDissolve out:mistDissolve data-testid="lef-result-preview-panel">
        <lef-result-preview-surface>
          {#if forceFinalVpnStep || orderCompleted}
            <lef-result-preview-body>
              <strong>VPN delivery widget</strong>
              <p>The solver package is ready to be opened after authentication and payment are confirmed.</p>
              <lef-result-preview-lines aria-hidden="true">
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
              </lef-result-preview-lines>
            </lef-result-preview-body>
          {:else}
            <lef-result-preview-body>
              <strong>VPN delivery widget</strong>
              <p>The solver package is ready to be opened after authentication and payment are confirmed.</p>
              <lef-result-preview-lines aria-hidden="true">
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
                <lefine-text></lefine-text>
              </lef-result-preview-lines>
            </lef-result-preview-body>
            <lef-result-preview-overlay></lef-result-preview-overlay>
            <lef-result-preview-gate>
              {#if vpnResultMode === 'entry'}
                <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
                  Price: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </lefine-text>
                <strong>Open result</strong>
                <p>Choose how to continue to the solver result.</p>
                <lef-result-preview-actions class="kefine-auth-grid">
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
                </lef-result-preview-actions>
              {:else}
                <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
                  Price: {execution.primaryMetric.value} {execution.primaryMetric.unit}
                </lefine-text>
                <strong>Guest access ready</strong>
                <p>The background changed to guest mode. Test the VPN for 10 minutes or pay for permanent access.</p>
                <lef-download-card>
                  <lef-download-actions>
                    <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onAnonymous}>
                      Test for 10 minutes
                    </button>
                    <button type="button" class="kefine-flow-badge kefine-flow-badge--button" onclick={onWalletLogin}>
                      Pay for permanent access
                    </button>
                  </lef-download-actions>
                  <lef-download-copy>
                    <strong>Download info</strong>
                    <p>1. Download the VPN profile bundle from the solver result page.</p>
                    <p>2. Import the `.conf` file into WireGuard or your selected VPN client.</p>
                    <p>3. Keep the QR code nearby for mobile import and save the fallback credentials file.</p>
                    <p>4. The guest test stays available for 10 minutes, then the profile expires automatically.</p>
                  </lef-download-copy>
                </lef-download-card>
              {/if}
            </lef-result-preview-gate>
          {/if}
        </lef-result-preview-surface>
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

      <lef-flow-progress-panel>
        <lef-flow-progress-meta>
          <strong>{genericStepHeadline}</strong>
          <lefine-text>{genericProgressPercent}%</lefine-text>
        </lef-flow-progress-meta>
        <lef-flow-progress-track aria-hidden="true">
          <progress value={genericProgressPercent} max="100"></progress>
        </lef-flow-progress-track>

        <lef-flow-stage-copy>
          <lef-flow-stage-meta>
            <lef-flow-stage-label>Now</lef-flow-stage-label>
            <lefine-text class="kefine-flow-badge">{labels.price}: {execution.primaryMetric.value} {execution.primaryMetric.unit}</lefine-text>
          </lef-flow-stage-meta>
          {#if currentOrder?.solver}
            <lef-solver-row data-testid="kefine-solver-fallback">
              <lef-solver-avatar aria-hidden="true">
                {getSolverInitial(currentOrder.solverName || currentOrder.solver, currentOrder.solver)}
              </lef-solver-avatar>
              <lef-solver-copy>
                <lef-solver-name>
                  <strong>{currentOrder.solverName || currentOrder.solver}</strong>
                  {#if currentOrder.solverHandle}
                    <lefine-text>{currentOrder.solverHandle}</lefine-text>
                  {/if}
                  {#if currentOrder.solverProfileUrl}
                    <lef-solver-link>
                      <a href={currentOrder.solverProfileUrl} target="_blank" rel="noopener noreferrer">
                        <Icon icon="mdi:open-in-new" width="14" height="14" />
                      </a>
                    </lef-solver-link>
                  {/if}
                </lef-solver-name>
              </lef-solver-copy>
            </lef-solver-row>
          {/if}
          {#if activeGenericStep}
            <h3>{activeGenericStep.title}</h3>
            <p>{activeGenericStep.detail}</p>
          {:else}
            <h3>{execution.headline}</h3>
            <p>{execution.supportingText}</p>
          {/if}

          {#if genericSteps.length > 1}
            <lef-flow-instruction-list data-testid="kefine-subtask-list">
              {#each genericSteps as stepItem, index}
                <lef-flow-instruction-card data-state={stepItem.state}>
                  <strong>Step {index + 1}</strong>
                  <p>{stepItem.title}</p>
                </lef-flow-instruction-card>
              {/each}
            </lef-flow-instruction-list>
          {/if}
        </lef-flow-stage-copy>
      </lef-flow-progress-panel>
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
