import { browser } from '$app/environment';
import { saveSession, clearSession, clearWalletSession, loadSession } from './session.js';

export interface AuthState {
	isConnected: boolean;
	address: string | null;
	chainId: number | null;
	email: string | null;
	authType: 'wallet' | 'email' | 'privatekey' | null;
	status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | null;
}

const initialState: AuthState = {
	isConnected: false,
	address: null,
	chainId: null,
	email: null,
	authType: null,
	status: null
};

export const authState: AuthState = $state({ ...initialState });

export function updateAuthState(partial: Partial<AuthState>): void {
	Object.assign(authState, partial);
	if (authState.isConnected) {
		saveSession({
			address: authState.address,
			chainId: authState.chainId,
			email: authState.email,
			authType: authState.authType,
			connectedAt: Date.now()
		});
	}
}

export function replaceAuthState(next: AuthState): void {
	Object.assign(authState, next);
	if (next.isConnected) {
		saveSession({
			address: next.address,
			chainId: next.chainId,
			email: next.email,
			authType: next.authType,
			connectedAt: Date.now()
		});
		return;
	}

	clearWalletSession();
}

export function clearAuthState(): void {
	Object.assign(authState, initialState);
	clearSession();
}

export function hydrateAuthStateFromSession(): void {
	if (!browser) return;

	const session = loadSession();
	if (!session) return;

	Object.assign(authState, {
		isConnected: true,
		address: session.address,
		chainId: session.chainId,
		email: session.email,
		authType: session.authType,
		status: 'reconnecting'
	} satisfies AuthState);
}

if (browser) {
	hydrateAuthStateFromSession();
}
