<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import { cubicOut } from 'svelte/easing';
  import type { TransitionConfig } from 'svelte/transition';
  import KefineTaskCloneMenu from '$lib/components/kefine/KefineTaskCloneMenu.svelte';
  import KefineTaskSettingsMenu from '$lib/components/kefine/KefineTaskSettingsMenu.svelte';
  import type { AuthMethod, ExecutionPresentation, OrderView } from './kefine-workflow';
  import type { TaskCloneFormat } from './kefine-task-clone';
  import { scheduleAfter } from '$lib/utils/helpers';
  import KefineWalletProviderGrid from '$lib/components/kefine/KefineWalletProviderGrid.svelte';
  import KefineTaskTreeFeed from '$lib/components/kefine/KefineTaskTreeFeed.svelte';
  import { KEFINE_AUTH_ICONS } from '$lib/components/kefine/kefine-auth-constants';

  let {
    currentOrder,
    queuedOrders = [],
    execution,
    isHydratingTitle = false,
    forceFinalVpnStep = false,
    labels,
    authLabels,
    authDisplay,
    walletNetworkLabel,
    canSaveCloneLocally = false,
    canManageTask = false,
    isConfirmingStep = false,
    commentSubmittingStepId = null,
    confirmCurrentStepLabel,
    onConfirmCurrentStep,
    onSubmitStepComment,
    onSaveDocument,
    onExportClone,
    onSaveCloneLocally,
    onUpdateTaskSettings,
    onPauseSearch,
    onResumeSearch,
    onWalletLogin,
    onPasskeyLogin,
    onAnonymous,
    onCancel
  }: {
    currentOrder: OrderView | null;
    queuedOrders?: OrderView[];
    execution: ExecutionPresentation;
    isHydratingTitle?: boolean;
    forceFinalVpnStep?: boolean;
    labels: {
      boardTitle: string;
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
      treeTitle: string;
      feedTitle: string;
      saving: string;
      apply: string;
      richEditorDescription: string;
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
    canSaveCloneLocally?: boolean;
    canManageTask?: boolean;
    isConfirmingStep?: boolean;
    commentSubmittingStepId?: string | null;
    confirmCurrentStepLabel?: string;
    onConfirmCurrentStep?: (() => void) | null;
    onSubmitStepComment?: ((stepId: string, content: string) => void | Promise<void>) | null;
    onSaveDocument?: ((content: string) => void | Promise<void>) | null;
    onExportClone?: ((format: TaskCloneFormat) => void) | null;
    onSaveCloneLocally?: ((runLocally: boolean) => void) | null;
    onUpdateTaskSettings?: ((patch: Partial<Pick<OrderView, 'title' | 'description' | 'taskIcon' | 'shareId' | 'isPublicTask' | 'vcsEnabled' | 'repository'>> & {
      gitSettings?: import('./kefine-workflow').RepositoryGitSettings;
    }) => void | Promise<void>) | null;
    onPauseSearch?: (() => void | Promise<void>) | null;
    onResumeSearch?: (() => void | Promise<void>) | null;
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
    const rawName = (currentOrder?.solverName || currentOrder?.solver || '').trim();
    const handle = (currentOrder?.solverHandle || '').trim();
    const profileUrl = (currentOrder?.solverProfileUrl || '').trim();
    const normalizedName = rawName.toLowerCase();
    const normalizedHandle = handle.toLowerCase();
    const placeholderNames = new Set([
      '',
      'nordlayer solver',
      'open solver market',
      'solver',
      'default solver',
      'saved',
      'save',
      'https://exchange.lefine.pro',
      'https://lefine.pro'
    ]);

    const genericProfile = (() => {
      if (!profileUrl) return false;
      try {
        const url = new URL(profileUrl);
        const segments = url.pathname.split('/').filter(Boolean);
        return (url.host === 'exchange.lefine.pro' || url.host === 'lefine.pro') && segments.length <= 1;
      } catch {
        return false;
      }
    })();

    const fallbackName = handle
      ? handle
          .replace(/^@/, '')
          .split('@')[0]
          .replace(/[-_]+/g, ' ')
          .trim()
      : rawName;
    const name = rawName && !placeholderNames.has(normalizedName) ? rawName : fallbackName;
    const normalizedDisplayName = name.toLowerCase();
    const showHandle = Boolean(handle) && normalizedDisplayName !== normalizedHandle;
    const isReal = Boolean((handle || profileUrl) && !placeholderNames.has(normalizedName) && !genericProfile);

    return {
      name,
      handle,
      profileUrl,
      showHandle,
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
  const taskMonogram = $derived.by(() => {
    const icon = currentOrder?.taskIcon?.trim();
    if (icon) {
      return icon;
    }
    const source = currentOrder?.title?.trim() || '';
    const match = source.match(/[A-Za-zА-Яа-яԱ-Ֆա-ֆ0-9]/u);
    return (match?.[0] ?? source.charAt(0) ?? 'T').toUpperCase();
  });

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

{#if isVpnScenario}
  <article class="kefine-card kefine-card--wide kefine-order-flow">
    <section class="kefine-flow-panel kefine-flow-panel--hero">
      <lefine-box class="kefine-flow-topline">
        <button type="button" class="kefine-flow-back" onclick={onCancel} aria-label={labels.cancel}>←</button>
        <lefine-box class="kefine-flow-topline-actions">
          {#if currentOrder && onUpdateTaskSettings}
            <KefineTaskSettingsMenu order={currentOrder} onApply={onUpdateTaskSettings} />
          {/if}
          {#if currentOrder && onExportClone}
            <KefineTaskCloneMenu
              order={currentOrder}
              canSaveLocally={canSaveCloneLocally}
              onExport={onExportClone}
              onSaveLocally={onSaveCloneLocally ?? undefined}
            />
          {/if}
        </lefine-box>
      </lefine-box>

      {#if isHydratingTitle}
        <h2 class="kefine-title-skeleton" aria-label="Loading task title"></h2>
      {:else}
        <h2>
          <lefine-text data-part="task-icon">{taskMonogram}</lefine-text>
          {currentOrder?.title}
        </h2>
      {/if}

      {#if currentOrder?.description && currentOrder.description !== currentOrder.title}
        <p class="kefine-flow-copy">{currentOrder.description}</p>
      {/if}
    </section>

    <section class="kefine-flow-panel">
      <lefine-box class="kefine-section-head">
        <p>VPN service runbook</p>
        <lefine-box class="kefine-flow-badges">
          <lefine-text class="kefine-flow-badge kefine-flow-badge--timer">
            <Icon icon="mdi:alarm" width="16" height="16" aria-hidden="true" />
            <lefine-text>{formattedRemaining}</lefine-text>
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
                {getSolverInitial(solverIdentity.name, solverIdentity.name)}
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
                          aria-label="Solver workspace"
                          title="Solver workspace"
                        >
                          <Icon icon="mdi:open-in-new" width="16" height="16" aria-hidden="true" />
                        </a>
                      </lef-icon-action>
                    {/if}
                    {#if solverIdentity.showHandle}
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
                {#if solverIdentity.showHandle}
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
  </article>
{:else}
  <kefine-task-stage>
      <KefineTaskTreeFeed
        {currentOrder}
        {queuedOrders}
        canSaveCloneLocally={canSaveCloneLocally}
        canManageTask={canManageTask}
        {commentSubmittingStepId}
        onSubmitStepComment={onSubmitStepComment}
        onSaveDocument={onSaveDocument}
        onExportClone={onExportClone}
        onSaveCloneLocally={onSaveCloneLocally}
        onUpdateTaskSettings={onUpdateTaskSettings}
        onPauseSearch={onPauseSearch}
        onResumeSearch={onResumeSearch}
        labels={{
          boardTitle: currentOrder?.title || labels.boardTitle,
          saving: labels.saving,
          leaveComment: labels.leaveComment,
          apply: labels.apply,
          richEditorDescription: labels.richEditorDescription
        }}
      />
  </kefine-task-stage>
{/if}

<style>
  h2 [data-part='task-icon'] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.9rem;
    height: 1.9rem;
    margin-right: 0.55rem;
    border-radius: 0.52rem;
    border: 1px solid color-mix(in oklab, #c79a57 42%, transparent);
    background: linear-gradient(180deg, color-mix(in oklab, #f2dfb4 84%, white), color-mix(in oklab, #d0a364 84%, #c4934c));
    color: #3b2819;
    font-size: 0.92rem;
    font-weight: 800;
    line-height: 1;
    vertical-align: 0.18rem;
    box-shadow: 0 0.35rem 0.9rem color-mix(in oklab, #000 10%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) h2 [data-part='task-icon'] {
    border-color: color-mix(in oklab, #d7ad68 48%, transparent);
    background: linear-gradient(180deg, color-mix(in oklab, #f3dfb0 88%, #6f4d25), color-mix(in oklab, #b9853e 88%, #5d4020));
    color: #20150e;
  }

  kefine-task-stage {
    display: block;
    width: min(100%, 72rem);
    margin: 0 auto;
  }

  .kefine-flow-topline-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
  }

  lef-solver-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 0.85rem;
    width: 100%;
    margin-bottom: 0.85rem;
  }

  lef-solver-avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 0.72rem;
    flex: 0 0 2.4rem;
  }

  lef-solver-copy {
    display: grid;
    gap: 0.3rem;
    min-width: 0;
  }

  lef-solver-name {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 0.75rem;
    min-width: 0;
  }

  lef-solver-name strong {
    display: block;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  lef-solver-actions {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex: 0 0 auto;
  }

  lef-icon-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
  }

  lef-solver-copy > lefine-text {
    display: block;
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
    word-break: break-word;
    line-height: 1.35;
    color: color-mix(in oklab, currentColor 82%, transparent);
  }

  @media (max-width: 40rem) {
    lef-solver-name {
      flex-direction: column;
      align-items: stretch;
    }

    lef-solver-actions {
      justify-content: flex-start;
    }

    lef-solver-name strong {
      white-space: normal;
    }
  }

  lef-exchange-stage {
    display: grid;
    gap: 0.9rem;
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
