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
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { raceWithDeadline } from '$lib/utils/helpers';

  interface Props {
    title?: string;
    description?: string;
    onSuccess?: (session: PasskeyAuthSuccess) => void;
    onError?: (error: Error) => void;
  }

  let {
    title,
    description,
    onSuccess,
    onError
  }: Props = $props();

  const localeText = $derived($kefineLocaleText);
  const passkeyLabels = $derived(localeText.auth.passkeyLogin);
  const resolvedTitle = $derived(title ?? passkeyLabels.title);
  const resolvedDescription = $derived(description ?? passkeyLabels.description);
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
      throw new Error(passkeyLabels.unsupported);
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
        passkeyLabels.signInTimedOut
      );
      const result = await raceWithDeadline(
        finishAuthentication(transactionId, response),
        PASSKEY_TIMEOUT_MS,
        passkeyLabels.signInTimedOut
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
      errorMessage = err instanceof Error ? err.message : passkeyLabels.signInFailed;
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
        throw new Error(passkeyLabels.usernameRequired);
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
      errorMessage = err instanceof Error ? err.message : passkeyLabels.creationFailed;
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    }
  }
</script>

<lef-passkey-login>
  <lef-passkey-header>
    <h2>{resolvedTitle}</h2>
    <p>{resolvedDescription}</p>
  </lef-passkey-header>

  <lef-passkey-field>
    <label>
    <lefine-text>{passkeyLabels.handleLabel}</lefine-text>
    <input
      type="text"
      bind:value={username}
      autocomplete="username webauthn"
      autocapitalize="off"
      spellcheck="false"
      placeholder={passkeyLabels.handlePlaceholder}
    />
    </label>
  </lef-passkey-field>

  <lef-passkey-actions>
    <button
      type="button"
      data-role="primary"
      onclick={handleLogin}
      disabled={status === 'loading'}
      aria-busy={status === 'loading'}
    >
      {status === 'loading' ? passkeyLabels.checking : hasExistingPasskey ? passkeyLabels.useExisting : passkeyLabels.signIn}
    </button>

    <button
      type="button"
      data-role="secondary"
      onclick={handleRegister}
      disabled={status === 'loading'}
    >
      {status === 'loading' ? passkeyLabels.creating : passkeyLabels.create}
    </button>
  </lef-passkey-actions>

  {#if hasExistingPasskey && existingSession}
    <lef-passkey-hint>{passkeyLabels.savedLocally(existingSession.username)}</lef-passkey-hint>
  {/if}

  {#if status === 'success'}
    <lef-passkey-status role="status" aria-live="polite">{passkeyLabels.ready}</lef-passkey-status>
  {/if}

  {#if errorMessage}
    <lef-passkey-error role="alert">{errorMessage}</lef-passkey-error>
  {/if}
</lef-passkey-login>

<style>
  lef-passkey-login {
    display: grid;
    gap: 1rem;
  }

  lef-passkey-header {
    display: grid;
    gap: 0.35rem;
  }

  lef-passkey-header h2,
  lef-passkey-header p {
    margin: 0;
  }

  lef-passkey-header p {
    color: var(--lefine-text-soft, #6f6254);
  }

  lef-passkey-field,
  lef-passkey-field label {
    display: grid;
    gap: 0.45rem;
  }

  lef-passkey-field lefine-text {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--lefine-text-soft, #6f6254);
    letter-spacing: 0.01em;
  }

  lef-passkey-field input {
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

  lef-passkey-field input:focus {
    outline: none;
    box-shadow:
      inset 0 0 0 1px color-mix(in oklab, var(--kef-primary, #6f5540) 42%, transparent),
      0 0 0 2px color-mix(in oklab, var(--kef-primary, #6f5540) 12%, transparent);
  }

  lef-passkey-actions {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.7rem;
  }

  lef-passkey-actions button {
    min-height: 3.2rem;
    border: 0;
    border-radius: 0.95rem;
    padding: 0 1rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  lef-passkey-actions button[data-role='primary'] {
    background: var(--kef-primary, #6f5540);
    color: var(--kef-on-primary, #f7f3ec);
  }

  lef-passkey-actions button[data-role='secondary'] {
    background: color-mix(in oklab, var(--kef-bg-soft, #efe7dc) 80%, white);
    color: var(--lefine-text, #2e2317);
  }

  lef-passkey-actions button:disabled {
    opacity: 0.65;
    cursor: default;
  }

  lef-passkey-hint,
  lef-passkey-status,
  lef-passkey-error {
    display: block;
    margin: 0;
    font-size: 0.9rem;
  }

  lef-passkey-hint,
  lef-passkey-status {
    color: var(--lefine-text-soft, #6f6254);
  }

  lef-passkey-error {
    color: var(--kef-error, #8f5b52);
  }

  @media (max-width: 640px) {
    lef-passkey-actions {
      grid-template-columns: 1fr;
    }
  }
</style>
