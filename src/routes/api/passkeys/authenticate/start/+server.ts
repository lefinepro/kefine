import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { beginPasskeyAuthentication } from '$lib/server/passkeys/store';

const AUTH_COOKIE = 'kefine-passkey-auth-tx';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const { username } = (await request.json()) as { username?: string };
		const { options, transactionId } = await beginPasskeyAuthentication({
			username,
			rpID: url.hostname
		});

		cookies.set(AUTH_COOKIE, transactionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 5 * 60
		});

		return json(options);
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to start passkey login.' },
			{ status: 400 }
		);
	}
};
