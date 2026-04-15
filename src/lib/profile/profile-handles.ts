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

function sanitizeProfileResourcePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^@+/, '')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 64);
}

export function normalizeProfileUsername(value: string): string {
  const normalized = sanitizeUsernamePart(value);
  return normalized || 'user';
}

export function buildProfilePath(username: string): string {
  return `/@${normalizeProfileUsername(username)}`;
}

export function buildProfileTaskPath(username: string, shareId: string): string {
  return `${buildProfilePath(username)}/${encodeURIComponent(shareId)}`;
}

export function normalizeProfileResourceSlug(value: string): string {
  return sanitizeProfileResourcePart(value);
}

export function buildProfileServicePath(username: string, slug: string): string {
  return `${buildProfilePath(username)}/${encodeURIComponent(slug.trim())}`;
}

export function isDefaultActorHandle(username: string, defaultActorHandle?: string | null): boolean {
  const normalizedUsername = normalizeProfileUsername(username);
  const normalizedDefaultActorHandle = normalizeProfileUsername(defaultActorHandle || 'api');
  return normalizedUsername === normalizedDefaultActorHandle;
}

export function buildCanonicalServicePath(username: string, slug: string, defaultActorHandle?: string | null): string {
  const normalizedSlug = slug.trim();
  if (isDefaultActorHandle(username, defaultActorHandle)) {
    return `/services/${encodeURIComponent(normalizedSlug)}`;
  }

  return buildProfileServicePath(username, normalizedSlug);
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
  const portableEmailSource =
    emailSource?.startsWith('portable+') || emailSource?.startsWith('portable-')
      ? emailSource.slice('portable+'.length)
      : emailSource;
  const preferred =
    sanitizeUsernamePart(portableEmailSource || '') ||
    sanitizeUsernamePart(args.displayName || '') ||
    sanitizeUsernamePart(args.fallback || '');

  return preferred || `user-${Math.random().toString(36).slice(2, 7)}`;
}
