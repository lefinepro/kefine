const GENERATED_PRIVATE_KEY_COOKIE = 'kefine_generated_private_key';
const GENERATED_PUBLIC_KEY_COOKIE = 'kefine_generated_public_key';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

function readCookieValue(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const prefix = `${name}=`;
  const entry = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!entry) {
    return null;
  }

  const value = entry.slice(prefix.length);
  if (!value) {
    return null;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function writeCookieValue(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookieValue(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function saveGeneratedPublicKeyCookie(publicKey: string): void {
  writeCookieValue(GENERATED_PUBLIC_KEY_COOKIE, publicKey, ONE_YEAR_SECONDS);
}

export function saveGeneratedPrivateKeyCookie(privateKey: string): void {
  writeCookieValue(GENERATED_PRIVATE_KEY_COOKIE, privateKey, ONE_YEAR_SECONDS);
}

export function loadGeneratedPublicKeyCookie(): string | null {
  return readCookieValue(GENERATED_PUBLIC_KEY_COOKIE);
}

export function loadGeneratedPrivateKeyCookie(): string | null {
  return readCookieValue(GENERATED_PRIVATE_KEY_COOKIE);
}

export function clearGeneratedActorCookies(): void {
  clearCookieValue(GENERATED_PRIVATE_KEY_COOKIE);
  clearCookieValue(GENERATED_PUBLIC_KEY_COOKIE);
}
