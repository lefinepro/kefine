/**
 * Session management — covers both wallet/email (OKR-015) and
 * passkey/ActivityPub (OKR-013) authentication flows.
 */

import { writable, get } from 'svelte/store';

// ---------------------------------------------------------------------------
// Wallet / email session (OKR-015 — Reown AppKit)
// ---------------------------------------------------------------------------

const WALLET_SESSION_KEY = 'auth-session';

export interface SessionData {
	address: string | null;
	chainId: number | null;
	email: string | null;
	authType: 'wallet' | 'email' | null;
	connectedAt: number;
}

export function saveSession(data: SessionData): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem(WALLET_SESSION_KEY, JSON.stringify(data));
	} catch {
		// localStorage may be unavailable
	}
}

export function loadSession(): SessionData | null {
	if (typeof window === 'undefined') return null;
	try {
		const raw = localStorage.getItem(WALLET_SESSION_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as SessionData;
	} catch {
		return null;
	}
}

export function clearSession(): void {
	if (typeof window === 'undefined') return;
	try {
		localStorage.removeItem(WALLET_SESSION_KEY);
	} catch {
		// localStorage may be unavailable
	}
	// Also clear passkey session if present
	apSessionStore.set(null);
	if (typeof window !== 'undefined') {
		localStorage.removeItem(AP_SESSION_KEY);
		localStorage.removeItem(AP_SESSION_EXPIRY_KEY);
	}
}

// ---------------------------------------------------------------------------
// Passkey / ActivityPub session (OKR-013 — ForgeFed integration)
// ---------------------------------------------------------------------------

const AP_SESSION_KEY = 'ap-session-token';
const AP_SESSION_EXPIRY_KEY = 'ap-session-expiry';

export interface APSession {
	token: string;
	username: string;
	actorId: string;
	expiresAt: Date;
}

/** Current ActivityPub session store — null when not authenticated */
export const apSessionStore = writable<APSession | null>(null);

/** Alias kept for components that import sessionStore directly */
export const sessionStore = apSessionStore;

/**
 * Load passkey session from localStorage on app startup
 */
export function loadAPSession(): void {
	if (typeof window === 'undefined') return;

	const token = localStorage.getItem(AP_SESSION_KEY);
	const expiryStr = localStorage.getItem(AP_SESSION_EXPIRY_KEY);

	if (!token || !expiryStr) return;

	const expiresAt = new Date(expiryStr);
	if (expiresAt <= new Date()) {
		clearAPSession();
		return;
	}

	apSessionStore.set({ token, username: '', actorId: '', expiresAt });
}

/**
 * Persist a new passkey session to localStorage and store
 */
export function setAPSession(session: APSession): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(AP_SESSION_KEY, session.token);
		localStorage.setItem(AP_SESSION_EXPIRY_KEY, session.expiresAt.toISOString());
	}
	apSessionStore.set(session);
}

/**
 * Clear the passkey session (logout)
 */
export function clearAPSession(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(AP_SESSION_KEY);
		localStorage.removeItem(AP_SESSION_EXPIRY_KEY);
	}
	apSessionStore.set(null);
}

/**
 * Check whether there is an active (non-expired) passkey session
 */
export function isAuthenticated(): boolean {
	const session = get(apSessionStore);
	if (!session) return false;
	return session.expiresAt > new Date();
}

/**
 * Get the Authorization header value for ActivityPub API requests
 */
export function getAuthHeader(): string | null {
	const session = get(apSessionStore);
	if (!session || !isAuthenticated()) return null;
	return `Bearer ${session.token}`;
}

/**
 * Attempt to refresh the passkey session from the server
 *
 * @param refreshEndpoint - Server endpoint to call for session refresh
 */
export async function refreshSession(refreshEndpoint: string): Promise<boolean> {
	const session = get(apSessionStore);
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
			clearAPSession();
			return false;
		}

		const data = await res.json();
		setAPSession({ ...session, token: data.token, expiresAt: new Date(data.expiresAt) });
		return true;
	} catch {
		return false;
	}
}
