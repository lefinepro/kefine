<script lang="ts">
  import { performRegistration, finishRegistration } from '$lib/auth/routes';

  interface Props {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
  }

  let { onSuccess, onError }: Props = $props();

  let username = $state('');
  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');

  async function handleRegister() {
    if (!username.trim()) return;

    status = 'loading';
    errorMessage = '';

    try {
      const attResp = await performRegistration(username);
      const result = await finishRegistration(username, attResp);
      if (result.verified) {
        status = 'success';
        onSuccess?.();
      } else {
        status = 'error';
        errorMessage = 'Registration could not be verified.';
        onError?.(new Error(errorMessage));
      }
    } catch (err) {
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Registration failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }
</script>

<section class="passkey-registration">
  <header>
    <h2>Register with Passkey</h2>
    <p>Create a passkey for secure, passwordless login.</p>
  </header>

  <fieldset>
    <p>
      <label for="reg-username">Username</label>
      <input
        id="reg-username"
        type="text"
        bind:value={username}
        placeholder="Enter your username"
        disabled={status === 'loading'}
        autocomplete="username"
      />
    </p>
  </fieldset>

  <footer>
    <button
      type="button"
      onclick={handleRegister}
      disabled={status === 'loading' || !username.trim()}
      aria-busy={status === 'loading'}
    >
      {status === 'loading' ? 'Registering...' : 'Register with Passkey'}
    </button>
  </footer>

  {#if status === 'success'}
    <p role="status" aria-live="polite">Registration successful! You can now log in with your passkey.</p>
  {/if}

  {#if status === 'error'}
    <p role="alert" aria-live="assertive"><passkey-error>{errorMessage}</passkey-error></p>
  {/if}
</section>
