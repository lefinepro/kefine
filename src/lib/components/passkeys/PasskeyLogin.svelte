<script lang="ts">
  import { startRegistration as startWebAuthnRegistration } from '@simplewebauthn/browser';
  import type { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
  import { get } from 'svelte/store';
  import {
    performAuthentication,
    finishAuthentication,
    type PasskeyAuthSuccess
  } from '$lib/auth/routes';
  import {
    loadPasskeySession,
    passkeySessionStore,
    readPasskeySession,
    type PasskeySession
  } from '$lib/auth/passkey-session';
  import { raceWithDeadline } from '$lib/utils/helpers';

  interface Props {
    title?: string;
    description?: string;
    onSuccess?: (session: PasskeyAuthSuccess) => void;
    onError?: (error: Error) => void;
  }

  let {
    title = 'Passkey',
    description = 'Enter your handle once and continue with an existing passkey or create a new one.',
    onSuccess,
    onError
  }: Props = $props();

  let status = $state<'idle' | 'loading' | 'success' | 'error'>('idle');
  let errorMessage = $state('');
  let username = $state('');
  const PASSKEY_TIMEOUT_MS = 3000;
  const PASSKEY_LOG_PREFIX = '[passkey]';

  $effect(() => {
    loadPasskeySession();
    console.info(`${PASSKEY_LOG_PREFIX} loaded local passkey session`, {
      hasStoredSession: Boolean(readPasskeySession())
    });
  });

  const existingSession = $derived(get(passkeySessionStore));
  const hasExistingPasskey = $derived(Boolean(existingSession));

  function isOfflineOrServerError(error: unknown) {
    if (error instanceof TypeError) {
      return true;
    }

    if (!(error instanceof Error)) {
      return false;
    }

    return /failed to fetch|fetch|network|load failed|request failed|server/i.test(error.message);
  }

  function normalizeUsername(value: string) {
    return value.trim().toLowerCase();
  }

  function toAuthSuccess(session: PasskeySession): PasskeyAuthSuccess {
    return {
      verified: true,
      token: session.token,
      userId: session.userId,
      username: session.username,
      expiresAt: session.expiresAt.toISOString()
    };
  }

  function createLocalPasskeySession(handle: string): PasskeyAuthSuccess {
    const normalizedHandle = normalizeUsername(handle);
    const now = Date.now();

    return {
      verified: true,
      token: `local-passkey:${normalizedHandle}:${now}`,
      userId: `local-passkey-user:${normalizedHandle}`,
      username: normalizedHandle,
      expiresAt: new Date(now + 1000 * 60 * 60 * 24 * 30).toISOString()
    };
  }

  function resolveLocalSession(handle: string) {
    const normalizedHandle = normalizeUsername(handle);
    const session = readPasskeySession();
    if (!session) return null;
    if (!normalizedHandle || session.username === normalizedHandle) {
      return toAuthSuccess(session);
    }

    return null;
  }

  function encodeBase64Url(bytes: Uint8Array) {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function createRandomBase64Url(size = 32) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return encodeBase64Url(bytes);
  }

  function buildLocalRegistrationOptions(handle: string): PublicKeyCredentialCreationOptionsJSON {
    const rpId = window.location.hostname || 'localhost';

    return {
      challenge: createRandomBase64Url(32),
      rp: {
        id: rpId,
        name: 'Lefine'
      },
      user: {
        id: createRandomBase64Url(32),
        name: handle,
        displayName: handle
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      timeout: 60000,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      attestation: 'none'
    };
  }

  async function createLocalPasskeyWithPrompt(handle: string) {
    console.info(`${PASSKEY_LOG_PREFIX} createLocalPasskeyWithPrompt:start`, {
      handle,
      publicKeyCredentialAvailable: Boolean(window.PublicKeyCredential),
      isSecureContext: window.isSecureContext,
      hostname: window.location.hostname
    });

    if (!window.PublicKeyCredential) {
      throw new Error('Passkeys are not supported in this browser.');
    }

    await startWebAuthnRegistration({
      optionsJSON: buildLocalRegistrationOptions(handle),
      useAutoRegister: false
    });

    console.info(`${PASSKEY_LOG_PREFIX} createLocalPasskeyWithPrompt:prompt-complete`, {
      handle
    });

    return createLocalPasskeySession(handle);
  }

  async function handleLogin() {
    status = 'loading';
    errorMessage = '';

    const normalizedHandle = normalizeUsername(username);
    console.info(`${PASSKEY_LOG_PREFIX} login:click`, {
      username,
      normalizedHandle,
      hasExistingPasskey
    });
    const localSession = resolveLocalSession(normalizedHandle);

    if (localSession) {
      console.info(`${PASSKEY_LOG_PREFIX} login:using-local-session`, {
        username: localSession.username
      });
      status = 'success';
      onSuccess?.(localSession);
      return;
    }

    try {
      console.info(`${PASSKEY_LOG_PREFIX} login:server-auth:start`, {
        normalizedHandle
      });
      const { transactionId, response } = await raceWithDeadline(
        performAuthentication(normalizedHandle || undefined),
        PASSKEY_TIMEOUT_MS,
        'Passkey sign in timed out.'
      );
      const result = await raceWithDeadline(
        finishAuthentication(transactionId, response),
        PASSKEY_TIMEOUT_MS,
        'Passkey sign in timed out.'
      );
      console.info(`${PASSKEY_LOG_PREFIX} login:server-auth:success`, {
        username: result.username,
        userId: result.userId
      });
      status = 'success';
      onSuccess?.(result);
    } catch (err) {
      console.error(`${PASSKEY_LOG_PREFIX} login:error`, err);
      const fallbackSession = resolveLocalSession(normalizedHandle);
      if (fallbackSession && isOfflineOrServerError(err)) {
        console.info(`${PASSKEY_LOG_PREFIX} login:fallback-local-session`, {
          username: fallbackSession.username
        });
        status = 'success';
        onSuccess?.(fallbackSession);
        return;
      }

      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Passkey sign in failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }

  async function handleRegister() {
    status = 'loading';
    errorMessage = '';

    const normalizedHandle = normalizeUsername(username);
    console.info(`${PASSKEY_LOG_PREFIX} register:click`, {
      username,
      normalizedHandle,
      isSecureContext: typeof window !== 'undefined' ? window.isSecureContext : false,
      publicKeyCredentialAvailable: typeof window !== 'undefined' ? Boolean(window.PublicKeyCredential) : false
    });

    try {
      if (!normalizedHandle) {
        throw new Error('Username is required to create a passkey.');
      }

      const result = await createLocalPasskeyWithPrompt(normalizedHandle);
      console.info(`${PASSKEY_LOG_PREFIX} register:success`, {
        username: result.username,
        userId: result.userId
      });
      status = 'success';
      onSuccess?.(result);
    } catch (err) {
      console.error(`${PASSKEY_LOG_PREFIX} register:error`, err);
      status = 'error';
      errorMessage = err instanceof Error ? err.message : 'Passkey creation failed.';
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }
</script>

<section class="passkey-login">
  <header class="passkey-login__header">
    <h2>{title}</h2>
    <p>{description}</p>
  </header>

  <label class="passkey-login__field">
    <lefine-text>Handle or username</lefine-text>
    <input
      type="text"
      bind:value={username}
      autocomplete="username webauthn"
      autocapitalize="off"
      spellcheck="false"
      placeholder="discord-handle"
    />
  </label>

  <lefine-box class="passkey-login__actions">
    <button
      type="button"
      class="passkey-login__primary"
      onclick={handleLogin}
      disabled={status === 'loading'}
      aria-busy={status === 'loading'}
    >
      {status === 'loading' ? 'Checking passkey...' : hasExistingPasskey ? 'Use existing passkey' : 'Sign in with passkey'}
    </button>

    <button
      type="button"
      class="passkey-login__secondary"
      onclick={handleRegister}
      disabled={status === 'loading'}
    >
      {status === 'loading' ? 'Creating passkey...' : 'Create passkey'}
    </button>
  </lefine-box>

  {#if hasExistingPasskey && existingSession}
    <p class="passkey-login__hint">Saved locally for @{existingSession.username}</p>
  {/if}

  {#if status === 'success'}
    <p class="passkey-login__status" role="status" aria-live="polite">Passkey ready.</p>
  {/if}

  {#if errorMessage}
    <p class="passkey-login__error" role="alert">{errorMessage}</p>
  {/if}
</section>

<style>
  .passkey-login {
    display: grid;
    gap: 1rem;
  }

  .passkey-login__header {
    display: grid;
    gap: 0.35rem;
  }

  .passkey-login__header h2,
  .passkey-login__header p {
    margin: 0;
  }

  .passkey-login__header p {
    color: var(--lefine-text-soft, #6f6254);
  }

  .passkey-login__field {
    display: grid;
    gap: 0.45rem;
  }

  .passkey-login__field lefine-text {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--lefine-text-soft, #6f6254);
    letter-spacing: 0.01em;
  }

  .passkey-login__field input {
    width: 100%;
    min-height: 3.6rem;
    border: 0;
    border-radius: 1rem;
    padding: 0 1rem;
    background: color-mix(in oklab, var(--kef-bg-card, #fff) 98%, white);
    color: var(--lefine-text, #2e2317);
    font: inherit;
    font-size: 1rem;
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--kef-border, #b8a07a) 24%, transparent),
      0 6px 18px color-mix(in oklab, var(--lefine-text, #2e2317) 4%, transparent);
  }

  .passkey-login__field input:focus {
    outline: none;
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--kef-primary, #6f5540) 42%, transparent),
      0 0 0 2px color-mix(in oklab, var(--kef-primary, #6f5540) 12%, transparent);
  }

  .passkey-login__actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.7rem;
  }

  .passkey-login__primary,
  .passkey-login__secondary {
    min-height: 3.2rem;
    border: 0;
    border-radius: 0.95rem;
    padding: 0 1rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .passkey-login__primary {
    background: var(--kef-primary, #6f5540);
    color: var(--kef-on-primary, #f7f3ec);
  }

  .passkey-login__secondary {
    background: color-mix(in oklab, var(--kef-bg-soft, #efe7dc) 80%, white);
    color: var(--lefine-text, #2e2317);
  }

  .passkey-login__primary:disabled,
  .passkey-login__secondary:disabled {
    opacity: 0.65;
    cursor: default;
  }

  .passkey-login__hint,
  .passkey-login__status,
  .passkey-login__error {
    margin: 0;
    font-size: 0.9rem;
  }

  .passkey-login__hint,
  .passkey-login__status {
    color: var(--lefine-text-soft, #6f6254);
  }

  .passkey-login__error {
    color: var(--kef-error, #8f5b52);
  }

  @media (max-width: 640px) {
    .passkey-login__actions {
      grid-template-columns: 1fr;
    }
  }
</style>
