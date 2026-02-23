/**
 * Passkey (WebAuthn) authentication — client-side handler
 * OKR-013.5 Task 2.4.4 / Task 2.5.4
 *
 * This module wraps the browser's native WebAuthn API and communicates with
 * the server-side registration/authentication endpoints.
 *
 * NOTE: Requires @simplewebauthn/browser package for production use.
 * Install with: bun add @simplewebauthn/browser @simplewebauthn/types
 */

/** Stored credential reference (ID only, key stays on device) */
export interface StoredCredential {
  id: string;
  name: string;
  createdAt: Date;
  lastUsedAt?: Date;
}

/** Registration options returned by server */
export interface RegistrationOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  attestation?: 'direct' | 'indirect' | 'none';
  authenticatorSelection?: {
    residentKey?: 'required' | 'preferred' | 'discouraged';
    userVerification?: 'required' | 'preferred' | 'discouraged';
    authenticatorAttachment?: 'platform' | 'cross-platform';
  };
  excludeCredentials?: Array<{ id: string; type: 'public-key'; transports?: string[] }>;
}

/** Authentication options returned by server */
export interface AuthenticationOptions {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: Array<{ id: string; type: 'public-key'; transports?: string[] }>;
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

/** Passkey registration state */
export type RegistrationState =
  | 'idle'
  | 'starting'
  | 'waiting-for-device'
  | 'verifying'
  | 'success'
  | 'error';

/** Passkey authentication state */
export type AuthenticationState =
  | 'idle'
  | 'starting'
  | 'waiting-for-device'
  | 'verifying'
  | 'success'
  | 'error';

const CREDENTIAL_STORAGE_KEY = 'passkey-credentials';

/** Load stored credential IDs from localStorage */
export function loadStoredCredentials(): StoredCredential[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw, (_key, value) => {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
        return new Date(value);
      }
      return value;
    }) as StoredCredential[];
  } catch {
    return [];
  }
}

/** Save a credential reference to localStorage */
export function saveCredential(credential: StoredCredential): void {
  if (typeof window === 'undefined') return;
  const existing = loadStoredCredentials();
  const updated = [...existing.filter((c) => c.id !== credential.id), credential];
  localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(updated));
}

/** Remove a credential reference from localStorage */
export function removeCredential(credentialId: string): void {
  if (typeof window === 'undefined') return;
  const existing = loadStoredCredentials();
  const updated = existing.filter((c) => c.id !== credentialId);
  localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(updated));
}

/**
 * Check if the browser supports passkeys (WebAuthn)
 */
export function isPasskeySupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator?.credentials?.create === 'function' &&
    typeof navigator?.credentials?.get === 'function'
  );
}

/**
 * Start passkey registration flow
 *
 * @param username - The username to register a passkey for
 * @param startEndpoint - Server endpoint to call for registration options
 * @param finishEndpoint - Server endpoint to send attestation to
 * @param credentialName - Human-readable name for this credential (e.g. "Work Laptop")
 * @returns The registered credential reference
 */
export async function startPasskeyRegistration(
  username: string,
  startEndpoint: string,
  finishEndpoint: string,
  credentialName: string = 'My Device'
): Promise<StoredCredential> {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys (WebAuthn) are not supported in this browser.');
  }

  // Step 1: Get registration options from server
  const optionsRes = await fetch(startEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  if (!optionsRes.ok) {
    throw new Error(`Failed to start registration: ${optionsRes.statusText}`);
  }
  const options: RegistrationOptions = await optionsRes.json();

  // Step 2: Convert base64url challenge and user.id to ArrayBuffer
  const challenge = base64urlToBuffer(options.challenge);
  const userId = base64urlToBuffer(options.user.id);

  // Step 3: Call browser's credential.create()
  const credential = (await navigator.credentials.create({
    publicKey: {
      ...options,
      challenge,
      user: {
        ...options.user,
        id: userId
      },
      excludeCredentials: options.excludeCredentials?.map((c) => ({
        ...c,
        id: base64urlToBuffer(c.id)
      }))
    } as PublicKeyCredentialCreationOptions
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Registration was cancelled or failed.');
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;

  // Step 4: Send attestation to server for verification
  const verifyRes = await fetch(finishEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        attestationObject: bufferToBase64url(attestation.attestationObject),
        clientDataJSON: bufferToBase64url(attestation.clientDataJSON)
      }
    })
  });

  if (!verifyRes.ok) {
    throw new Error(`Registration verification failed: ${verifyRes.statusText}`);
  }

  // Step 5: Store credential reference locally
  const stored: StoredCredential = {
    id: credential.id,
    name: credentialName,
    createdAt: new Date()
  };
  saveCredential(stored);
  return stored;
}

/**
 * Start passkey authentication flow
 *
 * @param startEndpoint - Server endpoint to call for authentication options
 * @param finishEndpoint - Server endpoint to send assertion to
 * @param username - Optional username (for non-resident key flows)
 * @returns The session token issued by the server
 */
export async function startPasskeyAuthentication(
  startEndpoint: string,
  finishEndpoint: string,
  username?: string
): Promise<string> {
  if (!isPasskeySupported()) {
    throw new Error('Passkeys (WebAuthn) are not supported in this browser.');
  }

  // Step 1: Get authentication options from server
  const optionsRes = await fetch(startEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  if (!optionsRes.ok) {
    throw new Error(`Failed to start authentication: ${optionsRes.statusText}`);
  }
  const options: AuthenticationOptions = await optionsRes.json();

  // Step 2: Convert base64url challenge to ArrayBuffer
  const challenge = base64urlToBuffer(options.challenge);

  // Step 3: Call browser's credential.get()
  const credential = (await navigator.credentials.get({
    publicKey: {
      ...options,
      challenge,
      allowCredentials: options.allowCredentials?.map((c) => ({
        ...c,
        id: base64urlToBuffer(c.id)
      }))
    } as PublicKeyCredentialRequestOptions
  })) as PublicKeyCredential | null;

  if (!credential) {
    throw new Error('Authentication was cancelled or failed.');
  }

  const assertion = credential.response as AuthenticatorAssertionResponse;

  // Step 4: Send assertion to server for verification
  const verifyRes = await fetch(finishEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: credential.id,
      rawId: bufferToBase64url(credential.rawId),
      type: credential.type,
      response: {
        authenticatorData: bufferToBase64url(assertion.authenticatorData),
        clientDataJSON: bufferToBase64url(assertion.clientDataJSON),
        signature: bufferToBase64url(assertion.signature),
        userHandle: assertion.userHandle ? bufferToBase64url(assertion.userHandle) : undefined
      }
    })
  });

  if (!verifyRes.ok) {
    throw new Error(`Authentication verification failed: ${verifyRes.statusText}`);
  }

  const result = await verifyRes.json();
  return result.token as string;
}

// --- Helpers ---

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    view[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
