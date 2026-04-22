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
  tone="dark"
  width="wide"
  placement="right"
>
  <kefine-account-drawer data-authenticated={isAuthenticated}>
    {#if !isAuthenticated}
      <kefine-account-hero>
        <small>Access</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </kefine-account-hero>

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
          <small>Open Reown only for WalletConnect.</small>
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
    color: color-mix(in oklab, #e9f0f5 92%, white 8%);
  }

  kefine-account-hero,
  .kefine-account-surface,
  .kefine-account-auth-card,
  .kefine-account-task,
  kefine-account-stat {
    border: 1px solid color-mix(in oklab, #8aa0b6 18%, transparent);
    background:
      linear-gradient(180deg, color-mix(in oklab, #15202b 94%, #10161c 6%), color-mix(in oklab, #111a22 96%, black 4%));
    box-shadow: 0 20px 40px color-mix(in oklab, black 28%, transparent);
  }

  kefine-account-hero,
  .kefine-account-surface {
    display: grid;
    gap: 0.7rem;
    padding: 1.1rem;
    border-radius: 1.25rem;
  }

  kefine-account-hero {
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-primary, #98c95c) 30%, transparent) 0, transparent 38%),
      linear-gradient(180deg, color-mix(in oklab, #0f1720 96%, black 4%), color-mix(in oklab, #101822 98%, black 2%));
  }

  kefine-account-hero small,
  .kefine-account-profile-copy small,
  .kefine-account-task__copy small,
  .kefine-account-empty {
    color: color-mix(in oklab, #cfdae4 56%, transparent);
  }

  kefine-account-hero h2,
  kefine-account-hero p {
    margin: 0;
  }

  kefine-account-hero h2 {
    font-size: clamp(1.65rem, 3vw, 2.2rem);
    line-height: 1.05;
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
    gap: 0.75rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kefine-account-auth-card {
    display: grid;
    gap: 0.55rem;
    padding: 1rem;
    border-radius: 1.1rem;
    color: inherit;
    text-align: left;
  }

  .kefine-account-auth-card[data-kind='browser-wallet'] {
    background:
      linear-gradient(180deg, color-mix(in oklab, #182431 82%, var(--kef-primary, #98c95c) 18%), color-mix(in oklab, #101820 94%, black 6%));
  }

  .kefine-account-auth-card__icon,
  kefine-account-avatar {
    display: inline-grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-primary, #98c95c) 24%, #19222d);
    color: color-mix(in oklab, #f5ffd8 84%, white 16%);
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

  .kefine-account-profile-copy span {
    color: color-mix(in oklab, var(--kef-primary, #98c95c) 68%, white 32%);
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
    border-radius: 999px;
    padding: 0.7rem 0.95rem;
    font: inherit;
  }

  button[data-variant='primary'] {
    border: 0;
    background: var(--kef-primary, #98c95c);
    color: #112010;
    font-weight: 700;
  }

  button[data-variant='ghost'] {
    border: 1px solid color-mix(in oklab, #8aa0b6 18%, transparent);
    background: color-mix(in oklab, #17212d 96%, black 4%);
    color: inherit;
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
