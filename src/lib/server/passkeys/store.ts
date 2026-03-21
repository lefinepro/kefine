import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
	generateAuthenticationOptions,
	generateRegistrationOptions,
	verifyAuthenticationResponse,
	verifyRegistrationResponse
} from '@simplewebauthn/server';
import type {
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture,
	PublicKeyCredentialCreationOptionsJSON,
	PublicKeyCredentialRequestOptionsJSON,
	RegistrationResponseJSON
} from '@simplewebauthn/types';

interface StoredCredential {
	id: string;
	publicKey: string;
	counter: number;
	transports: AuthenticatorTransportFuture[];
	deviceType: 'singleDevice' | 'multiDevice';
	backedUp: boolean;
}

interface StoredUser {
	id: string;
	username: string;
	credentials: StoredCredential[];
	createdAt: string;
}

interface PendingChallenge {
	id: string;
	kind: 'registration' | 'authentication';
	username?: string;
	challenge: string;
	expiresAt: string;
}

interface StoredSession {
	token: string;
	userId: string;
	username: string;
	expiresAt: string;
	createdAt: string;
}

interface PasskeyState {
	users: StoredUser[];
	challenges: PendingChallenge[];
	sessions: StoredSession[];
}

export interface PasskeySession {
	token: string;
	userId: string;
	username: string;
	expiresAt: string;
}

const PASSKEY_STORE_PATH =
	process.env.PASSKEY_STORE_PATH ?? path.join(process.cwd(), '.data', 'passkeys.json');
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
type ServerCredentialPublicKey = Parameters<typeof verifyAuthenticationResponse>[0]['credential']['publicKey'];

function createEmptyState(): PasskeyState {
	return {
		users: [],
		challenges: [],
		sessions: []
	};
}

async function ensureStoreFile(): Promise<void> {
	await mkdir(path.dirname(PASSKEY_STORE_PATH), { recursive: true });

	try {
		await readFile(PASSKEY_STORE_PATH, 'utf8');
	} catch {
		await writeFile(PASSKEY_STORE_PATH, JSON.stringify(createEmptyState(), null, 2), 'utf8');
	}
}

function pruneState(state: PasskeyState): PasskeyState {
	const now = Date.now();

	return {
		users: state.users,
		challenges: state.challenges.filter((challenge) => new Date(challenge.expiresAt).getTime() > now),
		sessions: state.sessions.filter((session) => new Date(session.expiresAt).getTime() > now)
	};
}

async function readState(): Promise<PasskeyState> {
	await ensureStoreFile();

	const raw = await readFile(PASSKEY_STORE_PATH, 'utf8');
	const parsed = JSON.parse(raw) as PasskeyState;
	const pruned = pruneState(parsed);

	if (JSON.stringify(parsed) !== JSON.stringify(pruned)) {
		await writeState(pruned);
	}

	return pruned;
}

