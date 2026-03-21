import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { completePasskeyAuthentication } from '$lib/server/passkeys/store';
import type { AuthenticationResponseJSON } from '@simplewebauthn/types';

const AUTH_COOKIE = 'kefine-passkey-auth-tx';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const transactionId = cookies.get(AUTH_COOKIE);
		if (!transactionId) {
			return json({ error: 'Authentication challenge is missing.' }, { status: 400 });
		}

		const { response } = (await request.json()) as { response?: AuthenticationResponseJSON };
		if (!response) {
			return json({ error: 'Authentication response is missing.' }, { status: 400 });
		}

		const session = await completePasskeyAuthentication({
			response,
			expectedOrigin: url.origin,
			expectedRPID: url.hostname,
			transactionId
		});

		cookies.delete(AUTH_COOKIE, { path: '/' });
		return json({ verified: true, ...session });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to verify passkey login.' },
			{ status: 400 }
		);
	}
};
