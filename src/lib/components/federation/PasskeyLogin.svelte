<script lang="ts">
  import { performAuthentication, finishAuthentication } from '$lib/auth/routes';

  interface Props {
    onSuccess?: (userId: string) => void;
    onError?: (error: Error) => void;
  }

  let { onSuccess, onError }: Props = $props();

  let username = $state('');
  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  async function handleLogin() {
    status = 'loading';
    errorMessage = '';

    try {
      const authnResp = await performAuthentication(username.trim() || undefined);
      const result = await finishAuthentication(authnResp);
      if (result.verified && result.userId) {
        status = 'success';
        onSuccess?.(result.userId);
      } else {
        status = 'error';
        errorMessage = 'Authentication could not be verified.';
        onError?.(new Error(errorMessage));
      }
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Login failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }
</script>

<section class="passkey-login">
  <header>
    <h2>Login with Passkey</h2>
    <p>Use your registered passkey for secure, passwordless login.</p>
  </header>

  <fieldset>
    <p>
      <label for="login-username">Username <hint>(optional)</hint></label>
      <input
        id="login-username"
        type="text"
        bind:value={username}
        placeholder="Enter your username (optional)"
        disabled={status === 'loading'}
        autocomplete="username webauthn"
      />
    </p>
  </fieldset>

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

  {#if status === 'success'}
    <p role="status" aria-live="polite">Login successful!</p>
  {/if}

  {#if status === 'error'}
    <p role="alert" aria-live="assertive"><passkey-error>{errorMessage}</passkey-error></p>
  {/if}
</section>
