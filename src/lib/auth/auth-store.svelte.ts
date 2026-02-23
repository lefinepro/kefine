import { browser } from '$app/environment';
import { saveSession, clearSession } from './session.js';

export interface AuthState {
	isConnected: boolean;
	address: string | null;
	chainId: number | null;
	email: string | null;
	authType: 'wallet' | 'email' | null;
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

export function clearAuthState(): void {
	Object.assign(authState, initialState);
	clearSession();
}

if (browser) {
	// Lazily import appkit to avoid circular deps and ensure browser-only init
	import('./appkit.js').then(({ appkit }) => {
		if (!appkit) return;

		appkit.subscribeAccount((account) => {
			const email = account.embeddedWalletInfo?.user?.email ?? null;
			const authProvider = account.embeddedWalletInfo?.authProvider ?? null;
			const authType: 'wallet' | 'email' | null =
				authProvider === 'email' ? 'email' : account.isConnected ? 'wallet' : null;

			updateAuthState({
				isConnected: account.isConnected,
				address: account.address ?? null,
				email,
				authType,
				status: account.status ?? null
			});
		});
	});
}
