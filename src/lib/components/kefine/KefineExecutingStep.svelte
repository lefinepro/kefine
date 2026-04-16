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
    isConfirmingStep = false,
    commentSubmittingStepId = null,
    confirmCurrentStepLabel,
    onConfirmCurrentStep,
    onSubmitStepComment,
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
      exchangeWaiting: string;
      performers: string;
      notebook: string;
      iterations: string;
      interimResult: string;
      finalResult: string;
      leaveComment: string;
      noNotebookYet: string;
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
    isConfirmingStep?: boolean;
    commentSubmittingStepId?: string | null;
    confirmCurrentStepLabel?: string;
    onConfirmCurrentStep?: (() => void) | null;
    onSubmitStepComment?: ((stepId: string, content: string) => void | Promise<void>) | null;
    onWalletLogin: () => void;
    onPasskeyLogin: () => void;
    onAnonymous: () => void;
    onCancel: () => void;
  } = $props();

  let nowTimestamp = $state(Date.now());
  let prefersReducedMotion = $state(false);
  let copiedSolverHandle = $state<string | null>(null);
  let vpnResultMode = $state<'entry' | 'guest-offer'>('entry');
  let commentDrafts = $state<Record<string, string>>({});
  let cancelCopyFeedback: (() => void) | null = null;

  const isVpnScenario = $derived(execution.scenario === 'vpn-service');
  const genericSteps = $derived(
    execution.steps.length > 0
      ? execution.steps
      : execution.subtasks.length > 0
        ? execution.subtasks.map((subtask) => ({
            id: subtask.id,
            title: subtask.title,
            detail: subtask.detail,
            state: subtask.state,
            confirmation: undefined
          }))
        : execution.stageItems.map((item) => ({
            id: item.id,
            title: item.title,
            detail: item.detail,
            state: item.state,
            confirmation: undefined
          }))
  );
  const activeGenericStepIndex = $derived.by(() => {
    const activeIndex = genericSteps.findIndex((step) => step.state === 'active');
    if (activeIndex >= 0) return activeIndex;

    const completedIndex = genericSteps.findLastIndex((step) => step.state === 'completed');
    return completedIndex >= 0 ? completedIndex : 0;
  });
  const activeGenericStep = $derived(execution.activeStep ?? genericSteps[activeGenericStepIndex] ?? null);
  const executors = $derived(currentOrder?.executors ?? []);
  const notebookSteps = $derived(currentOrder?.notebook?.steps ?? []);
  const latestNotebookStep = $derived(notebookSteps.at(-1) ?? null);
  const solverIdentity = $derived.by(() => {
    const name = (currentOrder?.solverName || currentOrder?.solver || '').trim();
    const handle = (currentOrder?.solverHandle || '').trim();
    const profileUrl = (currentOrder?.solverProfileUrl || '').trim();
    const normalizedName = name.toLowerCase();
    const placeholderNames = new Set([
      '',
      'nordlayer solver',
      'open solver market',
      'solver',
      'default solver',
      'saved',
      'save'
    ]);

    const isReal = Boolean((handle || profileUrl) && !placeholderNames.has(normalizedName));

    return {
      name,
      handle,
      profileUrl,
      isReal
    };
  });
  const hasInterimResult = $derived(Boolean(currentOrder?.interimResult?.blocks?.length));
  const hasFinalResult = $derived(Boolean(currentOrder?.result?.blocks?.length));
  const showNotebookTimeline = $derived(
    !isVpnScenario && (notebookSteps.length > 0 || hasInterimResult || hasFinalResult)
  );
  const showExchangeWaiting = $derived(
    !isVpnScenario && ['queued', 'matching'].includes(execution.stage) && executors.length === 0 && !showNotebookTimeline
  );
  const showExecutorQueue = $derived(!isVpnScenario && executors.length > 1);
  const showSingleExecutor = $derived(!isVpnScenario && executors.length === 1);
  const orderCompleted = $derived(currentOrder?.status === 'completed' || currentOrder?.status === 'done');
  const showVpnWidget = $derived(Boolean(isVpnScenario && (forceFinalVpnStep || orderCompleted)));
  const vpnFlowKey = $derived(isVpnScenario && currentOrder ? `${currentOrder.id}:${execution.scenario}:${currentOrder.status}` : null);
  const genericFlowKey = $derived(
    !isVpnScenario && currentOrder
      ? `${currentOrder.id}:${execution.stage}:${genericSteps.map((step) => `${step.id}:${step.state}`).join('|')}:${notebookSteps.map((step) => step.id).join('|')}:${executors.map((executor) => `${executor.id}:${executor.status}`).join('|')}`
      : null
  );
  const plannedDurationSeconds = $derived(resolvePlannedDurationSeconds(currentOrder?.executionEstimate));
  const timerAnchorTimestamp = $derived(
    resolveTimerAnchorTimestamp(currentOrder?.startedAt, currentOrder?.assignedAt, latestNotebookStep?.createdAt, currentOrder?.createdAt)
  );
  const elapsedSeconds = $derived.by(() => {
    if (!timerAnchorTimestamp) {
      return 0;
    }

    return Math.max(0, Math.floor((nowTimestamp - timerAnchorTimestamp) / 1000));
  });
  const remainingSeconds = $derived.by(() => {
    if (!plannedDurationSeconds) {
      return 0;
    }

    return plannedDurationSeconds - elapsedSeconds;
  });
  const formattedRemaining = $derived(formatSignedDuration(remainingSeconds));
  const vpnProgressPercent = $derived(
    orderCompleted ? 100 : execution.stage === 'bridging' ? 78 : execution.stage === 'competition' ? 42 : 18
  );
  const genericProgressPercent = $derived(
    execution.progressPercent > 0
      ? execution.progressPercent
      : genericSteps.length > 0
        ? Math.max(18, Math.round(((activeGenericStepIndex + 1) / genericSteps.length) * 100))
        : execution.stage === 'completed'
          ? 100
          : execution.stage === 'review'
            ? 84
            : execution.stage === 'running'
              ? 62
              : execution.stage === 'assigned'
                ? 38
                : execution.stage === 'matching'
                  ? 24
                  : 12
  );
  const copyFeedbackLabel = 'Copied';
  const vpnStepHeadline = $derived(orderCompleted ? 'VPN package ready' : execution.headline);
  const genericStepHeadline = $derived(
    activeGenericStep ? activeGenericStep.title : execution.headline
  );

  function resolveTimerAnchorTimestamp(...timestamps: Array<string | undefined>) {
    const candidates = timestamps
      .map((value) => {
        if (!value) {
          return null;
        }

        const parsed = Date.parse(value);
        return Number.isFinite(parsed) ? parsed : null;
      })
      .filter((value): value is number => value !== null);

    return candidates[0] ?? null;
  }

  function resolvePlannedDurationSeconds(value?: string) {
    if (!value?.trim()) {
      return 3600;
    }

    const normalized = value.trim().toLowerCase();
    const numericMatch = normalized.match(/(\d+(?:[.,]\d+)?)/);
    const amount = numericMatch ? Number(numericMatch[1].replace(',', '.')) : 1;

    if (!Number.isFinite(amount) || amount <= 0) {
      return 3600;
    }

    if (normalized.includes('min') || normalized.includes('мин') || normalized.includes('րոպ')) {
      return Math.round(amount * 60);
    }

    return Math.round(amount * 3600);
  }

  function formatSignedDuration(totalSeconds: number) {
    const negative = totalSeconds < 0;
    const absolute = Math.abs(totalSeconds);
    const hours = Math.floor(absolute / 3600);
    const minutes = Math.floor((absolute % 3600) / 60);
    const seconds = absolute % 60;
    const prefix = negative ? '-' : '';
    return `${prefix}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
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

  function getExecutorInitial(name: string, handle?: string) {
    return getSolverInitial(handle || name, name);
  }

  function getExecutorTone(status: string) {
    if (status === 'completed') return 'completed';
    if (status === 'failed') return 'failed';
    if (status === 'running' || status === 'review') return 'active';
    return 'upcoming';
  }

  async function submitStepComment(stepId: string) {
    const content = commentDrafts[stepId]?.trim();
    if (!content || !onSubmitStepComment) {
      return;
    }

    await onSubmitStepComment(stepId, content);
    commentDrafts = {
      ...commentDrafts,
      [stepId]: ''
    };
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
      nowTimestamp = Date.now();
      prefersReducedMotion = false;
      return;
    }

    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    nowTimestamp = Date.now();
    vpnResultMode = 'entry';
    let intervalId = 0;
    let effectCancelled = false;
    intervalId = window.setInterval(() => {
      if (effectCancelled) {
        return;
      }

      nowTimestamp = Date.now();
    }, 1000);

    return () => {
      effectCancelled = true;
      window.clearInterval(intervalId);
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
            <Icon icon="mdi:alarm" width="16" height="16" aria-hidden="true" />
            <span>{formattedRemaining}</span>
          </lefine-text>
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
          {#if solverIdentity.isReal}
            <lef-solver-row>
              <lef-solver-avatar aria-hidden="true">
                {getSolverInitial(solverIdentity.handle || solverIdentity.name, solverIdentity.name)}
              </lef-solver-avatar>
              <lef-solver-copy>
                <lef-solver-name>
                  <strong>{solverIdentity.name}</strong>
                  <lef-solver-actions>
                    {#if solverIdentity.profileUrl}
                      <lef-icon-action>
                        <a
                          href={solverIdentity.profileUrl}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Solver profile"
                          title="Solver profile"
                        >
                          <Icon icon="mdi:open-in-new" width="16" height="16" aria-hidden="true" />
                        </a>
                      </lef-icon-action>
                    {/if}
                    {#if solverIdentity.handle}
                      <lef-icon-action>
                        <button
                          type="button"
                          onclick={() => copySolverHandle(solverIdentity.handle)}
                          aria-label={copiedSolverHandle === solverIdentity.handle ? copyFeedbackLabel : 'Copy solver handle'}
                          title={copiedSolverHandle === solverIdentity.handle ? copyFeedbackLabel : 'Copy solver handle'}
                        >
                          <Icon
                            icon={copiedSolverHandle === solverIdentity.handle ? 'mdi:check' : 'mdi:content-copy'}
                            width="14"
                            height="14"
                            aria-hidden="true"
                          />
                        </button>
                      </lef-icon-action>
                    {/if}
                  </lef-solver-actions>
                </lef-solver-name>
                {#if solverIdentity.handle}
                  <lefine-text>{solverIdentity.handle}</lefine-text>
                {/if}
              </lef-solver-copy>
            </lef-solver-row>
          {/if}
          {#if solverIdentity.isReal}
            <h3>{execution.headline}</h3>
            <p>{execution.supportingText}</p>
          {:else}
            <lef-exchange-stage aria-label={execution.headline}>
              <lef-exchange-scene aria-hidden="true">
                <lef-exchange-hat>
                  <lef-exchange-hat-top></lef-exchange-hat-top>
                  <lef-exchange-hat-brim></lef-exchange-hat-brim>
                  <lef-exchange-hat-band></lef-exchange-hat-band>
                </lef-exchange-hat>
              </lef-exchange-scene>
            </lef-exchange-stage>
          {/if}
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
          <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
            <Icon icon="mdi:alarm" width="16" height="16" aria-hidden="true" />
            <span>{formattedRemaining}</span>
          </lefine-text>
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
            <lef-flow-stage-label>{showExchangeWaiting ? labels.exchangeWaiting : labels.performers}</lef-flow-stage-label>
          </lef-flow-stage-meta>
          {#if showExchangeWaiting}
            <lef-exchange-stage aria-label={execution.headline}>
              <lef-exchange-scene aria-hidden="true">
                <lef-exchange-hat>
                  <lef-exchange-hat-top></lef-exchange-hat-top>
                  <lef-exchange-hat-brim></lef-exchange-hat-brim>
                  <lef-exchange-hat-band></lef-exchange-hat-band>
                </lef-exchange-hat>
              </lef-exchange-scene>
            </lef-exchange-stage>
          {:else if showExecutorQueue}
            <lef-executor-list>
              {#each executors as executor}
                <lef-executor-card data-state={getExecutorTone(executor.status)}>
                  <lef-executor-rank>#{executor.rank ?? 0}</lef-executor-rank>
                  <lef-executor-avatar aria-hidden="true">
                    {getExecutorInitial(executor.name, executor.handle)}
                  </lef-executor-avatar>
                  <lef-executor-copy>
                    <strong>{executor.name}</strong>
                    {#if executor.handle}
                      <lefine-text>{executor.handle}</lefine-text>
                    {/if}
                    <p>{executor.resultSummary || executor.status}</p>
                  </lef-executor-copy>
                  {#if executor.progressPercent !== undefined}
                    <lef-executor-progress>{executor.progressPercent}%</lef-executor-progress>
                  {/if}
                </lef-executor-card>
              {/each}
            </lef-executor-list>
          {:else if showSingleExecutor && executors[0]}
            <lef-solver-row data-testid="kefine-solver-fallback">
              <lef-solver-avatar aria-hidden="true">
                {getExecutorInitial(executors[0].name, executors[0].handle)}
              </lef-solver-avatar>
              <lef-solver-copy>
                <lef-solver-name>
                  <strong>{executors[0].name}</strong>
                  {#if executors[0].handle}
                    <lefine-text>{executors[0].handle}</lefine-text>
                  {/if}
                  {#if executors[0].progressPercent !== undefined}
                    <lef-executor-progress>{executors[0].progressPercent}%</lef-executor-progress>
                  {/if}
                </lef-solver-name>
                {#if executors[0].resultSummary}
                  <p>{executors[0].resultSummary}</p>
                {/if}
              </lef-solver-copy>
            </lef-solver-row>
          {:else if currentOrder?.solver}
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
                </lef-solver-name>
              </lef-solver-copy>
            </lef-solver-row>
          {/if}

          {#if !showExchangeWaiting && activeGenericStep}
            <h3>{activeGenericStep.title}</h3>
            <p>{activeGenericStep.detail}</p>
            {#if activeGenericStep.confirmation?.required && activeGenericStep.confirmation?.confirmed !== true && onConfirmCurrentStep}
              <lef-flow-confirm>
                {#if activeGenericStep.confirmation?.detail}
                  <p>{activeGenericStep.confirmation.detail}</p>
                {/if}
                <button type="button" data-variant="primary" onclick={onConfirmCurrentStep} disabled={isConfirmingStep}>
                  {isConfirmingStep ? 'Confirming...' : (activeGenericStep.confirmation?.label || confirmCurrentStepLabel || 'Confirm step')}
                </button>
              </lef-flow-confirm>
            {/if}
          {:else if !showExchangeWaiting}
            <h3>{execution.headline}</h3>
            <p>{execution.supportingText}</p>
          {/if}

        {#if genericSteps.length > 1}
          <lef-flow-outline-list data-testid="kefine-subtask-list">
            {#each genericSteps as stepItem, index}
              <details data-state={stepItem.state} open={stepItem.state === 'active'}>
                  <summary>
                    <lef-flow-outline-row>
                      <strong>Step {index + 1}</strong>
                      <p>{stepItem.title}</p>
                    </lef-flow-outline-row>
                  </summary>
                  <lef-flow-outline-copy>
                    <p>{stepItem.detail}</p>
                  </lef-flow-outline-copy>
                </details>
              {/each}
            </lef-flow-outline-list>
          {/if}

          {#if showNotebookTimeline && notebookSteps.length > 0}
            <lef-flow-followup>
              <lef-notebook-timeline>
                {#each notebookSteps as notebookStep, index}
                  <details open={index === notebookSteps.length - 1}>
                    <summary>
                      <lef-notebook-summary>
                        <lef-notebook-step-tag>Step {index + 1}</lef-notebook-step-tag>
                        <lef-notebook-summary-copy>
                          <strong>{notebookStep.title}</strong>
                          {#if notebookStep.executorName}
                            <lefine-text>{notebookStep.executorName}</lefine-text>
                          {/if}
                        </lef-notebook-summary-copy>
                        <lef-notebook-state data-state={notebookStep.state}>{notebookStep.statusLabel || notebookStep.state}</lef-notebook-state>
                      </lef-notebook-summary>
                    </summary>

                    <lef-notebook-body>
                      {#if notebookStep.detail}
                        <p>{notebookStep.detail}</p>
                      {/if}

                      <lef-notebook-blocks>
                        {#each notebookStep.blocks as block}
                          <lef-notebook-block data-type={block.type}>
                            {#if block.title}
                              <strong>{block.title}</strong>
                            {/if}
                            {#if block.type === 'code' || block.type === 'diff' || block.type === 'output'}
                              <pre>{block.content}</pre>
                            {:else if block.type === 'artifact' && block.href}
                              <a href={block.href} target="_blank" rel="noreferrer">{block.title || block.href}</a>
                              {#if block.content}
                                <p>{block.content}</p>
                              {/if}
                            {:else}
                              <p>{block.content}</p>
                            {/if}
                          </lef-notebook-block>
                        {/each}
                      </lef-notebook-blocks>

                      {#if notebookStep.comments?.length}
                        <lef-step-comments>
                          {#each notebookStep.comments as comment}
                            <lef-step-comment>
                              <strong>{comment.authorName || comment.authorHandle || 'Comment'}</strong>
                              <p>{comment.content}</p>
                            </lef-step-comment>
                          {/each}
                        </lef-step-comments>
                      {/if}

                      <lef-step-comment-form>
                        <label for={`step-comment-${notebookStep.id}`}>{labels.leaveComment}</label>
                        <textarea
                          id={`step-comment-${notebookStep.id}`}
                          rows="3"
                          value={commentDrafts[notebookStep.id] || ''}
                          oninput={(event) => {
                            const target = event.currentTarget as HTMLTextAreaElement;
                            commentDrafts = { ...commentDrafts, [notebookStep.id]: target.value };
                          }}
                        ></textarea>
                        <button
                          type="button"
                          onclick={() => submitStepComment(notebookStep.id)}
                          disabled={!commentDrafts[notebookStep.id]?.trim() || commentSubmittingStepId === notebookStep.id}
                        >
                          {commentSubmittingStepId === notebookStep.id ? 'Sending...' : labels.leaveComment}
                        </button>
                      </lef-step-comment-form>
                    </lef-notebook-body>
                  </details>
                {/each}
              </lef-notebook-timeline>
            </lef-flow-followup>
          {/if}

          {#if hasInterimResult && currentOrder?.interimResult}
            <lef-flow-followup>
              <lef-result-section>
                <lef-result-head>
                  <strong>{labels.interimResult}</strong>
                  <p>{currentOrder.interimResult.title}</p>
                </lef-result-head>
                {#each currentOrder.interimResult.blocks as block}
                  <lef-notebook-block data-type={block.type}>
                    {#if block.type === 'code' || block.type === 'diff' || block.type === 'output'}
                      <pre>{block.content}</pre>
                    {:else}
                      <p>{block.content}</p>
                    {/if}
                  </lef-notebook-block>
                {/each}
              </lef-result-section>
            </lef-flow-followup>
          {/if}

          {#if hasFinalResult && currentOrder?.result}
            <lef-flow-followup>
              <lef-result-section>
                <lef-result-head>
                  <strong>{labels.finalResult}</strong>
                  <p>{currentOrder.result.title}</p>
                </lef-result-head>
                {#each currentOrder.result.blocks as block}
                  <lef-notebook-block data-type={block.type}>
                    {#if block.type === 'code' || block.type === 'diff' || block.type === 'output'}
                      <pre>{block.content}</pre>
                    {:else}
                      <p>{block.content}</p>
                    {/if}
                  </lef-notebook-block>
                {/each}
              </lef-result-section>
            </lef-flow-followup>
          {/if}

          {#if currentOrder?.iterations?.length}
            <lef-flow-followup>
              <lef-iterations-list>
                {#each currentOrder.iterations as iteration}
                  <lef-iteration-card data-current={iteration.current ? 'true' : 'false'}>
                    <strong>{iteration.title}</strong>
                    {#if iteration.summary}
                      <p>{iteration.summary}</p>
                    {/if}
                    {#if iteration.stepCount !== undefined}
                      <lefine-text>{iteration.stepCount} steps</lefine-text>
                    {/if}
                  </lef-iteration-card>
                {/each}
              </lef-iterations-list>
            </lef-flow-followup>
          {/if}
        </lef-flow-stage-copy>
      </lef-flow-progress-panel>
    </section>
  {/if}

</article>

<style>
  lef-flow-confirm {
    display: grid;
    gap: 0.65rem;
    margin-top: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 22%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 94%, #efe3bc 6%);
  }

  lef-flow-confirm p {
    margin: 0;
    color: var(--lefine-text-soft);
  }

  lef-flow-confirm button {
    justify-self: start;
  }

  lef-flow-outline-list {
    display: grid;
    gap: 0.45rem;
    margin-top: 1rem;
  }

  lef-flow-outline-list details {
    border-radius: 0.8rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 34%, transparent);
    background:
      linear-gradient(180deg, color-mix(in oklab, var(--kef-bg-card) 96%, #efe3bc 4%), color-mix(in oklab, var(--kef-bg-card) 100%, transparent));
    overflow: hidden;
  }

  lef-flow-outline-list summary {
    list-style: none;
    cursor: pointer;
    padding: 0.78rem 0.9rem;
  }

  lef-flow-outline-list summary::-webkit-details-marker {
    display: none;
  }

  lef-flow-outline-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 0.7rem;
    align-items: baseline;
  }

  lef-flow-outline-row strong {
    color: var(--lefine-text-soft);
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  lef-flow-outline-row p {
    margin: 0;
    color: var(--lefine-text);
  }

  lef-flow-outline-copy {
    display: block;
    padding: 0 0.9rem 0.9rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-line) 16%, transparent);
  }

  lef-flow-outline-copy p {
    margin: 0.72rem 0 0;
    color: var(--lefine-text-soft);
  }

  lef-flow-outline-list details[data-state='completed'] {
    border-color: color-mix(in oklab, #8fb47a 34%, transparent);
  }

  lef-flow-outline-list details[data-state='active'] {
    border-color: color-mix(in oklab, #7c9ab5 40%, transparent);
  }

  lef-exchange-stage,
  lef-executor-list,
  lef-notebook-timeline,
  lef-iterations-list {
    display: grid;
    gap: 0.9rem;
  }

  lef-flow-followup {
    display: grid;
    gap: 0.9rem;
    margin-top: 1rem;
  }

  lef-exchange-stage {
    gap: 1rem;
    margin-bottom: 0.25rem;
    justify-items: center;
  }

  lef-exchange-scene {
    position: relative;
    width: min(20rem, 100%);
    height: 6.5rem;
  }

  lef-exchange-hat {
    position: absolute;
    top: 50%;
    left: 1.4rem;
    width: 5.2rem;
    height: 3.4rem;
    transform: translateY(-50%);
    animation: kefine-hat-search 3.2s ease-in-out infinite;
  }

  lef-exchange-hat-top {
    position: absolute;
    left: 1.55rem;
    top: 0.2rem;
    width: 2.2rem;
    height: 2rem;
    border-radius: 1.1rem 1.1rem 0.7rem 0.7rem;
    border: 1px solid color-mix(in oklab, #5d4a31 46%, transparent);
    background:
      radial-gradient(circle at 50% 24%, color-mix(in oklab, #7a6144 34%, transparent), transparent 56%),
      linear-gradient(180deg, color-mix(in oklab, #2f2418 96%, transparent), color-mix(in oklab, #4c3924 92%, transparent));
    box-shadow: 0 0.3rem 0.7rem color-mix(in oklab, #3b2b1c 16%, transparent);
  }

  lef-exchange-hat-brim {
    position: absolute;
    left: 0;
    bottom: 0.45rem;
    width: 5.2rem;
    height: 0.7rem;
    border-radius: 999px 999px 1.4rem 1.4rem;
    border: 1px solid color-mix(in oklab, #5d4a31 46%, transparent);
    background:
      radial-gradient(circle at 50% 0.1rem, color-mix(in oklab, #7a6144 18%, transparent), transparent 45%),
      linear-gradient(180deg, color-mix(in oklab, #5b4330 90%, transparent), color-mix(in oklab, #2f2418 98%, transparent));
    transform: perspective(2rem) rotateX(18deg);
    transform-origin: center;
  }

  lef-exchange-hat-band {
    position: absolute;
    left: 1.6rem;
    top: 1.75rem;
    width: 2.05rem;
    height: 0.24rem;
    border-radius: 999px;
    background: color-mix(in oklab, #c2a06d 72%, transparent);
    box-shadow: 0 0 0 1px color-mix(in oklab, #3f2f20 14%, transparent);
  }

  lef-result-head p,
  lef-iteration-card p,
  lef-step-comment p,
  lef-executor-copy p {
    margin: 0.35rem 0 0;
    color: var(--lefine-text-soft);
  }

  lef-executor-card,
  lef-iteration-card,
  lef-result-section {
    display: grid;
    gap: 0.75rem;
    padding: 0.95rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 26%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, #efe3bc 4%);
  }

  lef-executor-card {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
  }

  lef-executor-rank,
  lef-executor-progress,
  lef-notebook-step-tag,
  lef-notebook-state {
    font-size: 0.78rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--lefine-text-soft);
  }

  lef-executor-avatar {
    display: grid;
    place-items: center;
    width: 2.3rem;
    height: 2.3rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-line) 30%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 92%, #fff5dd 8%);
    font-weight: 700;
  }

  lef-executor-copy strong,
  lef-result-head strong,
  lef-step-comment strong,
  lef-iteration-card strong {
    display: block;
  }

  lef-executor-card[data-state='active'],
  lef-notebook-state[data-state='active'] {
    border-color: color-mix(in oklab, #7c9ab5 30%, transparent);
  }

  lef-executor-card[data-state='completed'],
  lef-iteration-card[data-current='true'] {
    border-color: color-mix(in oklab, #8fb47a 32%, transparent);
  }

  lef-executor-card[data-state='failed'] {
    border-color: color-mix(in oklab, #a26767 34%, transparent);
  }

  lef-notebook-timeline details {
    border-radius: 0.95rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 28%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 97%, #efe3bc 3%);
    overflow: hidden;
  }

  lef-notebook-timeline summary {
    list-style: none;
    cursor: pointer;
    padding: 0.9rem 1rem;
  }

  lef-notebook-timeline summary::-webkit-details-marker {
    display: none;
  }

  lef-notebook-summary {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 0.8rem;
    align-items: center;
  }

  lef-notebook-body {
    display: grid;
    gap: 0.9rem;
    padding: 0 1rem 1rem;
    border-top: 1px solid color-mix(in oklab, var(--kef-line) 16%, transparent);
  }

  lef-notebook-body > p {
    margin: 0.8rem 0 0;
    color: var(--lefine-text-soft);
  }

  lef-notebook-blocks,
  lef-step-comments {
    display: grid;
    gap: 0.65rem;
  }

  lef-notebook-block,
  lef-step-comment {
    display: grid;
    gap: 0.45rem;
    padding: 0.8rem 0.9rem;
    border-radius: 0.8rem;
    background: color-mix(in oklab, var(--kef-bg-card) 92%, #f8edd0 8%);
    border: 1px solid color-mix(in oklab, var(--kef-line) 18%, transparent);
  }

  lef-notebook-block p,
  lef-step-comment p {
    margin: 0;
  }

  lef-notebook-block pre {
    margin: 0;
    padding: 0.85rem;
    overflow: auto;
    border-radius: 0.75rem;
    background: color-mix(in oklab, #1d160f 92%, transparent);
    color: #f7ebcf;
    font-size: 0.9rem;
  }

  lef-step-comment-form {
    display: grid;
    gap: 0.6rem;
  }

  lef-step-comment-form label {
    font-size: 0.84rem;
    color: var(--lefine-text-soft);
  }

  lef-step-comment-form textarea {
    width: 100%;
    min-height: 5.5rem;
    padding: 0.8rem 0.9rem;
    border-radius: 0.8rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 28%, transparent);
    background: color-mix(in oklab, var(--kef-bg-card) 96%, #faf1d9 4%);
    color: var(--lefine-text);
    resize: vertical;
  }

  lef-step-comment-form button {
    justify-self: start;
  }

  @keyframes kefine-hat-search {
    0%,
    100% {
      transform: translate(0, -50%) rotate(-8deg);
    }
    25% {
      transform: translate(3rem, -62%) rotate(10deg);
    }
    50% {
      transform: translate(12.5rem, -46%) rotate(-2deg);
    }
    75% {
      transform: translate(3rem, -60%) rotate(9deg);
    }
  }

</style>
