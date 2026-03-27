import { writable, get } from 'svelte/store';

const PASSKEY_SESSION_KEY = 'kefine-passkey-session';

export interface PasskeySession {
	token: string;
	username: string;
	userId: string;
	expiresAt: Date;
}

export const passkeySessionStore = writable<PasskeySession | null>(null);

export function readPasskeySession(): PasskeySession | null {
	return get(passkeySessionStore);
}

export function loadPasskeySession(): void {
	if (typeof window === 'undefined') return;

	try {
		const raw = localStorage.getItem(PASSKEY_SESSION_KEY);
		if (!raw) return;

		const parsed = JSON.parse(raw) as Omit<PasskeySession, 'expiresAt'> & { expiresAt: string };
		const session: PasskeySession = {
			...parsed,
			expiresAt: new Date(parsed.expiresAt)
		};

		if (session.expiresAt <= new Date()) {
			clearPasskeySession();
			return;
		}

		passkeySessionStore.set(session);
	} catch {
		clearPasskeySession();
	}
}

export function setPasskeySession(session: PasskeySession): void {
	if (typeof window !== 'undefined') {
		localStorage.setItem(
			PASSKEY_SESSION_KEY,
			JSON.stringify({
				...session,
				expiresAt: session.expiresAt.toISOString()
			})
		);
	}

	passkeySessionStore.set(session);
}

export function clearPasskeySession(): void {
	if (typeof window !== 'undefined') {
		localStorage.removeItem(PASSKEY_SESSION_KEY);
	}

	passkeySessionStore.set(null);
}

export function isPasskeyAuthenticated(): boolean {
	const session = get(passkeySessionStore);
	return Boolean(session && session.expiresAt > new Date());
}
