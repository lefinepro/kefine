import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import crypto from 'crypto';

const INTEGRATION_SECRET = process.env.LEFINE_INTEGRATION_SECRET || 'dev-only-lefine-octra-shared-secret-change-me';

// Allowed clients for this simplified integration (only Octra for now)
const ALLOWED_CLIENTS = new Set(['octra']);

// In-memory short lived code store is not needed because we embed everything in the signed code

function signCode(payload: any): string {
	const payloadStr = JSON.stringify(payload);
	const payloadB64 = Buffer.from(payloadStr, 'utf8').toString('base64url');

	const hmac = crypto.createHmac('sha256', INTEGRATION_SECRET);
	hmac.update(payloadB64);
	const sig = hmac.digest('base64url');

	return `${payloadB64}.${sig}`;
}

export const POST: RequestHandler = async ({ request, url }) => {
	const body = await request.json().catch(() => ({}));

	const action = body.action || 'approve';
	const clientId = body.client_id || url.searchParams.get('client_id');
	const redirectUri = body.redirect_uri || url.searchParams.get('redirect_uri');
	const state = body.state || url.searchParams.get('state');

	// Basic validation
	if (!clientId || !ALLOWED_CLIENTS.has(clientId)) {
		return json({ error: 'invalid_client' }, { status: 400 });
	}
	if (!redirectUri) {
		return json({ error: 'invalid_redirect_uri' }, { status: 400 });
	}

	if (action === 'deny') {
		const denyUrl = new URL(redirectUri);
		denyUrl.searchParams.set('error', 'access_denied');
		if (state) denyUrl.searchParams.set('state', state);
		return json({ ok: true, redirect: denyUrl.toString() });
	}

	// Approve - build claims from what the frontend sent us (the logged-in Kefine user)
	const user = body.user || {};
	if (!user.email) {
		return json({ error: 'no_user_session' }, { status: 400 });
	}

	const now = Math.floor(Date.now() / 1000);

	const claims = {
		sub: user.userId || user.id || 'unknown',
		email: user.email,
		username: user.username || user.displayName || user.email.split('@')[0],
		display_name: user.displayName || user.username || '',
		avatar_url: user.avatarUrl || '',
		aud: 'octra',
		iat: now,
		exp: now + 5 * 60, // 5 minutes
	};

	const code = signCode(claims);

	const successUrl = new URL(redirectUri);
	successUrl.searchParams.set('code', code);
	if (state) successUrl.searchParams.set('state', state);

	// We return the redirect target so the frontend can do window.location = ...
	return json({ ok: true, redirect: successUrl.toString() });
};