async function writeState(state: PasskeyState): Promise<void> {
	await ensureStoreFile();
	await writeFile(PASSKEY_STORE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

function normalizeUsername(username: string): string {
	return username.trim();
}

function findUserByUsername(state: PasskeyState, username: string): StoredUser | undefined {
	const normalized = normalizeUsername(username).toLowerCase();
	return state.users.find((user) => user.username.toLowerCase() === normalized);
}

function findUserByCredentialId(
	state: PasskeyState,
	credentialId: string
): { user: StoredUser; credential: StoredCredential } | null {
	for (const user of state.users) {
		const credential = user.credentials.find((item) => item.id === credentialId);
		if (credential) {
			return { user, credential };
		}
	}

	return null;
}

function encodeBase64Url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64url');
}

function decodeBase64Url(value: string): ServerCredentialPublicKey {
	const buffer = Buffer.from(value, 'base64url');
	const arrayBuffer = buffer.buffer.slice(
		buffer.byteOffset,
		buffer.byteOffset + buffer.byteLength
	) as ArrayBuffer;

	return new Uint8Array(arrayBuffer) as ServerCredentialPublicKey;
}

function getOrCreateUser(state: PasskeyState, username: string): StoredUser {
	const normalized = normalizeUsername(username);
	const existing = findUserByUsername(state, normalized);
	if (existing) return existing;

	const created: StoredUser = {
		id: crypto.randomUUID(),
		username: normalized,
		credentials: [],
		createdAt: new Date().toISOString()
	};

	state.users.push(created);
	return created;
}

function createPendingChallenge(
	state: PasskeyState,
	kind: PendingChallenge['kind'],
	challenge: string,
	username?: string
): PendingChallenge {
	const pending: PendingChallenge = {
		id: crypto.randomUUID(),
		kind,
		username,
		challenge,
		expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString()
	};

	state.challenges = state.challenges.filter(
		(item) => !(item.kind === kind && item.username === username)
	);
	state.challenges.push(pending);
	return pending;
}

function createSession(state: PasskeyState, user: StoredUser): PasskeySession {
	const session: StoredSession = {
		token: crypto.randomUUID(),
		userId: user.id,
		username: user.username,
		createdAt: new Date().toISOString(),
		expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString()
	};

	state.sessions = state.sessions.filter((item) => item.userId !== user.id);
	state.sessions.push(session);

	return {
		token: session.token,
		userId: session.userId,
		username: session.username,
		expiresAt: session.expiresAt
	};
}

export async function beginPasskeyRegistration(input: {
	username: string;
	rpName: string;
	rpID: string;
}): Promise<{ options: PublicKeyCredentialCreationOptionsJSON; transactionId: string }> {
	const username = normalizeUsername(input.username);
	if (!username) {
		throw new Error('Username is required to create a passkey.');
	}

	const state = await readState();
	const user = getOrCreateUser(state, username);

	const options = await generateRegistrationOptions({
		rpName: input.rpName,
		rpID: input.rpID,
		userName: user.username,
		userID: new TextEncoder().encode(user.id),
		userDisplayName: user.username,
		attestationType: 'none',
		authenticatorSelection: {
			residentKey: 'required',
			userVerification: 'preferred'
		},
		excludeCredentials: user.credentials.map((credential) => ({
			id: credential.id,
			transports: credential.transports
		}))
	});

	const challenge = createPendingChallenge(state, 'registration', options.challenge, user.username);
	await writeState(state);

	return { options, transactionId: challenge.id };
}

export async function completePasskeyRegistration(input: {
	username: string;
	response: RegistrationResponseJSON;
	expectedOrigin: string;
	expectedRPID: string;
	transactionId: string;
}): Promise<PasskeySession> {
	const state = await readState();
	const username = normalizeUsername(input.username);
	const user = findUserByUsername(state, username);
	if (!user) {
		throw new Error('Passkey user not found.');
	}

	const pending = state.challenges.find(
		(item) =>
			item.id === input.transactionId &&
			item.kind === 'registration' &&
			item.username?.toLowerCase() === username.toLowerCase()
	);
	if (!pending) {
		throw new Error('Passkey registration challenge has expired.');
	}

	const verification = await verifyRegistrationResponse({
		response: input.response,
		expectedChallenge: pending.challenge,
		expectedOrigin: input.expectedOrigin,
		expectedRPID: input.expectedRPID
	});

	if (!verification.verified || !verification.registrationInfo) {
		throw new Error('Passkey registration could not be verified.');
	}

	const { credential, credentialBackedUp, credentialDeviceType } = verification.registrationInfo;
	const nextCredential: StoredCredential = {
		id: credential.id,
		publicKey: encodeBase64Url(credential.publicKey),
		counter: credential.counter,
		transports: input.response.response.transports ?? [],
		deviceType: credentialDeviceType,
		backedUp: credentialBackedUp
	};

	user.credentials = user.credentials.filter((item) => item.id !== nextCredential.id);
	user.credentials.push(nextCredential);
	state.challenges = state.challenges.filter((item) => item.id !== pending.id);

	const session = createSession(state, user);
	await writeState(state);
	return session;
}

export async function beginPasskeyAuthentication(input: {
	username?: string;
	rpID: string;
}): Promise<{ options: PublicKeyCredentialRequestOptionsJSON; transactionId: string }> {
	const state = await readState();
	const username = input.username ? normalizeUsername(input.username) : undefined;
	const user = username ? findUserByUsername(state, username) : undefined;

	if (username && !user) {
		throw new Error('No passkey profile exists for this username.');
	}

	const options = await generateAuthenticationOptions({
		rpID: input.rpID,
		userVerification: 'preferred',
		allowCredentials:
			user && user.credentials.length > 0
				? user.credentials.map((credential) => ({
						id: credential.id,
						transports: credential.transports
					}))
				: undefined
	});

	const challenge = createPendingChallenge(state, 'authentication', options.challenge, user?.username);
	await writeState(state);

	return { options, transactionId: challenge.id };
}

export async function completePasskeyAuthentication(input: {
	response: AuthenticationResponseJSON;
	expectedOrigin: string;
	expectedRPID: string;
	transactionId: string;
}): Promise<PasskeySession> {
	const state = await readState();
	const pending = state.challenges.find(
		(item) => item.id === input.transactionId && item.kind === 'authentication'
	);
	if (!pending) {
		throw new Error('Passkey login challenge has expired.');
	}

	const match = findUserByCredentialId(state, input.response.id);
	if (!match) {
		throw new Error('No matching passkey credential was found.');
	}

	const verification = await verifyAuthenticationResponse({
		response: input.response,
		expectedChallenge: pending.challenge,
		expectedOrigin: input.expectedOrigin,
		expectedRPID: input.expectedRPID,
		credential: {
			id: match.credential.id,
			publicKey: decodeBase64Url(match.credential.publicKey),
			counter: match.credential.counter,
			transports: match.credential.transports
		}
	});

	if (!verification.verified) {
		throw new Error('Passkey login could not be verified.');
	}

	match.credential.counter = verification.authenticationInfo.newCounter;
	match.credential.deviceType = verification.authenticationInfo.credentialDeviceType;
	match.credential.backedUp = verification.authenticationInfo.credentialBackedUp;
	state.challenges = state.challenges.filter((item) => item.id !== pending.id);

	const session = createSession(state, match.user);
	await writeState(state);
	return session;
}
