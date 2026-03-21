import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { completePasskeyRegistration } from '$lib/server/passkeys/store';
import type { RegistrationResponseJSON } from '@simplewebauthn/types';

const REGISTER_COOKIE = 'kefine-passkey-register-tx';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const transactionId = cookies.get(REGISTER_COOKIE);
		if (!transactionId) {
			return json({ error: 'Registration challenge is missing.' }, { status: 400 });
		}

		const { username, response } = (await request.json()) as {
			username?: string;
			response?: RegistrationResponseJSON;
		};

		if (!response) {
			return json({ error: 'Registration response is missing.' }, { status: 400 });
		}

		const session = await completePasskeyRegistration({
			username: username ?? '',
			response,
			expectedOrigin: url.origin,
			expectedRPID: url.hostname,
			transactionId
		});

		cookies.delete(REGISTER_COOKIE, { path: '/' });
		return json({ verified: true, ...session });
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to verify passkey registration.' },
			{ status: 400 }
		);
	}
};
