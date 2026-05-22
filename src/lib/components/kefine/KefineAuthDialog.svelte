<script lang="ts">
  import Icon from '@iconify/svelte';
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
    signOutLabel,
    openTaskLabel,
    showPrivateKey,
    isAuthenticated,
    profile,
    recentTasks,
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
    signOutLabel: string;
    openTaskLabel: string;
    showPrivateKey: boolean;
    isAuthenticated: boolean;
    profile: Profile | null;
    recentTasks: OrderView[];
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

</script>

<kefine-account-drawer
  data-open={open}
  data-authenticated={isAuthenticated}
  data-state={open ? 'open' : 'closed'}
  aria-hidden={!open}
>
  {#if open}
    <button type="button" data-variant="close" aria-label={closeLabel} onclick={onClose}>
      ✕
    </button>

    {#if !isAuthenticated}
      <kefine-account-auth-grid>
        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="browser-wallet"
          data-testid="kefine-browser-wallet-auth-tile"
          onclick={onBrowserWallet}
        >
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="mdi:wallet-outline" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
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
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="simple-icons:walletconnect" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
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
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="simple-icons:ton" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
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
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="mdi:google" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
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
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="mdi:github" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
          <strong>{githubTitle}</strong>
          <small>Sign in with the GitHub identity handled by Crystal.</small>
        </button>

        <button
          type="button"
          class="kefine-account-auth-card"
          data-kind="passkey"
          data-testid="kefine-passkey-auth-tile"
          onclick={onPasskey}
        >
          <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
            <Icon icon="mdi:fingerprint" width="20" height="20" aria-hidden="true" />
          </kefine-account-auth-card-icon>
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
            <kefine-account-auth-card-icon class="kefine-account-auth-card__icon">
              <Icon icon="mdi:key-variant" width="20" height="20" aria-hidden="true" />
            </kefine-account-auth-card-icon>
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
              <kefine-account-avatar-initial>{(profileName ?? connectedTitle).slice(0, 1).toUpperCase()}</kefine-account-avatar-initial>
            {/if}
          </kefine-account-avatar>
          <lefine-box class="kefine-account-profile-copy">
            <small>{connectedTitle}</small>
            <strong>{profileName ?? connectedTitle}</strong>
            {#if profileHandle}
              <kefine-account-profile-handle>{profileHandle}</kefine-account-profile-handle>
            {/if}
          </lefine-box>
        </kefine-account-profile-head>

        <p>{connectedDescription}</p>

        <kefine-account-stats>
          <kefine-account-stat>
            <small>{latestTasksTitle}</small>
            <strong>{recentTasks.length}</strong>
          </kefine-account-stat>
        </kefine-account-stats>

        <kefine-account-profile-actions>
          <button type="button" data-variant="primary" onclick={onOpenProfile}>{openWorkspaceLabel}</button>
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
                <kefine-account-task-action>
                  <span class="kefine-account-task-action__book">
                    <span class="kefine-icon-wrap kefine-icon-wrap--closed">
                      <Icon icon="mdi:book-outline" width="16" height="16" aria-hidden="true" />
                    </span>
                    <span class="kefine-icon-wrap kefine-icon-wrap--open">
                      <Icon icon="mdi:book-open-outline" width="16" height="16" aria-hidden="true" />
                    </span>
                  </span>
                  <span class="kefine-account-task-action__label">{openTaskLabel}</span>
                </kefine-account-task-action>
              </button>
            {/each}
          </kefine-account-task-list>
        {:else}
          <p class="kefine-account-empty">{latestTasksEmptyLabel}</p>
        {/if}
      </section>
    {/if}
  {/if}
</kefine-account-drawer>

<style>
  kefine-account-drawer {
    --account-drawer-width: min(24rem, calc(100vw - 1rem));
    position: fixed;
    top: 0.5rem;
    right: 0.5rem;
    bottom: 0.5rem;
    z-index: 35;
    width: var(--account-drawer-width);
    max-width: 100vw;
    display: grid;
    gap: 0.55rem;
    grid-template-rows: auto 1fr;
    min-height: calc(100vh - 1rem);
    color: var(--lefine-text);
    overflow: auto;
    padding: 0.9rem 1rem;
    border-radius: var(--kef-radius-lg) 0 0 var(--kef-radius-lg);
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: var(--kef-bg-soft);
    transform: translateX(120%);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 220ms var(--kef-ease-soft),
      opacity 180ms ease;
  }

  kefine-account-drawer[data-state='open'] {
    transform: translateX(0);
    opacity: 1;
    pointer-events: auto;
  }

  .kefine-account-surface,
  .kefine-account-auth-card,
  .kefine-account-task,
  kefine-account-stat {
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: var(--kef-bg-card);
    box-shadow: var(--kef-shadow);
  }

  .kefine-account-surface {
    display: grid;
    gap: 0.7rem;
    padding: 1.1rem;
    border-radius: var(--kef-radius-lg);
  }

  .kefine-account-profile-copy small,
  .kefine-account-task__copy small,
  .kefine-account-empty {
    color: var(--lefine-text-soft);
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
    gap: 0.55rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .kefine-account-auth-card {
    display: grid;
    grid-template-rows: auto auto 1fr;
    gap: 0.34rem;
    min-height: 6.7rem;
    padding: 0.72rem 0.78rem;
    border-radius: var(--kef-radius-ui);
    color: inherit;
    text-align: left;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      box-shadow 160ms ease;
  }

  .kefine-account-auth-card[data-kind='browser-wallet'] {
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-primary) 16%, transparent) 0, transparent 44%),
      var(--kef-bg-card);
  }

  .kefine-account-auth-card:hover,
  .kefine-account-task:hover {
    transform: translateY(-1px);
    border-color: var(--kef-line-primary);
    box-shadow: 0 18px 36px color-mix(in oklab, var(--lefine-text) 16%, transparent);
  }

  .kefine-account-auth-card__icon,
  kefine-account-avatar {
    display: inline-grid;
    place-items: center;
    width: 2rem;
    height: 2rem;
    border-radius: 999px;
    border: var(--kef-border-width-soft) solid var(--kef-line-primary);
    background: color-mix(in oklab, var(--kef-primary) 12%, var(--kef-bg-card));
    color: var(--kef-primary);
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
    font-size: 0.9rem;
    line-height: 1.1;
    letter-spacing: -0.01em;
  }

  .kefine-account-auth-card small {
    font-size: 0.76rem;
    line-height: 1.24;
    color: var(--lefine-text-soft);
  }

  kefine-account-profile-handle {
    color: var(--kef-primary);
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
    border-radius: var(--kef-radius-ui);
  }

  kefine-account-task-list {
    display: grid;
    gap: 0.65rem;
  }

  .kefine-account-task {
    width: 100%;
    padding: 0.9rem 1rem;
    border-radius: var(--kef-radius-ui);
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

  button[data-variant='close'] {
    justify-self: end;
    margin: 0;
  }

  button[data-variant='primary'],
  button[data-variant='ghost'] {
    cursor: pointer;
    border-radius: 0.3rem;
    padding: 0.7rem 1rem;
    font: inherit;
  }

  button[data-variant='primary'] {
    border: var(--kef-border-width-soft) solid var(--kef-line-on-primary);
    background: var(--kef-primary);
    color: var(--kef-on-primary);
    font-weight: 650;
  }

  button[data-variant='primary']:hover {
    background: color-mix(in oklab, var(--kef-primary) 92%, white);
  }

  button[data-variant='ghost'] {
    border: var(--kef-border-width-soft) solid var(--kef-line);
    background: transparent;
    color: var(--lefine-text);
  }

  button[data-variant='ghost']:hover {
    border-color: var(--kef-line-primary);
  }

  kefine-account-task-action {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .kefine-account-task-action__book {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 1.85rem;
    height: 1.85rem;
    border-radius: 0.35rem;
    border: 1px solid var(--kef-line);
    background: transparent;
    overflow: hidden;
    perspective: 300px;
    flex-shrink: 0;
    transition:
      border-color 160ms ease,
      box-shadow 160ms ease,
      background-color 160ms ease,
      transform 160ms ease;
  }

  .kefine-account-task-action__book:hover {
    border-color: var(--kef-line-primary);
    background: color-mix(in oklab, var(--kef-primary) 8%, var(--kef-bg-card));
    box-shadow: 0 4px 12px color-mix(in oklab, var(--lefine-text) 8%, transparent);
    transform: translateY(-1px);
  }

  .kefine-account-task-action__label {
    display: inline-block;
    overflow: hidden;
    white-space: nowrap;
    max-width: 0;
    opacity: 0;
    transition:
      opacity 160ms ease,
      max-width 200ms ease;
    vertical-align: middle;
  }

  .kefine-account-task-action__book:hover ~ .kefine-account-task-action__label {
    opacity: 1;
    max-width: 5rem;
  }

  .kefine-icon-wrap {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transition:
      opacity 260ms ease,
      transform 360ms var(--kef-ease-soft);
  }

  .kefine-icon-wrap--closed {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }

  .kefine-icon-wrap--open {
    opacity: 0;
    transform: rotateY(-60deg) scale(0.6);
  }

  .kefine-account-task-action__book:hover .kefine-icon-wrap--closed {
    opacity: 0;
    transform: rotateY(60deg) scale(0.6);
  }

  .kefine-account-task-action__book:hover .kefine-icon-wrap--open {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }

  :global(:root[data-kefine-theme='dark']) .kefine-account-surface,
  :global(:root[data-kefine-theme='dark']) .kefine-account-auth-card,
  :global(:root[data-kefine-theme='dark']) .kefine-account-task,
  :global(:root[data-kefine-theme='dark']) kefine-account-stat {
    background: var(--kef-bg-card);
    box-shadow: 0 18px 36px color-mix(in oklab, black 26%, transparent);
  }

  :global(:root[data-kefine-theme='dark']) .kefine-account-auth-card[data-kind='browser-wallet'] {
    background:
      radial-gradient(circle at top left, color-mix(in oklab, var(--kef-primary) 18%, transparent) 0, transparent 42%),
      var(--kef-bg-card);
  }

  @media (max-width: 640px) {
    kefine-account-drawer {
      --account-drawer-width: min(100vw - 1rem, 24.5rem);
      top: 0.45rem;
      right: 0.5rem;
      left: 0.5rem;
      width: var(--account-drawer-width);
      border-radius: var(--kef-radius-lg);
      transform: translateX(120%);
      max-width: none;
    }

    kefine-account-drawer[data-state='open'] {
      transform: translateX(0);
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
