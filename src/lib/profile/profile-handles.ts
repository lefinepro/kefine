const ETHEREUM_HANDLE_PREFIX = 'ethereum';

function sanitizeUsernamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32);
}

export function normalizeProfileUsername(value: string): string {
  const normalized = sanitizeUsernamePart(value);
  return normalized || 'user';
}

export function buildProfilePath(username: string): string {
  return `/@${normalizeProfileUsername(username)}`;
}

export function deriveWalletProfileHandle(address: string, alias?: string | null): string {
  const normalizedAlias = sanitizeUsernamePart(alias || '');
  if (normalizedAlias) {
    return normalizeProfileUsername(`${ETHEREUM_HANDLE_PREFIX}-${normalizedAlias}`);
  }

  return normalizeProfileUsername(`${ETHEREUM_HANDLE_PREFIX}-${address.toLowerCase()}`);
}

export function deriveProfileUsername(args: {
  email?: string | null;
  displayName?: string | null;
  fallback?: string | null;
}): string {
  const emailSource = args.email?.split('@')[0];
  const preferred =
    sanitizeUsernamePart(emailSource || '') ||
    sanitizeUsernamePart(args.displayName || '') ||
    sanitizeUsernamePart(args.fallback || '');

  return preferred || `user-${Math.random().toString(36).slice(2, 7)}`;
}
