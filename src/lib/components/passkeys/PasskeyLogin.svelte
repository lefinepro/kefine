<script lang="ts">
  import {
    performAuthentication,
    finishAuthentication,
    performRegistration,
    finishRegistration,
    type PasskeyAuthSuccess
  } from '$lib/auth/routes';

  interface Props {
    title?: string;
    description?: string;
    showLogin?: boolean;
    showRegistration?: boolean;
    onSuccess?: (session: PasskeyAuthSuccess) => void;
    onError?: (error: Error) => void;
  }

  let {
    title = 'Login with Passkey',
    description = 'Passkey login should work without entering a username. Username is only needed once when creating a new passkey.',
    showLogin = true,
    showRegistration = true,
    onSuccess,
    onError
  }: Props = $props();

  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let registrationUsername = $state('');

  async function handleLogin() {
    status = 'loading';
    errorMessage = '';

    try {
      const { transactionId, response } = await performAuthentication();
      const result = await finishAuthentication(transactionId, response);
      status = 'success';
      onSuccess?.(result);
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Login failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }

  async function handleRegister() {
    status = 'loading';
    errorMessage = '';

    try {
      const normalizedUsername = registrationUsername.trim();
      if (!normalizedUsername) {
        throw new Error('Username is required to create a passkey.');
      }

      const { transactionId, response } = await performRegistration(normalizedUsername);
      const result = await finishRegistration(normalizedUsername, transactionId, response);
      status = 'success';
      onSuccess?.(result);
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Registration failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }
</script>

<section class="passkey-login">
  <header>
    <h2>{title}</h2>
    <p>{description}</p>
  </header>

  {#if showLogin}
    <footer>
      <button
        type="button"
        onclick={handleLogin}
        disabled={status === 'loading'}
        aria-busy={status === 'loading'}
      >
        {status === 'loading' ? 'Logging in...' : 'Login with Passkey'}
      </button>
    </footer>
  {/if}

  {#if showRegistration}
    <label>
      <span>Create new passkey for username</span>
      <input
        type="text"
        bind:value={registrationUsername}
        autocomplete="username"
        autocapitalize="off"
        spellcheck="false"
        placeholder="your-handle"
      />
    </label>

    <footer>
      <button
        type="button"
        data-variant="muted"
        onclick={handleRegister}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Waiting for device…' : 'Create Passkey'}
      </button>
    </footer>
  {/if}

  {#if status === 'success'}
    <p role="status" aria-live="polite">Passkey ready.</p>
  {/if}

</section>
