// Passkey (WebAuthn) authentication backend
// Uses @simplewebauthn/browser for client-side operations

import {
	startRegistration as startWebAuthnRegistration,
	startAuthentication as startWebAuthnAuthentication
} from '@simplewebauthn/browser';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON,
	AuthenticationResponseJSON
} from '@simplewebauthn/types';
import { getConfig } from '../config.js';

// In-memory stores (for demo/prototype purposes)
interface UserRecord {
	id: string;
	username: string;
}

interface CredentialRecord {
	credentialId: string;
	userId: string;
	publicKey: string;
	counter: number;
}

interface SessionRecord {
	challenge: string;
}

const users = new Map<string, UserRecord>();
const credentials = new Map<string, CredentialRecord[]>();
const sessions = new Map<string, SessionRecord>();

function generateId(): string {
	return crypto.randomUUID();
}

// Registration

export async function startRegistration(username: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
	const config = getConfig();

	let userId = [...users.values()].find((u) => u.username === username)?.id;
	if (!userId) {
		userId = generateId();
		users.set(userId, { id: userId, username });
	}

	const userCredentials = credentials.get(userId) ?? [];

	const options: PublicKeyCredentialCreationOptionsJSON = {
		rp: {
			name: config.rpName,
			id: config.rpId
		},
		user: {
			id: userId,
			name: username,
			displayName: username
		},
		challenge: btoa(generateId()),
		pubKeyCredParams: [
			{ alg: -7, type: 'public-key' },
			{ alg: -257, type: 'public-key' }
		],
		timeout: 60000,
		attestation: 'none',
		excludeCredentials: userCredentials.map((c) => ({
			id: c.credentialId,
			type: 'public-key' as const
		})),
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred'
		}
	};

	sessions.set(userId, { challenge: options.challenge });
	return options;
}

export async function performRegistration(username: string): Promise<RegistrationResponseJSON> {
	const options = await startRegistration(username);
	return await startWebAuthnRegistration({ optionsJSON: options });
}

export async function finishRegistration(
	username: string,
	attResp: RegistrationResponseJSON
): Promise<{ verified: boolean }> {
	const userId = [...users.values()].find((u) => u.username === username)?.id;
	if (!userId) {
		return { verified: false };
	}

	const session = sessions.get(userId);
	if (!session) {
		return { verified: false };
	}

	// Store credential (in a real app, verify with @simplewebauthn/server)
	const credentialRecord: CredentialRecord = {
		credentialId: attResp.id,
		userId,
		publicKey: attResp.response.publicKey ?? '',
		counter: 0
	};

	const userCredentials = credentials.get(userId) ?? [];
	userCredentials.push(credentialRecord);
	credentials.set(userId, userCredentials);

	sessions.delete(userId);
	return { verified: true };
}

// Authentication

export async function startAuthentication(username?: string): Promise<PublicKeyCredentialRequestOptionsJSON> {
	const config = getConfig();

	let allowCredentials: { id: string; type: 'public-key' }[] = [];
	const sessionKey = username ?? 'anon';

	if (username) {
		const userId = [...users.values()].find((u) => u.username === username)?.id;
		if (userId) {
			const userCredentials = credentials.get(userId) ?? [];
			allowCredentials = userCredentials.map((c) => ({
				id: c.credentialId,
				type: 'public-key' as const
			}));
		}
	}

	const options: PublicKeyCredentialRequestOptionsJSON = {
		rpId: config.rpId,
		challenge: btoa(generateId()),
		timeout: 60000,
		userVerification: 'preferred',
		allowCredentials
	};

	sessions.set(sessionKey, { challenge: options.challenge });
	return options;
}

export async function performAuthentication(username?: string): Promise<AuthenticationResponseJSON> {
	const options = await startAuthentication(username);
	return await startWebAuthnAuthentication({ optionsJSON: options });
}

export async function finishAuthentication(
	authnResp: AuthenticationResponseJSON
): Promise<{ verified: boolean; userId?: string }> {
	// Find credential by rawId
	let foundCredential: CredentialRecord | undefined;
	let foundUserId: string | undefined;

	for (const [userId, userCredentials] of credentials.entries()) {
		const cred = userCredentials.find((c) => c.credentialId === authnResp.id);
		if (cred) {
			foundCredential = cred;
			foundUserId = userId;
			break;
		}
	}

	if (!foundCredential || !foundUserId) {
		return { verified: false };
	}

	// Update counter (in a real app, verify with @simplewebauthn/server)
	foundCredential.counter += 1;

	const sessionToken = generateId();
	sessions.set(sessionToken, { challenge: sessionToken });

	return { verified: true, userId: foundUserId };
}
