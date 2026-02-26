<script lang="ts">
  import type { FederationConfig } from '$lib/config';
  import { loadConfig, saveConfig, validateConfig, autoDiscoverConfig, resetConfig } from '$lib/config';
  import { sessionStore, clearSession } from '$lib/auth/session';
  import { isPasskeySupported, loadStoredCredentials, removeCredential } from '$lib/auth/passkey';
  import type { StoredCredential } from '$lib/auth/passkey';
  import { triggerSync, syncStore } from '$lib/sync/manager';

  let config: FederationConfig = $state(loadConfig());
  let credentials: StoredCredential[] = $state(loadStoredCredentials());
  let validationErrors: string[] = $state([]);
  let discoverError = $state('');
  let discoverLoading = $state(false);
  let saveStatus = $state<'idle' | 'saved' | 'error'>('idle');
  let isSyncing = $derived($syncStore.isSyncing);

  function handleSave() {
    const { valid, errors } = validateConfig(config);
    validationErrors = errors;
    if (!valid) return;

    saveConfig(config);
    saveStatus = 'saved';
    setTimeout(() => (saveStatus = 'idle'), 2000);
  }

  async function handleDiscover() {
    discoverError = '';
    discoverLoading = true;
    try {
      const discovered = await autoDiscoverConfig(config.actorId);
      config = { ...config, ...discovered };
    } catch (err) {
      discoverError = err instanceof Error ? err.message : 'Discovery failed';
    } finally {
      discoverLoading = false;
    }
  }

  function handleReset() {
    if (confirm('Reset all federation settings? This cannot be undone.')) {
      resetConfig();
      config = loadConfig();
      validationErrors = [];
    }
  }

  function handleRemoveCredential(id: string) {
    if (confirm('Remove this passkey?')) {
      removeCredential(id);
      credentials = loadStoredCredentials();
    }
  }

  function handleLogout() {
    clearSession();
  }

  async function handleSync() {
    if (!config.actorId || !config.inboxUrl) return;
    await triggerSync(config.actorId, config.inboxUrl);
  }

  const passkeySupported = isPasskeySupported();
  const session = $derived($sessionStore);
</script>

