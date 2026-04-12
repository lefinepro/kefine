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
import { getCraterBaseUrl } from '$lib/config/kefine-config';
import { buildOrderProxyUrl } from '$lib/order-proxy-path';

export interface PasskeyAuthSuccess {
	verified: true;
	token: string;
	userId: string;
	username: string;
	expiresAt: string;
}

export interface PublicKeyAuthSuccess {
  verified: true;
  token: string;
  userId: string;
  username: string;
  displayName: string;
  handle: string;
  email: string;
  publickey: {
    key: string;
    pem: string;
  };
  keyId: string;
  actorAddress: string;
  authType: 'publickey';
  expiresAt: string;
}

interface PasskeyStartResponse<T> {
	options: T;
	transactionId: string;
}

const PRIVATE_KEY_PREFIX = 'pqsk_';
const PUBLIC_KEY_PREFIX = 'pqpk_';

function normalizePrivateKey(value: string): string {
	return value
		.trim()
		.replace(/\\r\\n/g, '\n')
		.replace(/\\n/g, '\n')
		.replace(/\r\n/g, '\n')
		.replace(/\r/g, '\n')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.join('\n');
}

async function sha256Hex(value: string): Promise<string> {
	const bytes = new TextEncoder().encode(value);
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}

export async function derivePublicKeyFromPrivateKey(privateKey: string): Promise<string> {
	const normalized = privateKey.trim();
	if (!normalized) {
		return '';
	}

	if (normalized.startsWith(PRIVATE_KEY_PREFIX) && normalized.length === 30) {
		return `${PUBLIC_KEY_PREFIX}${normalized.slice(PRIVATE_KEY_PREFIX.length)}`;
	}

	const normalizedPrivateKey = normalizePrivateKey(normalized);
	if (!normalizedPrivateKey) {
		return '';
	}

	const digest = await sha256Hex(normalizedPrivateKey);
	return `${PUBLIC_KEY_PREFIX}${digest.slice(0, 25)}`;
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
		const compactBody = raw.replace(/\s+/g, ' ').trim();
		const preview = compactBody.slice(0, 160);
		throw new Error(
			`Auth endpoint returned non-JSON response (${response.status} ${response.statusText}). ${preview}`
		);
	}

	if (!response.ok) {
		throw new Error(payload?.error ?? 'Auth request failed.');
	}

	if (!payload) {
		throw new Error('Auth endpoint returned empty response.');
	}

	return payload;
}

function buildCraterClientUrl(pathname: string): string {
	return buildOrderProxyUrl(pathname, getCraterBaseUrl());
}

export async function performRegistration(
	username: string
): Promise<{ transactionId: string; response: RegistrationResponseJSON }> {
	const payload = await postJson<PasskeyStartResponse<PublicKeyCredentialCreationOptionsJSON>>(
		buildCraterClientUrl('/passkeys/register/start'),
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
	return postJson<PasskeyAuthSuccess>(buildCraterClientUrl('/passkeys/register/finish'), { username, transactionId, response });
}

export async function performAuthentication(
	username?: string
): Promise<{ transactionId: string; response: AuthenticationResponseJSON }> {
	const payload = await postJson<PasskeyStartResponse<PublicKeyCredentialRequestOptionsJSON>>(
		buildCraterClientUrl('/passkeys/authenticate/start'),
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
	return postJson<PasskeyAuthSuccess>(buildCraterClientUrl('/passkeys/authenticate/finish'), { transactionId, response });
}

export async function loginWithPrivateKey(privateKey?: string): Promise<PublicKeyAuthSuccess> {
	const publicKey = typeof privateKey === 'string' ? await derivePublicKeyFromPrivateKey(privateKey) : '';

	return postJson<PublicKeyAuthSuccess>('/api/auth', {
		publickey: {
			key: publicKey
		}
	});
}
