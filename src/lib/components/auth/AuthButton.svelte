<script lang="ts">
	import { browser } from '$app/environment';
	import { authState } from '$lib/auth/auth-store.svelte.js';
	import { kefineLocaleText } from '$lib/constants/kefine-locale';

	const localeText = $derived($kefineLocaleText);

	function truncateAddress(address: string): string {
		return `${address.slice(0, 6)}...${address.slice(-4)}`;
	}

	function handleConnect(): void {
		if (!browser) return;
		import('$lib/auth/appkit.js').then(({ openAppKit }) => {
			void openAppKit();
		});
	}

	function handleDisconnect(): void {
		if (!browser) return;
		import('$lib/auth/appkit.js').then(({ disconnectAppKit }) => {
			void disconnectAppKit();
		});
	}

	const isLoading = $derived(
		authState.status === 'connecting' || authState.status === 'reconnecting'
	);

	const label = $derived(() => {
		const authButton = localeText.auth.authButton;
		if (isLoading) return authButton.connecting;
		if (!authState.isConnected) return authButton.connect;
		if (authState.email) return authState.email;
		if (authState.address) return truncateAddress(authState.address);
		return authButton.connected;
	});
</script>

{#if authState.isConnected}
	<auth-account>
		<auth-identity aria-label={localeText.auth.authButton.connectedAccount}>
			{#if authState.email}
				<auth-email>{authState.email}</auth-email>
			{:else if authState.address}
				<auth-address title={authState.address}>{truncateAddress(authState.address)}</auth-address>
			{/if}
		</auth-identity>
		<button
			type="button"
			data-variant="muted"
			aria-label={localeText.auth.authButton.disconnectWallet}
			onclick={handleDisconnect}
		>
			{localeText.auth.authButton.disconnect}
		</button>
	</auth-account>
{:else}
	<button
		type="button"
		data-variant="primary"
		aria-label={localeText.auth.authButton.connectWalletOrEmail}
		aria-busy={isLoading}
		disabled={isLoading}
		onclick={handleConnect}
	>
		{label()}
	</button>
{/if}

<style>
	auth-account {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	auth-identity {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}

	auth-email,
	auth-address {
		font-weight: 500;
		cursor: default;
	}
</style>
