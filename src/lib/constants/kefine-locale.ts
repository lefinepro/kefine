import { writable } from 'svelte/store';
import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
import { readLocaleFromPathname } from '$lib/routing/kefine-locale-routing';

const LOCALE_STORAGE_KEY = 'kefine-locale';

export type KefineLocale = 'en' | 'ru' | 'hy';
export type KefineLocaleText = Omit<typeof KEFINE_TEXT_EN, 'meta'> & {
  meta: {
    locale: KefineLocale;
  };
};

const localeCache: Partial<Record<KefineLocale, KefineLocaleText>> = {
  en: KEFINE_TEXT_EN as KefineLocaleText
};

export function readLocaleFromStorage(): KefineLocale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale === 'ru' || savedLocale === 'en' || savedLocale === 'hy') {
    return savedLocale;
  }

  return undefined;
}

export const kefineLocale = writable<KefineLocale>('en');
export const kefineLocaleText = writable<KefineLocaleText>(KEFINE_TEXT_EN as KefineLocaleText);

async function loadLocaleText(locale: KefineLocale): Promise<KefineLocaleText> {
  const cached = localeCache[locale];
  if (cached) {
    return cached;
  }

  if (locale === 'ru') {
    const { KEFINE_TEXT_RU } = await import('$lib/constants/kefine-locale-ru');
    localeCache.ru = KEFINE_TEXT_RU as unknown as KefineLocaleText;
    return KEFINE_TEXT_RU as unknown as KefineLocaleText;
  }

  if (locale === 'hy') {
    const { KEFINE_TEXT_HY } = await import('$lib/constants/kefine-locale-hy');
    localeCache.hy = KEFINE_TEXT_HY as unknown as KefineLocaleText;
    return KEFINE_TEXT_HY as unknown as KefineLocaleText;
  }

  return KEFINE_TEXT_EN as KefineLocaleText;
}

async function applyLocale(locale: KefineLocale): Promise<void> {
  const nextText = await loadLocaleText(locale);
  kefineLocale.set(locale);
  kefineLocaleText.set(nextText);
}

export function setKefineLocale(locale: KefineLocale): void {
  if (typeof window === 'undefined') {
    kefineLocale.set(locale);
    kefineLocaleText.set(KEFINE_TEXT_EN as KefineLocaleText);
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }

  if (locale === 'en') {
    kefineLocale.set('en');
    kefineLocaleText.set(KEFINE_TEXT_EN as KefineLocaleText);
    return;
  }

  void applyLocale(locale);
}

export function getLocaleText(locale: KefineLocale): KefineLocaleText {
  return localeCache[locale] ?? (KEFINE_TEXT_EN as KefineLocaleText);
}

if (typeof window !== 'undefined') {
  const initialLocale = readLocaleFromPathname(window.location.pathname) ?? readLocaleFromStorage() ?? 'en';
  if (initialLocale === 'en') {
    kefineLocale.set('en');
    kefineLocaleText.set(KEFINE_TEXT_EN as KefineLocaleText);
  } else {
    void applyLocale(initialLocale);
  }
}
