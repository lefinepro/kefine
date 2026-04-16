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
import { buildOrderProxyUrl } from '$lib/order-proxy-path';
import {
  loadGeneratedPrivateKeyCookie,
  loadGeneratedPublicKeyCookie,
  saveGeneratedPrivateKeyCookie,
  saveGeneratedPublicKeyCookie
} from '$lib/auth/publickey-cookie';

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
const LEGACY_PUBLIC_KEY_PREFIX = 'pqpk_';
const ML_DSA_65_SECRET_KEY_LENGTH = 4032;
const ML_DSA_65_PUBLIC_DER_PREFIX = new Uint8Array([
	0x30, 0x82, 0x07, 0xb2, 0x30, 0x0b, 0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04,
	0x03, 0x12, 0x03, 0x82, 0x07, 0xa1, 0x00
]);

function normalizePrivateKeyInput(value: string): string {
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

function decodePemBody(pem: string): Uint8Array {
	const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
	if (!base64) {
		throw new Error('Private key PEM is empty.');
	}

	const binary = atob(base64);
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodePem(label: string, bytes: Uint8Array): string {
	const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
	const base64 = btoa(binary);
	const lines = base64.match(/.{1,64}/g) ?? [];
	return [`-----BEGIN ${label}-----`, ...lines, `-----END ${label}-----`].join('\n');
}

function encodeKeyString(value: string, prefix: string): string {
	const bytes = new TextEncoder().encode(value);
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return `${prefix}${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

function encodeCompactBytes(bytes: Uint8Array, prefix = ''): string {
	let binary = '';
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}

	return `${prefix}${btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')}`;
}

function decodeCompactBytes(value: string, prefix = ''): Uint8Array {
	const encoded = prefix ? value.slice(prefix.length) : value;
	if (!encoded) {
		return new Uint8Array();
	}

	const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
	const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeKeyString(value: string, prefix: string): string {
	const encoded = value.slice(prefix.length);
	if (!encoded) {
		return '';
	}

	const padded = encoded + '='.repeat((4 - (encoded.length % 4)) % 4);
	const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	return Array.from(binary, (char) => String.fromCharCode(char.charCodeAt(0))).join('');
}

export async function derivePublicKeyFromPrivateKey(privateKey: string): Promise<string> {
	const normalizedInput = normalizePrivateKeyInput(privateKey);
	if (!normalizedInput) {
		throw new Error('Private key is required.');
	}

	const normalized = normalizedInput.startsWith(PRIVATE_KEY_PREFIX)
		? (() => {
			const decodedText = decodeKeyString(normalizedInput, PRIVATE_KEY_PREFIX);
			if (decodedText.includes('BEGIN PRIVATE KEY')) {
				return normalizePrivateKeyInput(decodedText);
			}

			return encodePem('PRIVATE KEY', decodeCompactBytes(normalizedInput, PRIVATE_KEY_PREFIX));
		})()
		: normalizedInput;

	if (!normalized.includes('BEGIN PRIVATE KEY')) {
		throw new Error('Paste a compact pqsk key or the full PEM private key string.');
	}

	const privateKeyDer = decodePemBody(normalized);
	if (privateKeyDer.length < ML_DSA_65_SECRET_KEY_LENGTH) {
		throw new Error('Private key PEM is too short for ML-DSA-65.');
	}

	const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js');
	const secretKey = privateKeyDer.slice(privateKeyDer.length - ML_DSA_65_SECRET_KEY_LENGTH);
	const publicKey = ml_dsa65.getPublicKey(secretKey);
	const publicKeyDer = new Uint8Array(ML_DSA_65_PUBLIC_DER_PREFIX.length + publicKey.length);
	publicKeyDer.set(ML_DSA_65_PUBLIC_DER_PREFIX, 0);
	publicKeyDer.set(publicKey, ML_DSA_65_PUBLIC_DER_PREFIX.length);

	const publicKeyPem = encodePem('PUBLIC KEY', publicKeyDer);
	return encodeKeyString(publicKeyPem, LEGACY_PUBLIC_KEY_PREFIX);
}

export async function derivePortablePublicKeyFromPrivateKey(privateKey: string): Promise<string> {
	const normalizedInput = normalizePrivateKeyInput(privateKey);
	if (!normalizedInput) {
		throw new Error('Private key is required.');
	}

	const normalized = normalizedInput.startsWith(PRIVATE_KEY_PREFIX)
		? (() => {
			const decodedText = decodeKeyString(normalizedInput, PRIVATE_KEY_PREFIX);
			if (decodedText.includes('BEGIN PRIVATE KEY')) {
				return normalizePrivateKeyInput(decodedText);
			}

			return encodePem('PRIVATE KEY', decodeCompactBytes(normalizedInput, PRIVATE_KEY_PREFIX));
		})()
		: normalizedInput;

	const privateKeyDer = decodePemBody(normalized);
	if (privateKeyDer.length < ML_DSA_65_SECRET_KEY_LENGTH) {
		throw new Error('Private key PEM is too short for ML-DSA-65.');
	}

	const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js');
	const secretKey = privateKeyDer.slice(privateKeyDer.length - ML_DSA_65_SECRET_KEY_LENGTH);
	const publicKey = ml_dsa65.getPublicKey(secretKey);
	const publicKeyDer = new Uint8Array(ML_DSA_65_PUBLIC_DER_PREFIX.length + publicKey.length);
	publicKeyDer.set(ML_DSA_65_PUBLIC_DER_PREFIX, 0);
	publicKeyDer.set(publicKey, ML_DSA_65_PUBLIC_DER_PREFIX.length);
	return encodeCompactBytes(publicKeyDer);
}

export async function generatePortableActorKeyPair(): Promise<{
	privateKey: string;
	publicKey: string;
	didKey: string;
}> {
	const { ml_dsa65 } = await import('@noble/post-quantum/ml-dsa.js');
	const keys = ml_dsa65.keygen();
	const publicKeyDer = new Uint8Array(ML_DSA_65_PUBLIC_DER_PREFIX.length + keys.publicKey.length);
	publicKeyDer.set(ML_DSA_65_PUBLIC_DER_PREFIX, 0);
	publicKeyDer.set(keys.publicKey, ML_DSA_65_PUBLIC_DER_PREFIX.length);
	const publicKey = encodeCompactBytes(publicKeyDer);
	const privateKey = encodeCompactBytes(keys.secretKey, PRIVATE_KEY_PREFIX);

	return {
		privateKey,
		publicKey,
		didKey: `did:key:${publicKey}`
	};
}

function normalizePublicKeySession(
	payload: PublicKeyAuthSuccess,
	publicKey: string
): PublicKeyAuthSuccess {
	const handle = payload.handle?.trim() || publicKey;
	const username = payload.username?.trim() || publicKey;
	const displayName = payload.displayName?.trim() || `@${publicKey.slice(0, 16)}`;
	const email =
		payload.email?.trim() || `portable+${publicKey.slice(0, 24)}@local.invalid`;

	return {
		...payload,
		handle,
		username,
		displayName,
		email,
		actorAddress: payload.actorAddress?.trim() || `did:key:${publicKey}`,
		publickey: {
			key: payload.publickey?.key?.trim() || publicKey,
			pem: payload.publickey?.pem?.trim() || ''
		}
	};
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
	return buildOrderProxyUrl(pathname, '/api');
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
	const publicKey =
		typeof privateKey === 'string' ? await derivePortablePublicKeyFromPrivateKey(privateKey) : '';

	const payload = await postJson<PublicKeyAuthSuccess>(buildCraterClientUrl('/auth'), {
		publickey: {
			key: publicKey
		}
	});

	return normalizePublicKeySession(payload, publicKey);
}

export async function loginWithPortablePublicKey(publicKey: string): Promise<PublicKeyAuthSuccess> {
	const payload = await postJson<PublicKeyAuthSuccess>(buildCraterClientUrl('/auth'), {
		publickey: {
			key: publicKey
		}
	});

	return normalizePublicKeySession(payload, publicKey);
}

export async function loginWithGeneratedPortableActor(): Promise<
	PublicKeyAuthSuccess & {
		privateKey: string;
		didKey: string;
	}
> {
	const generated = await generatePortableActorKeyPair();
	saveGeneratedPrivateKeyCookie(generated.privateKey);
	saveGeneratedPublicKeyCookie(generated.publicKey);
	const session = await loginWithPortablePublicKey(generated.publicKey);

	return {
		...session,
		privateKey: generated.privateKey,
		didKey: generated.didKey
	};
}

export async function restoreGeneratedPortableActor(): Promise<PublicKeyAuthSuccess | null> {
	const storedPrivateKey = loadGeneratedPrivateKeyCookie();
	const storedPublicKey = loadGeneratedPublicKeyCookie();
	const publicKey =
		storedPublicKey ||
		(storedPrivateKey ? await derivePortablePublicKeyFromPrivateKey(storedPrivateKey) : null);

	if (!publicKey) {
		return null;
	}

	if (!storedPublicKey) {
		saveGeneratedPublicKeyCookie(publicKey);
	}

	return loginWithPortablePublicKey(publicKey);
}
