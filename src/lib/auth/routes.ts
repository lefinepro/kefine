import {
	startAuthentication as startWebAuthnAuthentication,
	startRegistration as startWebAuthnRegistration
} from '@simplewebauthn/browser';
import type {
	AuthenticationResponseJSON,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON
} from '@simplewebauthn/types';

export interface PasskeyAuthSuccess {
	verified: true;
	token: string;
	userId: string;
	username: string;
	expiresAt: string;
}

async function postJson<T>(input: RequestInfo | URL, body: unknown): Promise<T> {
	const response = await fetch(input, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	const payload = (await response.json()) as T & { error?: string };
	if (!response.ok) {
		throw new Error(payload.error ?? 'Passkey request failed.');
	}

	return payload;
}

export async function performRegistration(username: string): Promise<RegistrationResponseJSON> {
	const options = await postJson<PublicKeyCredentialCreationOptionsJSON>(
		'/api/passkeys/register/start',
		{ username }
	);

	return startWebAuthnRegistration({ optionsJSON: options });
}

export async function finishRegistration(
	username: string,
	response: RegistrationResponseJSON
): Promise<PasskeyAuthSuccess> {
	return postJson<PasskeyAuthSuccess>('/api/passkeys/register/finish', { username, response });
}

export async function performAuthentication(
	username?: string
): Promise<AuthenticationResponseJSON> {
	const options = await postJson<PublicKeyCredentialRequestOptionsJSON>(
		'/api/passkeys/authenticate/start',
		{ username }
	);

	return startWebAuthnAuthentication({ optionsJSON: options });
}

export async function finishAuthentication(
	response: AuthenticationResponseJSON
): Promise<PasskeyAuthSuccess> {
	return postJson<PasskeyAuthSuccess>('/api/passkeys/authenticate/finish', { response });
}
