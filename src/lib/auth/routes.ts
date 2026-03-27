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

interface PasskeyStartResponse<T> {
	options: T;
	transactionId: string;
}

async function postJson<T>(input: RequestInfo | URL, body: unknown): Promise<T> {
	const response = await fetch(input, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});

	const raw = await response.text();
	let payload: (T & { error?: string }) | null = null;

	try {
		payload = raw ? ((JSON.parse(raw) as T & { error?: string })) : null;
	} catch {
		throw new Error(
			`Passkey endpoint returned non-JSON response (${response.status} ${response.statusText}).`
		);
	}

	if (!response.ok) {
		throw new Error(payload?.error ?? 'Passkey request failed.');
	}

	if (!payload) {
		throw new Error('Passkey endpoint returned empty response.');
	}

	return payload;
}

export async function performRegistration(
	username: string
): Promise<{ transactionId: string; response: RegistrationResponseJSON }> {
	const payload = await postJson<PasskeyStartResponse<PublicKeyCredentialCreationOptionsJSON>>(
		'/passkeys/register/start',
		{ username }
	);

	const response = await startWebAuthnRegistration({ optionsJSON: payload.options });
	return {
		transactionId: payload.transactionId,
		response
	};
}

export async function finishRegistration(
	username: string,
	transactionId: string,
	response: RegistrationResponseJSON
): Promise<PasskeyAuthSuccess> {
	return postJson<PasskeyAuthSuccess>('/passkeys/register/finish', { username, transactionId, response });
}

export async function performAuthentication(
	username?: string
): Promise<{ transactionId: string; response: AuthenticationResponseJSON }> {
	const payload = await postJson<PasskeyStartResponse<PublicKeyCredentialRequestOptionsJSON>>(
		'/passkeys/authenticate/start',
		{ username }
	);

	const response = await startWebAuthnAuthentication({ optionsJSON: payload.options });
	return {
		transactionId: payload.transactionId,
		response
	};
}

export async function finishAuthentication(
	transactionId: string,
	response: AuthenticationResponseJSON
): Promise<PasskeyAuthSuccess> {
	return postJson<PasskeyAuthSuccess>('/passkeys/authenticate/finish', { transactionId, response });
}
