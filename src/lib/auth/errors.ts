export type AuthErrorKind =
	| 'ConnectionError'
	| 'AuthenticationError'
	| 'NetworkError'
	| 'SessionExpiredError';

export interface AuthError {
	kind: AuthErrorKind;
	message: string;
}

export function makeAuthError(kind: AuthErrorKind, message: string): AuthError {
	return { kind, message };
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorKind, string> = {
	ConnectionError: 'Failed to connect wallet. Please try again.',
	AuthenticationError: 'Authentication failed. Please check your credentials.',
	NetworkError: 'Network error occurred. Please check your connection.',
	SessionExpiredError: 'Your session has expired. Please reconnect.'
};
