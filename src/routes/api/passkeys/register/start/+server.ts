import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { beginPasskeyRegistration } from '$lib/server/passkeys/store';

const REGISTER_COOKIE = 'kefine-passkey-register-tx';

export const POST: RequestHandler = async ({ request, url, cookies }) => {
	try {
		const { username } = (await request.json()) as { username?: string };
		const { options, transactionId } = await beginPasskeyRegistration({
			username: username ?? '',
			rpName: 'Kefine Solver Exchange',
			rpID: url.hostname
		});

		cookies.set(REGISTER_COOKIE, transactionId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 5 * 60
		});

		return json(options);
	} catch (error) {
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to start passkey registration.' },
			{ status: 400 }
		);
	}
};