<section class="federation-settings" aria-label="Federation settings">
  <header class="federation-settings-header">
    <h2>Federation Settings</h2>
    <p>Configure ActivityPub/ForgeFed integration for syncing OKRs across the fediverse.</p>
  </header>

  <!-- Enable toggle -->
  <fieldset class="form-group">
    <label>
      <input type="checkbox" bind:checked={config.enabled} />
      Enable ActivityPub/ForgeFed federation
    </label>
  </fieldset>

  {#if config.enabled}
    <!-- Actor configuration -->
    <fieldset class="federation-section">
      <legend>Actor Configuration</legend>

      <p class="form-group">
        <label for="actor-id">Actor URL <required-mark>*</required-mark></label>
        <input
          id="actor-id"
          type="text"
          bind:value={config.actorId}
          placeholder="https://example.social/users/alice"
          aria-invalid={validationErrors.some((e) => e.includes('Actor ID')) ? 'true' : undefined}
        />
        <hint>Your ActivityPub profile URL</hint>
      </p>

      <p class="form-group">
        <button
          type="button"
          data-variant="ghost"
          onclick={handleDiscover}
          disabled={!config.actorId || discoverLoading}
        >
          {discoverLoading ? 'Discovering…' : 'Auto-discover endpoints'}
        </button>
        {#if discoverError}
          <small role="alert">{discoverError}</small>
        {/if}
      </p>

      <p class="form-group">
        <label for="inbox-url">Inbox URL <required-mark>*</required-mark></label>
        <input
          id="inbox-url"
          type="text"
          bind:value={config.inboxUrl}
          placeholder="https://example.social/users/alice/inbox"
          aria-invalid={validationErrors.some((e) => e.includes('Inbox')) ? 'true' : undefined}
        />
      </p>

      <p class="form-group">
        <label for="outbox-url">Outbox URL <required-mark>*</required-mark></label>
        <input
          id="outbox-url"
          type="text"
          bind:value={config.outboxUrl}
          placeholder="https://example.social/users/alice/outbox"
          aria-invalid={validationErrors.some((e) => e.includes('Outbox')) ? 'true' : undefined}
        />
      </p>

      <p class="form-group">
        <label for="auth-endpoint">Auth Endpoint <required-mark>*</required-mark></label>
        <input
          id="auth-endpoint"
          type="text"
          bind:value={config.authEndpoint}
          placeholder="https://example.social"
          aria-invalid={validationErrors.some((e) => e.includes('Auth')) ? 'true' : undefined}
        />
        <hint>Base URL for registration/login endpoints</hint>
      </p>
    </fieldset>

    <!-- ForgeFed configuration -->
    <fieldset class="federation-section">
      <legend>ForgeFed Project</legend>

      <p class="form-group">
        <label for="project-url">ForgeFed Project URL</label>
        <input
          id="project-url"
          type="text"
          bind:value={config.forgeFedProjectUrl}
          placeholder="https://forgejo.example.org/projects/my-project"
        />
        <hint>Optional: ForgeFed project to federate OKRs to</hint>
      </p>

      <p class="form-group">
        <label for="tracker-url">Ticket Tracker URL</label>
        <input
          id="tracker-url"
          type="text"
          bind:value={config.ticketTrackerUrl}
          placeholder="https://forgejo.example.org/projects/my-project/issues"
        />
        <hint>Optional: TicketTracker to create OKR tickets in</hint>
      </p>
    </fieldset>

    <!-- Validation errors -->
    {#if validationErrors.length > 0}
      <ul class="validation-errors" role="alert">
        {#each validationErrors as error (error)}
          <li>{error}</li>
        {/each}
      </ul>
    {/if}

    <!-- Save actions -->
    <p class="federation-actions">
      <button type="button" data-variant="primary" onclick={handleSave}>
        {saveStatus === 'saved' ? '✓ Saved' : 'Save Settings'}
      </button>
      <button type="button" data-variant="ghost" onclick={handleReset}>Reset</button>
    </p>

    <!-- Sync -->
    <fieldset class="federation-section">
      <legend>Sync</legend>
      <p class="form-group">
        <button
          type="button"
          data-variant="ghost"
          onclick={handleSync}
          disabled={isSyncing || !config.actorId}
        >
          {isSyncing ? 'Syncing…' : 'Sync Now'}
        </button>
        <hint>Manually trigger a sync with the federation server</hint>
      </p>
    </fieldset>

    <!-- Session -->
    <fieldset class="federation-section">
      <legend>Session</legend>
      {#if session}
        <p>Logged in as: <strong>{session.username || session.actorId}</strong></p>
        <p class="federation-actions">
          <button type="button" data-variant="action" data-danger onclick={handleLogout}>
            Log out
          </button>
        </p>
      {:else}
        <p class="form-group"><hint>Not authenticated. Use passkey login to connect.</hint></p>
      {/if}
    </fieldset>

    <!-- Passkeys -->
    <fieldset class="federation-section">
      <legend>Passkeys</legend>

      {#if !passkeySupported}
        <p><hint>Passkeys are not supported in this browser.</hint></p>
      {:else if credentials.length === 0}
        <p><hint>No passkeys registered for this device.</hint></p>
      {:else}
        <ul class="credential-list" aria-label="Registered passkeys">
          {#each credentials as cred (cred.id)}
            <li class="credential-item">
              <credential-info>
                <credential-name>{cred.name}</credential-name>
                <credential-date>Added {cred.createdAt.toLocaleDateString()}</credential-date>
              </credential-info>
              <button
                type="button"
                data-variant="action"
                data-danger
                onclick={() => handleRemoveCredential(cred.id)}
                aria-label="Remove passkey {cred.name}"
              >
                Remove
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </fieldset>
  {/if}
</section>

<style>
  .federation-settings {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-6);
    max-width: 600px;
  }

  .federation-settings-header h2 {
    font-size: var(--okr-font-size-xl);
    font-weight: 700;
    margin-bottom: var(--okr-space-1);
  }

  .federation-settings-header p {
    color: var(--okr-color-muted);
    font-size: var(--okr-font-size-sm);
  }

  .federation-section {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-3);
    border: 1px solid var(--okr-color-border);
    border-radius: var(--okr-radius-lg);
    padding: var(--okr-space-4);
  }

  .federation-section legend {
    font-weight: 700;
    font-size: var(--okr-font-size-sm);
    padding: 0 var(--okr-space-2);
    color: var(--okr-color-text-label);
  }

  .federation-actions {
    display: flex;
    gap: var(--okr-space-2);
  }

  .validation-errors {
    list-style: disc;
    padding-left: var(--okr-space-4);
    color: var(--okr-color-error);
    font-size: var(--okr-font-size-sm);
  }

  .credential-list {
    display: flex;
    flex-direction: column;
    gap: var(--okr-space-2);
  }

  .credential-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--okr-space-2) var(--okr-space-3);
    background: var(--okr-color-bg);
    border-radius: var(--okr-radius-md);
  }

  credential-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  credential-name {
    display: block;
    font-weight: 600;
    font-size: var(--okr-font-size-sm);
    color: var(--okr-color-text);
  }

  credential-date {
    display: block;
    font-size: var(--okr-font-size-xs);
    color: var(--okr-color-muted);
  }
</style>
