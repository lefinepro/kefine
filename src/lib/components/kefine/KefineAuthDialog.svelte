<script lang="ts">
  import { browser } from '$app/environment';
  import Icon from '@iconify/svelte';
  import KefineModal from '$lib/components/kefine/KefineModal.svelte';
  import type { OrderView } from '$lib/components/kefine/kefine-workflow';
  import type { Profile } from '$lib/types/user';

  let {
    open,
    title,
    description,
    browserWalletTitle,
    walletConnectTitle,
    tonConnectTitle,
    googleTitle,
    githubTitle,
    passkeyTitle,
    privateKeyTitle,
    connectedTitle,
    connectedDescription,
    latestTasksTitle,
    latestTasksEmptyLabel,
    openWorkspaceLabel,
    shareProfileLabel,
    profileCopiedLabel,
    signOutLabel,
    openTaskLabel,
    bonusBalanceLabel,
    showPrivateKey,
    isAuthenticated,
    profile,
    recentTasks,
    profileUrl,
    closeLabel,
    onClose,
    onBrowserWallet,
    onWalletConnect,
    onTonConnect,
    onGoogle,
    onGithub,
    onPasskey,
    onPrivateKey,
    onOpenProfile,
    onOpenTask,
    onSignOut
  }: {
    open: boolean;
    title: string;
    description: string;
    browserWalletTitle: string;
    walletConnectTitle: string;
    tonConnectTitle: string;
    googleTitle: string;
    githubTitle: string;
    passkeyTitle: string;
    privateKeyTitle: string;
    connectedTitle: string;
    connectedDescription: string;
    latestTasksTitle: string;
    latestTasksEmptyLabel: string;
    openWorkspaceLabel: string;
    shareProfileLabel: string;
    profileCopiedLabel: string;
    signOutLabel: string;
    openTaskLabel: string;
    bonusBalanceLabel: string;
    showPrivateKey: boolean;
    isAuthenticated: boolean;
    profile: Profile | null;
    recentTasks: OrderView[];
    profileUrl: string;
    closeLabel: string;
    onClose: () => void;
    onBrowserWallet: () => void;
    onWalletConnect: () => void;
    onTonConnect: () => void;
    onGoogle: () => void;
    onGithub: () => void;
    onPasskey: () => void;
    onPrivateKey: () => void;
    onOpenProfile: () => void;
    onOpenTask: (orderId: string) => void;
    onSignOut: () => void;
  } = $props();

  let copyState = $state<'idle' | 'copied'>('idle');

  const profileHandle = $derived.by(() => {
    const handle = profile?.primaryHandle?.trim();
    return handle ? `@${handle.replace(/^@+/, '')}` : null;
  });

  const profileName = $derived.by(() => {
    const displayName = profile?.displayName?.trim();
    if (displayName) {
      return displayName;
    }

    return profileHandle ?? walletAliasFallback();
  });

  function walletAliasFallback() {
    const address = profile?.walletAddress?.trim();
    if (!address) {
      return 'Workspace';
    }

    return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-4)}` : address;
  }

  async function copyProfileUrl() {
    if (!browser || !navigator.clipboard || !profileUrl.trim()) {
      return;
    }

    await navigator.clipboard.writeText(profileUrl);
    copyState = 'copied';
    window.setTimeout(() => {
      if (copyState === 'copied') {
        copyState = 'idle';
      }
    }, 1400);
  }
</script>

<KefineModal
  open={open}
  onClose={onClose}
  closeLabel={closeLabel}
  width="wide"
  placement="right"
>
  <kefine-account-drawer data-authenticated={isAuthenticated}>
    {#if !isAuthenticated}
      <kefine-account-auth-grid>
        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="browser-wallet"
          data-testid="kefine-browser-wallet-auth-tile"
          onclick={onBrowserWallet}
        >
          <span class="kefine-account-auth-card__icon">
            <Icon icon="mdi:wallet-outline" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{browserWalletTitle}</strong>
          <small>Connect the injected wallet from this browser.</small>
        </button>

        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="walletconnect"
          data-testid="kefine-walletconnect-auth-tile"
          onclick={onWalletConnect}
        >
          <span class="kefine-account-auth-card__icon">
            <Icon icon="simple-icons:walletconnect" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{walletConnectTitle}</strong>
          <small>Scan a WalletConnect QR code with your wallet app.</small>
        </button>

        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="tonconnect"
          data-testid="kefine-tonconnect-auth-tile"
          onclick={onTonConnect}
        >
          <span class="kefine-account-auth-card__icon">
            <Icon icon="simple-icons:ton" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{tonConnectTitle}</strong>
          <small>Connect a TON wallet through TonConnect.</small>
        </button>

        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="google"
          data-testid="kefine-google-auth-tile"
          onclick={onGoogle}
        >
          <span class="kefine-account-auth-card__icon">
            <Icon icon="mdi:google" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{googleTitle}</strong>
          <small>Continue through the Crystal OAuth callback.</small>
        </button>

        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="github"
          data-testid="kefine-github-auth-tile"
          onclick={onGithub}
        >
          <span class="kefine-account-auth-card__icon">
            <Icon icon="mdi:github" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{githubTitle}</strong>
          <small>Sign in with the GitHub identity handled by Crystal.</small>
        </button>

        <button type="button" class="kefine-account-auth-card" data-kind="passkey" data-testid="kefine-passkey-auth-tile" onclick={onPasskey}>
          <span class="kefine-account-auth-card__icon">
            <Icon icon="mdi:fingerprint" width="20" height="20" aria-hidden="true" />
          </span>
          <strong>{passkeyTitle}</strong>
          <small>Use a device-bound secure login.</small>
        </button>

        {#if showPrivateKey}
          <button
            type="button"
            class="kefine-account-auth-card"
            data-kind="privatekey"
            data-testid="kefine-privatekey-auth-tile"
            onclick={onPrivateKey}
          >
            <span class="kefine-account-auth-card__icon">
              <Icon icon="mdi:key-variant" width="20" height="20" aria-hidden="true" />
            </span>
            <strong>{privateKeyTitle}</strong>
            <small>Use the generated actor key directly.</small>
          </button>
        {/if}
      </kefine-account-auth-grid>
    {:else}
      <kefine-account-profile-card class="kefine-account-surface">
        <kefine-account-profile-head>
          <kefine-account-avatar data-has-avatar={Boolean(profile?.avatarUrl)}>
            {#if profile?.avatarUrl}
              <img src={profile.avatarUrl} alt={profileName ?? connectedTitle} />
            {:else}
              <span>{(profileName ?? connectedTitle).slice(0, 1).toUpperCase()}</span>
            {/if}
          </kefine-account-avatar>
          <lefine-box class="kefine-account-profile-copy">
            <small>{connectedTitle}</small>
            <strong>{profileName ?? connectedTitle}</strong>
            {#if profileHandle}
              <span>{profileHandle}</span>
            {/if}
          </lefine-box>
        </kefine-account-profile-head>

        <p>{connectedDescription}</p>

        <kefine-account-stats>
          <kefine-account-stat>
            <small>{bonusBalanceLabel}</small>
            <strong>${profile?.bonusBalanceUsd?.toFixed(2) ?? '0.00'}</strong>
          </kefine-account-stat>
          <kefine-account-stat>
            <small>{latestTasksTitle}</small>
            <strong>{recentTasks.length}</strong>
          </kefine-account-stat>
        </kefine-account-stats>

        <kefine-account-profile-actions>
          <button type="button" data-variant="primary" onclick={onOpenProfile}>{openWorkspaceLabel}</button>
          <button type="button" data-variant="ghost" onclick={copyProfileUrl}>
            {copyState === 'copied' ? profileCopiedLabel : shareProfileLabel}
          </button>
        </kefine-account-profile-actions>
      </kefine-account-profile-card>

      <section class="kefine-account-surface">
        <kefine-account-section-head>
          <strong>{latestTasksTitle}</strong>
          <button type="button" data-variant="ghost" onclick={onSignOut}>{signOutLabel}</button>
        </kefine-account-section-head>

        {#if recentTasks.length > 0}
          <kefine-account-task-list>
            {#each recentTasks as task (task.id)}
              <button type="button" class="kefine-account-task" onclick={() => onOpenTask(task.id)}>
                <lefine-box class="kefine-account-task__copy">
                  <strong>{task.title}</strong>
                  <small>{task.status}</small>
                </lefine-box>
                <span>{openTaskLabel}</span>
              </button>
            {/each}
          </kefine-account-task-list>
        {:else}
          <p class="kefine-account-empty">{latestTasksEmptyLabel}</p>
        {/if}
      </section>
    {/if}
  </kefine-account-drawer>
</KefineModal>

<style>
  kefine-account-drawer {
    display: grid;
    gap: 1rem;
    min-height: calc(100vh - 2.4rem);
    color: var(--kef-color-text, #2e2317);
  }

  .kefine-account-surface,
  .kefine-account-auth-card,
  .kefine-account-task,
  kefine-account-stat {
    border: 1px solid color-mix(in oklab, var(--kef-color-text, #2e2317) 12%, transparent);
    background:
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--kef-color-bg-card, #f7ecd6) 96%, white 4%),
        color-mix(in oklab, var(--kef-color-bg-soft, #eadcbc) 88%, var(--kef-color-bg-card, #f7ecd6) 12%)
      );
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 28%, transparent),
      0 16px 32px color-mix(in oklab, var(--kef-color-text, #2e2317) 12%, transparent);
  }

  .kefine-account-surface {
    display: grid;
    gap: 0.7rem;
    padding: 1.1rem;
    border-radius: 1.25rem;
  }

  .kefine-account-profile-copy small,
  .kefine-account-task__copy small,
  .kefine-account-empty {
    color: color-mix(in oklab, var(--kef-color-text, #2e2317) 58%, transparent);
  }

  kefine-account-section-head,
  kefine-account-profile-head,
  kefine-account-profile-actions,
  kefine-account-stats,
  .kefine-account-task {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  kefine-account-section-head,
  kefine-account-profile-actions,
  .kefine-account-task {
    justify-content: space-between;
  }

  kefine-account-auth-grid {
    display: grid;
    gap: 0.6rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kefine-account-auth-card {
    display: grid;
    gap: 0.4rem;
    min-height: 7.5rem;
    padding: 0.8rem 0.85rem;
    border-radius: 1rem;
    color: inherit;
    text-align: left;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      background-color 160ms ease,
      box-shadow 160ms ease;
  }

  .kefine-account-auth-card[data-kind='browser-wallet'] {
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 16%, transparent) 0, transparent 44%),
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 10%, var(--kef-color-bg-card, #f7ecd6)),
        color-mix(in oklab, var(--kef-color-bg-soft, #eadcbc) 72%, var(--kef-color-bg-card, #f7ecd6) 28%)
      );
  }

  .kefine-account-auth-card:hover,
  .kefine-account-task:hover {
    transform: translateY(-1px);
    border-color: color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 30%, transparent);
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 34%, transparent),
      0 18px 36px color-mix(in oklab, var(--kef-color-text, #2e2317) 16%, transparent);
  }

  .kefine-account-auth-card__icon,
  kefine-account-avatar {
    display: inline-grid;
    place-items: center;
    width: 2.15rem;
    height: 2.15rem;
    border-radius: 999px;
    border: 1px solid color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 18%, transparent);
    background: color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 12%, var(--kef-color-bg-card, #f7ecd6));
    color: color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 84%, var(--kef-color-text, #2e2317));
  }

  kefine-account-avatar {
    width: 3.3rem;
    height: 3.3rem;
    overflow: hidden;
    flex: 0 0 auto;
  }

  kefine-account-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .kefine-account-profile-copy {
    display: grid;
    gap: 0.18rem;
  }

  .kefine-account-profile-copy strong,
  .kefine-account-task__copy strong {
    font-size: 1rem;
    line-height: 1.2;
  }

  .kefine-account-auth-card strong {
    font-size: 0.95rem;
    line-height: 1.15;
  }

  .kefine-account-auth-card small {
    font-size: 0.8rem;
    line-height: 1.3;
    color: color-mix(in oklab, var(--kef-color-text, #2e2317) 62%, transparent);
  }

  .kefine-account-profile-copy span {
    color: color-mix(in oklab, var(--kef-color-primary, #7a4b2a) 76%, var(--kef-color-text, #2e2317));
    font-size: 0.92rem;
  }

  kefine-account-stats {
    align-items: stretch;
  }

  kefine-account-stat {
    flex: 1 1 0;
    display: grid;
    gap: 0.2rem;
    padding: 0.85rem 0.9rem;
    border-radius: 1rem;
  }

  kefine-account-task-list {
    display: grid;
    gap: 0.65rem;
  }

  .kefine-account-task {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    color: inherit;
    text-align: left;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .kefine-account-task__copy {
    display: grid;
    gap: 0.14rem;
    min-width: 0;
  }

  .kefine-account-task__copy strong {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button[data-variant='primary'],
  button[data-variant='ghost'] {
    cursor: pointer;
    border-radius: 999px;
    padding: 0.7rem 0.95rem;
    font: inherit;
  }

  button[data-variant='primary'] {
    border: 0;
    background: var(--kef-color-primary, #7a4b2a);
    color: var(--kef-color-on-primary, #f7edd8);
    font-weight: 700;
  }

  button[data-variant='ghost'] {
    border: 1px solid color-mix(in oklab, var(--kef-color-text, #2e2317) 14%, transparent);
    background: color-mix(in oklab, var(--kef-color-bg-card, #f7ecd6) 86%, transparent);
    color: inherit;
  }

  :global(:root[data-kefine-theme='dark']) .kefine-account-surface,
  :global(:root[data-kefine-theme='dark']) .kefine-account-auth-card,
  :global(:root[data-kefine-theme='dark']) .kefine-account-task,
  :global(:root[data-kefine-theme='dark']) kefine-account-stat {
    background:
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--kef-color-bg-card, #1d1510) 90%, #2b1f16 10%),
        color-mix(in oklab, var(--kef-color-bg-soft, #221912) 82%, var(--kef-color-bg-card, #1d1510) 18%)
      );
    box-shadow:
      inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
      0 18px 36px color-mix(in oklab, black 26%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) .kefine-account-auth-card[data-kind='browser-wallet'] {
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-color-primary, #c89a5a) 18%, transparent) 0, transparent 42%),
      linear-gradient(
        180deg,
        color-mix(in oklab, var(--kef-color-primary, #c89a5a) 10%, var(--kef-color-bg-card, #1d1510)),
        color-mix(in oklab, var(--kef-color-bg-soft, #221912) 78%, var(--kef-color-bg-card, #1d1510) 22%)
      );
  }

  @media (max-width: 640px) {
    kefine-account-drawer {
      min-height: calc(100vh - 1.8rem);
    }

    kefine-account-auth-grid {
      grid-template-columns: 1fr;
    }

    kefine-account-profile-actions,
    kefine-account-stats,
    .kefine-account-task {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
