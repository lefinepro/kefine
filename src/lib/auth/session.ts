/**
 * Session management for passkey-authenticated users
 * OKR-013.5 Task 2.5.5
 */

import { writable, get } from 'svelte/store';

const SESSION_KEY = 'ap-session-token';
const SESSION_EXPIRY_KEY = 'ap-session-expiry';

export interface Session {
  token: string;
  username: string;
  actorId: string;
  expiresAt: Date;
}

/** Current session store — null when not authenticated */
export const sessionStore = writable<Session | null>(null);

/**
 * Load session from localStorage on app startup
 */
export function loadSession(): void {
  if (typeof window === 'undefined') return;

  const token = localStorage.getItem(SESSION_KEY);
  const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);

  if (!token || !expiryStr) return;

  const expiresAt = new Date(expiryStr);
  if (expiresAt <= new Date()) {
    // Session expired
    clearSession();
    return;
  }

  // Note: username and actorId would normally come from the token (JWT decode)
  // or a server check. For now we stub with empty strings.
  sessionStore.set({
    token,
    username: '',
    actorId: '',
    expiresAt
  });
}

/**
 * Persist a new session to localStorage and store
 */
export function setSession(session: Session): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(SESSION_KEY, session.token);
    localStorage.setItem(SESSION_EXPIRY_KEY, session.expiresAt.toISOString());
  }
  sessionStore.set(session);
}

/**
 * Clear the current session (logout)
 */
export function clearSession(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
  }
  sessionStore.set(null);
}

/**
 * Check whether there is an active (non-expired) session
 */
export function isAuthenticated(): boolean {
  const session = get(sessionStore);
  if (!session) return false;
  return session.expiresAt > new Date();
}

/**
 * Get the Authorization header value for API requests
 */
export function getAuthHeader(): string | null {
  const session = get(sessionStore);
  if (!session || !isAuthenticated()) return null;
  return `Bearer ${session.token}`;
}

/**
 * Attempt to refresh the session from the server
 *
 * @param refreshEndpoint - Server endpoint to call for session refresh
 */
export async function refreshSession(refreshEndpoint: string): Promise<boolean> {
  const session = get(sessionStore);
  if (!session) return false;

  try {
    const res = await fetch(refreshEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.token}`
      }
    });

    if (!res.ok) {
      clearSession();
      return false;
    }

    const data = await res.json();
    setSession({
      ...session,
      token: data.token,
      expiresAt: new Date(data.expiresAt)
    });
    return true;
  } catch {
    return false;
  }
}
