<script lang="ts">
	import { onMount } from 'svelte';
	import { loadSession, type SessionData } from '$lib/auth/session';

	let session: SessionData | null = null;
	let loading = true;
	let error = '';

	let clientId = '';
	let redirectUri = '';
	let state = '';

	let isApproving = false;

	onMount(() => {
		const params = new URLSearchParams(window.location.search);
		clientId = params.get('client_id') || '';
		redirectUri = params.get('redirect_uri') || '';
		state = params.get('state') || '';

		session = loadSession();

		if (!session || !session.email) {
			error = 'not_logged_in';
		}
		loading = false;

		// If we have a saved oauth return and user just logged in, auto-redirect back
		const savedReturn = sessionStorage.getItem('lefine_oauth_return');
		if (savedReturn && session && session.email) {
			sessionStorage.removeItem('lefine_oauth_return');
			// Only if we're currently on a plain / page or home
			if (window.location.pathname === '/' || window.location.pathname === '/kefine') {
				window.location.href = savedReturn;
			}
		}
	});

	function goToLogin() {
		sessionStorage.setItem('lefine_oauth_return', window.location.href);
		window.location.href = '/';
	}

	async function approve() {
		if (!session || !redirectUri) return;

		isApproving = true;
		error = '';

		try {
			const res = await fetch('/oauth/authorize', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'approve',
					client_id: clientId,
					redirect_uri: redirectUri,
					state,
					user: {
						userId: session.userId,
						email: session.email,
						username: session.handle || session.displayName,
						displayName: session.displayName,
						avatarUrl: null
					}
				})
			});

			const data = await res.json();
			if (data.redirect) {
				window.location.href = data.redirect;
			} else {
				error = data.error || 'Failed to authorize';
			}
		} catch (e) {
			error = 'Network error. Please try again.';
		} finally {
			isApproving = false;
		}
	}

	function deny() {
		if (!redirectUri) {
			window.location.href = '/';
			return;
		}
		const url = new URL(redirectUri);
		url.searchParams.set('error', 'access_denied');
		if (state) url.searchParams.set('state', state);
		window.location.href = url.toString();
	}

	$: displayName = session?.displayName || session?.email?.split('@')[0] || 'LeFine user';
	$: shortEmail = session?.email || '';
</script>

<svelte:head>
	<title>Authorize Octra • LeFine</title>
</svelte:head>

