import type { KefineLocale } from '$lib/constants/kefine-locale';

export const DEFAULT_KEFINE_LOCALE: KefineLocale = 'en';

export function isKefineLocale(value: string | null | undefined): value is KefineLocale {
  return value === 'en' || value === 'ru' || value === 'hy';
}

export function readLocaleFromPathname(pathname: string): KefineLocale | null {
  const normalized = pathname.trim() || '/';
  const firstSegment = normalized.replace(/^\/+/, '').split('/')[0] ?? '';
  return isKefineLocale(firstSegment) ? firstSegment : null;
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = pathname.trim() || '/';
  const locale = readLocaleFromPathname(normalized);
  if (!locale || locale === DEFAULT_KEFINE_LOCALE) {
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  const stripped = normalized.replace(new RegExp(`^/${locale}(?=/|$)`), '');
  return stripped || '/';
}

function splitHref(target: string): { pathname: string; search: string; hash: string } {
  const hashIndex = target.indexOf('#');
  const searchIndex = target.indexOf('?');
  const pathEnd =
    hashIndex === -1
      ? searchIndex === -1
        ? target.length
        : searchIndex
      : searchIndex === -1
        ? hashIndex
        : Math.min(hashIndex, searchIndex);

  const pathname = target.slice(0, pathEnd) || '/';
  const suffix = target.slice(pathEnd);
  const search = suffix.startsWith('?') ? suffix.slice(0, hashIndex === -1 ? suffix.length : suffix.indexOf('#')) : '';
  const hash = suffix.includes('#') ? suffix.slice(suffix.indexOf('#')) : '';

  return { pathname, search, hash };
}

export function buildLocaleHomePath(locale: KefineLocale): string {
  return locale === DEFAULT_KEFINE_LOCALE ? '/' : `/${locale}`;
}

export function localizeAppPath(target: string, locale: KefineLocale): string {
  if (!target || target.startsWith('#')) {
    return target || buildLocaleHomePath(locale);
  }

  if (/^(?:[a-z]+:)?\/\//i.test(target) || /^[a-z]+:/i.test(target)) {
    return target;
  }

  const { pathname, search, hash } = splitHref(target);
  const normalizedPath = stripLocalePrefix(pathname.startsWith('/') ? pathname : `/${pathname}`);
  const prefix = locale === DEFAULT_KEFINE_LOCALE ? '' : `/${locale}`;
  const localizedPath = `${prefix}${normalizedPath === '/' ? '' : normalizedPath}` || '/';

  return `${localizedPath}${search}${hash}`;
}
