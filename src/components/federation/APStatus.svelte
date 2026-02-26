<script lang="ts">
  import { syncStore, notificationStore } from '$lib/sync/manager';

  const syncState = $derived($syncStore);
  const isSyncing = $derived(syncState.isSyncing);
  const serverReachable = $derived(syncState.serverReachable);
  const lastSyncedAt = $derived(syncState.lastSyncedAt);
  const pendingCount = $derived(syncState.pendingActivities.length);
  const errorCount = $derived(syncState.errors.filter((e) => !e.resolved).length);
  const unreadNotifications = $derived($notificationStore.filter((n) => !n.read).length);

  function formatLastSync(date: Date | undefined): string {
    if (!date) return 'Never';
    const diff = Date.now() - date.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    return `${Math.floor(diff / 3_600_000)}h ago`;
  }
</script>

<ap-status aria-label="Federation status">
  <ap-status-indicator
    data-state={isSyncing ? 'syncing' : serverReachable ? 'connected' : 'disconnected'}
    aria-label={isSyncing ? 'Syncing...' : serverReachable ? 'Connected to federation' : 'Disconnected from federation'}
  ></ap-status-indicator>

  <ap-status-info>
    <ap-status-label>
      {#if isSyncing}
        Syncing…
      {:else if serverReachable}
        Connected
      {:else}
        Disconnected
      {/if}
    </ap-status-label>
    <ap-status-detail>Last sync: {formatLastSync(lastSyncedAt)}</ap-status-detail>
  </ap-status-info>

  {#if pendingCount > 0}
    <ap-badge data-variant="pending" aria-label="{pendingCount} pending activities">
      {pendingCount}
    </ap-badge>
  {/if}

  {#if unreadNotifications > 0}
    <ap-badge data-variant="notification" aria-label="{unreadNotifications} unread notifications">
      {unreadNotifications}
    </ap-badge>
  {/if}

  {#if errorCount > 0}
    <ap-badge data-variant="error" aria-label="{errorCount} sync errors">
      !{errorCount}
    </ap-badge>
  {/if}
</ap-status>

<style>
  ap-status {
    display: inline-flex;
    align-items: center;
    gap: var(--okr-space-2);
    padding: var(--okr-space-1) var(--okr-space-3);
    background: var(--okr-color-bg-card);
    border-radius: var(--okr-radius-full);
    box-shadow: var(--okr-shadow-sm);
    font-size: var(--okr-font-size-xs);
  }

  ap-status-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  ap-status-indicator[data-state="connected"] {
    background: var(--okr-color-success);
  }

  ap-status-indicator[data-state="syncing"] {
    background: var(--okr-color-warning);
    animation: pulse 1s infinite;
  }

  ap-status-indicator[data-state="disconnected"] {
    background: var(--okr-color-muted);
  }

  ap-status-info {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  ap-status-label {
    display: block;
    font-weight: 600;
    color: var(--okr-color-text);
  }

  ap-status-detail {
    display: block;
    color: var(--okr-color-muted);
  }

  ap-badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: var(--okr-radius-full);
    font-size: var(--okr-font-size-xs);
    font-weight: 700;
  }

  ap-badge[data-variant="pending"] {
    background: #dbeafe;
    color: #1d4ed8;
  }

  ap-badge[data-variant="notification"] {
    background: #fef9c3;
    color: #854d0e;
  }

  ap-badge[data-variant="error"] {
    background: #fee2e2;
    color: var(--okr-color-error);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
</style>