<div class="min-h-screen bg-[var(--kef-color-bg)] text-[var(--kef-color-text)] flex flex-col items-center justify-center p-6"
     style="font-family: var(--kef-font-family)">
	<div class="w-full max-w-[540px]">
		<!-- Connection visual (like GitHub OAuth) -->
		<div class="DashedConnection mb-6 mx-auto hidden md:block" style="width: 280px;">
			<div class="flex justify-between items-center py-4">
				<!-- Octra -->
				<div class="w-14 h-14 rounded-2xl bg-[#1f1812] flex items-center justify-center ring-1 ring-[var(--kef-color-border)] shadow-inner">
					<span class="text-3xl font-bold text-[#c89a5a]">O</span>
				</div>

				<div class="relative w-8 h-8 rounded-full bg-[var(--kef-color-bg-card)] border border-[var(--kef-color-border)] flex items-center justify-center">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-[var(--kef-color-primary)]">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.75"/>
						<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>

				<!-- LeFine -->
				<div class="w-14 h-14 rounded-2xl bg-[var(--kef-color-primary)] flex items-center justify-center ring-1 ring-[var(--kef-color-border)] shadow-md">
					<span class="text-3xl font-bold text-[var(--kef-color-bg)] tracking-[-1.5px]">K</span>
				</div>
			</div>
		</div>

		<!-- Title -->
		<div class="text-center mb-6">
			<h1 class="text-[22px] font-semibold tracking-[-0.3px] leading-tight">
				<span class="text-[var(--kef-color-primary)]">Octra</span>
				<span class="text-[var(--kef-color-text-tertiary)]"> by Octra</span><br>
				<span class="text-[var(--kef-color-text-tertiary)]">wants access to your</span><br>
				<span class="text-[var(--kef-color-primary)]">LeFine</span> account
			</h1>
		</div>

		<!-- Main Card -->
		<div class="bg-[var(--kef-color-bg-card)] border border-[var(--kef-color-border)] rounded-3xl shadow-2xl overflow-hidden">
			<div class="p-7 pt-6">
				<div class="mb-5">
					<div class="uppercase tracking-[1px] text-[10px] font-medium text-[var(--kef-color-text-tertiary)] mb-2">Authorizing allows this app to</div>
					<ul class="space-y-[7px] text-[13.5px]">
						<li class="flex gap-2.5 items-start">
							<span class="mt-0.5 text-[var(--kef-color-success)] text-lg leading-none">✓</span>
							<span>Verify your LeFine identity <span class="text-[var(--kef-color-text-tertiary)]">({shortEmail})</span></span>
						</li>
						<li class="flex gap-2.5 items-start">
							<span class="mt-0.5 text-[var(--kef-color-success)] text-lg leading-none">✓</span>
							<span>Know which resources you can access</span>
						</li>
						<li class="flex gap-2.5 items-start">
							<span class="mt-0.5 text-[var(--kef-color-success)] text-lg leading-none">✓</span>
							<span>Act on your behalf <span class="text-[10px] text-[var(--kef-color-text-tertiary)]">(read profile only)</span></span>
						</li>
					</ul>
				</div>

				<div class="border-t border-[var(--kef-color-border-light)] pt-5">
					<div class="text-[11px] font-medium tracking-wide text-[var(--kef-color-text-label)] mb-2.5">Resources on your account</div>

					<div class="flex items-center gap-3 bg-[var(--kef-color-bg)] border border-[var(--kef-color-border-light)] rounded-2xl px-3.5 py-3">
						<div class="w-8 h-8 flex-shrink-0 rounded-xl bg-[var(--kef-color-primary-soft)] flex items-center justify-center">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" class="text-[var(--kef-color-primary)]">
								<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
								<polyline points="22,6 12,13 2,6"/>
							</svg>
						</div>
						<div class="min-w-0 flex-1">
							<div class="font-medium text-[13.5px]">Email address <span class="text-[var(--kef-color-text-tertiary)] text-xs font-normal">(read)</span></div>
							<div class="text-[11px] text-[var(--kef-color-text-tertiary)] truncate">{shortEmail}</div>
						</div>
					</div>
				</div>

				<!-- Notes -->
				<div class="mt-5 space-y-1 text-[10.5px] text-[var(--kef-color-text-tertiary)]">
					<div class="flex items-center gap-1.5">
						<span class="inline-block w-3 h-px bg-[var(--kef-color-border)]"></span>
						<span>Octra is not owned or operated by LeFine</span>
					</div>
					<div class="flex items-center gap-1.5">
						<span class="inline-block w-3 h-px bg-[var(--kef-color-border)]"></span>
						<span>Created for internal trusted integration</span>
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="border-t border-[var(--kef-color-border)] bg-[var(--kef-color-bg)] px-7 py-5 flex gap-3">
				{#if loading}
					<div class="w-full text-center text-sm py-1 text-[var(--kef-color-text-tertiary)]">Loading session…</div>
				{:else if error === 'not_logged_in' || !session}
					<button
						on:click={goToLogin}
						class="flex-1 py-3 rounded-2xl bg-[var(--kef-color-primary)] hover:bg-[var(--kef-color-primary-hover)] active:scale-[0.985] text-[var(--kef-color-on-primary)] font-semibold text-sm transition-all"
					>
						Sign in to LeFine first
					</button>
				{:else}
					<button
						on:click={deny}
						disabled={isApproving}
						class="flex-1 py-[13px] rounded-2xl border border-[var(--kef-color-border)] hover:bg-[var(--kef-color-bg-hover)] font-medium text-sm transition-colors disabled:opacity-60"
					>
						Cancel
					</button>

					<button
						on:click={approve}
						disabled={isApproving}
						class="flex-1 py-[13px] rounded-2xl bg-[var(--kef-color-primary)] hover:bg-[var(--kef-color-primary-hover)] text-[var(--kef-color-on-primary)] font-semibold text-sm transition-all active:scale-[0.985] disabled:opacity-70 flex items-center justify-center gap-2"
					>
						{#if isApproving}
							<svg class="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
								<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
							</svg>
							Authorizing…
						{:else}
							Authorize Octra
						{/if}
					</button>
				{/if}
			</div>
		</div>

		<div class="text-center mt-5 text-[10px] text-[var(--kef-color-text-tertiary)]">
			Authorizing will redirect back to Octra
		</div>
	</div>
</div>

<style>
	.DashedConnection {
		position: relative;
	}
	.DashedConnection::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 15%;
		right: 15%;
		height: 1px;
		background: repeating-linear-gradient(
			to right,
			var(--kef-color-border) 0,
			var(--kef-color-border) 4px,
			transparent 4px,
			transparent 9px
		);
		z-index: 0;
	}
</style>
