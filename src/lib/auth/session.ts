import { clearPasskeySession } from './passkey-session.js';

// ---------------------------------------------------------------------------
// Wallet / email session (OKR-015 — Reown AppKit)
// ---------------------------------------------------------------------------

const WALLET_SESSION_KEY = 'auth-session';

export interface SessionData {
	address: string | null;
	chainId: number | null;
	email: string | null;
	authType: 'wallet' | 'email' | 'localhost' | null;
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
	clearPasskeySession();
}
