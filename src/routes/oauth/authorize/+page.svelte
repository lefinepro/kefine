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

<lef-oauth-screen>
	<lef-oauth-shell>
		<!-- Connection visual (like GitHub OAuth) -->
		<lef-oauth-connection>
			<lef-oauth-badge data-app="octra">O</lef-oauth-badge>

			<lef-oauth-link>
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" stroke-width="1.75"/>
					<path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
			</lef-oauth-link>

			<lef-oauth-badge data-app="lefine">K</lef-oauth-badge>
		</lef-oauth-connection>

		<!-- Title -->
		<lef-oauth-title>
			<h1>
				<lefine-text data-accent>Octra</lefine-text> <lefine-text data-muted>by Octra</lefine-text><br />
				<lefine-text data-muted>wants access to your</lefine-text><br />
				<lefine-text data-accent>LeFine</lefine-text> account
			</h1>
		</lef-oauth-title>

		<!-- Main Card -->
		<lef-oauth-card>
			<lef-oauth-card-body>
				<lef-oauth-section>
					<lef-oauth-section-label>Authorizing allows this app to</lef-oauth-section-label>
					<ul>
						<li>
							<lefine-text data-check aria-hidden="true">✓</lefine-text>
							<lefine-text>Verify your LeFine identity <lefine-text data-muted>({shortEmail})</lefine-text></lefine-text>
						</li>
						<li>
							<lefine-text data-check aria-hidden="true">✓</lefine-text>
							<lefine-text>Know which resources you can access</lefine-text>
						</li>
						<li>
							<lefine-text data-check aria-hidden="true">✓</lefine-text>
							<lefine-text>Act on your behalf <lefine-text data-note>(read profile only)</lefine-text></lefine-text>
						</li>
					</ul>
				</lef-oauth-section>

				<lef-oauth-section data-divided>
					<lef-oauth-resource-label>Resources on your account</lef-oauth-resource-label>

					<lef-oauth-resource>
						<lef-oauth-resource-icon>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" aria-hidden="true">
								<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
								<polyline points="22,6 12,13 2,6"/>
							</svg>
						</lef-oauth-resource-icon>
						<lef-oauth-resource-text>
							<lef-oauth-resource-title>Email address <lefine-text data-muted>(read)</lefine-text></lef-oauth-resource-title>
							<lef-oauth-resource-value>{shortEmail}</lef-oauth-resource-value>
						</lef-oauth-resource-text>
					</lef-oauth-resource>
				</lef-oauth-section>

				<!-- Notes -->
				<lef-oauth-notes>
					<lef-oauth-note>
						<lefine-text data-dash aria-hidden="true"></lefine-text>
						<lefine-text>Octra is not owned or operated by LeFine</lefine-text>
					</lef-oauth-note>
					<lef-oauth-note>
						<lefine-text data-dash aria-hidden="true"></lefine-text>
						<lefine-text>Created for internal trusted integration</lefine-text>
					</lef-oauth-note>
				</lef-oauth-notes>
			</lef-oauth-card-body>

			<!-- Action buttons -->
			<lef-oauth-actions>
				{#if loading}
					<lef-oauth-loading>Loading session…</lef-oauth-loading>
				{:else if error === 'not_logged_in' || !session}
					<button type="button" data-variant="primary" data-size="lg" onclick={goToLogin}>
						Sign in to LeFine first
					</button>
				{:else}
					<button type="button" data-variant="ghost" onclick={deny} disabled={isApproving}>
						Cancel
					</button>

					<button type="button" data-variant="primary" data-size="lg" onclick={approve} disabled={isApproving}>
						{#if isApproving}
							<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
								<path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
							</svg>
							Authorizing…
						{:else}
							Authorize Octra
						{/if}
					</button>
				{/if}
			</lef-oauth-actions>
		</lef-oauth-card>

		<lef-oauth-footnote>Authorizing will redirect back to Octra</lef-oauth-footnote>

		{#if error && error !== 'not_logged_in'}
			<lef-oauth-error role="alert">{error}</lef-oauth-error>
		{/if}
	</lef-oauth-shell>
</lef-oauth-screen>

<style>
	lef-oauth-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: calc(100dvh - 4.5rem);
		padding: 1.5rem;
		background: var(--kef-color-bg, #f3e7cf);
		color: var(--kef-color-text, #2e2317);
		font-family: var(--kef-font-family);
	}

	lef-oauth-shell {
		display: flex;
		flex-direction: column;
		width: 100%;
		max-width: 540px;
	}

	/* ─── Connection visual ─────────────────────────────────── */
	lef-oauth-connection {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 280px;
		margin: 0 auto 1.5rem;
		padding: 1rem 0;
	}

	lef-oauth-connection::before {
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

	lef-oauth-badge {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 3.5rem;
		height: 3.5rem;
		border-radius: 1rem;
		font-size: 1.875rem;
		font-weight: 700;
		line-height: 1;
	}

	lef-oauth-badge[data-app='octra'] {
		background: var(--kef-color-bg-soft, #eadcbc);
		color: var(--kef-color-primary, #7a4b2a);
		box-shadow: inset 0 1px 0 color-mix(in oklab, white 8%, transparent),
			0 0 0 1px var(--kef-color-border, rgb(46 35 23 / 0.18));
	}

	lef-oauth-badge[data-app='lefine'] {
		background: var(--kef-color-primary, #7a4b2a);
		color: var(--kef-color-on-primary, #f7edd8);
		letter-spacing: -1.5px;
		box-shadow: var(--kef-shadow-md, 0 4px 10px -2px rgb(36 24 13 / 0.2)),
			0 0 0 1px var(--kef-color-border, rgb(46 35 23 / 0.18));
	}

	lef-oauth-link {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: var(--kef-radius-full, 9999px);
		background: var(--kef-color-bg-card, #f7ecd6);
		border: 1px solid var(--kef-color-border, rgb(46 35 23 / 0.18));
		color: var(--kef-color-primary, #7a4b2a);
	}

	/* ─── Title ─────────────────────────────────────────────── */
	lef-oauth-title {
		display: block;
		text-align: center;
		margin-bottom: 1.5rem;
	}

	lef-oauth-title h1 {
		margin: 0;
		font-size: 1.375rem;
		font-weight: 600;
		letter-spacing: -0.3px;
		line-height: 1.25;
	}

	lefine-text[data-accent] {
		color: var(--kef-color-primary, #7a4b2a);
	}

	lefine-text[data-muted] {
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	/* ─── Card ──────────────────────────────────────────────── */
	lef-oauth-card {
		display: block;
		background: var(--kef-color-bg-card, #f7ecd6);
		border: 1px solid var(--kef-color-border, rgb(46 35 23 / 0.18));
		border-radius: 1.5rem;
		box-shadow: var(--kef-shadow-lg, 0 10px 20px -5px rgb(36 24 13 / 0.24));
		overflow: hidden;
	}

	lef-oauth-card-body {
		display: block;
		padding: 1.5rem 1.75rem 1.75rem;
	}

	lef-oauth-section {
		display: block;
	}

	lef-oauth-section + lef-oauth-section {
		margin-top: 1.25rem;
	}

	lef-oauth-section[data-divided] {
		border-top: 1px solid var(--kef-color-border-light, rgb(46 35 23 / 0.09));
		padding-top: 1.25rem;
	}

	lef-oauth-section-label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.625rem;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 1px;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	lef-oauth-section ul {
		display: flex;
		flex-direction: column;
		gap: 0.4375rem;
		margin: 0;
		padding: 0;
		font-size: 0.84375rem;
	}

	lef-oauth-section li {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
	}

	lefine-text[data-check] {
		flex-shrink: 0;
		margin-top: 0.125rem;
		font-size: 1.125rem;
		line-height: 1;
		color: var(--kef-color-success, #3e6a4a);
	}

	lefine-text[data-note] {
		font-size: 0.625rem;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	/* ─── Resource row ──────────────────────────────────────── */
	lef-oauth-resource-label {
		display: block;
		margin-bottom: 0.625rem;
		font-size: 0.6875rem;
		font-weight: 500;
		letter-spacing: 0.025em;
		color: var(--kef-color-text-label, #4a3a28);
	}

	lef-oauth-resource {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0.875rem;
		background: var(--kef-color-bg, #f3e7cf);
		border: 1px solid var(--kef-color-border-light, rgb(46 35 23 / 0.09));
		border-radius: 1rem;
	}

	lef-oauth-resource-icon {
		display: flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.75rem;
		background: var(--kef-color-primary-soft, color-mix(in oklab, #7a4b2a 20%, transparent));
		color: var(--kef-color-primary, #7a4b2a);
	}

	lef-oauth-resource-text {
		display: block;
		min-width: 0;
		flex: 1;
	}

	lef-oauth-resource-title {
		display: block;
		font-size: 0.84375rem;
		font-weight: 500;
	}

	lef-oauth-resource-value {
		display: block;
		font-size: 0.6875rem;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* ─── Notes ─────────────────────────────────────────────── */
	lef-oauth-notes {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-top: 1.25rem;
		font-size: 0.65625rem;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	lef-oauth-note {
		display: flex;
		align-items: center;
		gap: 0.375rem;
	}

	lefine-text[data-dash] {
		display: inline-block;
		flex-shrink: 0;
		width: 0.75rem;
		height: 1px;
		background: var(--kef-color-border, rgb(46 35 23 / 0.18));
	}

	/* ─── Actions ───────────────────────────────────────────── */
	lef-oauth-actions {
		display: flex;
		gap: 0.75rem;
		padding: 1.25rem 1.75rem;
		border-top: 1px solid var(--kef-color-border, rgb(46 35 23 / 0.18));
		background: var(--kef-color-bg, #f3e7cf);
	}

	lef-oauth-actions button {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding-top: 0.8125rem;
		padding-bottom: 0.8125rem;
		border-radius: 1rem;
	}

	lef-oauth-actions button svg {
		width: 0.875rem;
		height: 0.875rem;
		animation: lef-oauth-spin 0.8s linear infinite;
	}

	lef-oauth-loading {
		flex: 1;
		padding: 0.25rem 0;
		text-align: center;
		font-size: 0.875rem;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	@keyframes lef-oauth-spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* ─── Footnote / error ──────────────────────────────────── */
	lef-oauth-footnote {
		display: block;
		margin-top: 1.25rem;
		text-align: center;
		font-size: 0.625rem;
		color: var(--kef-color-text-tertiary, color-mix(in oklab, #2e2317 40%, transparent));
	}

	lef-oauth-error {
		display: block;
		margin-top: 0.75rem;
		padding: 0.625rem 0.875rem;
		text-align: center;
		font-size: 0.8125rem;
		border-radius: 0.85rem;
		background: var(--kef-color-error-soft, color-mix(in oklab, #9b3d35 24%, transparent));
		color: var(--kef-color-error, #9b3d35);
	}

	@media (max-width: 640px) {
		lef-oauth-connection {
			display: none;
		}
	}
</style>
