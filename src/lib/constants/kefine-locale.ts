import { writable } from 'svelte/store';
import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';

const LOCALE_STORAGE_KEY = 'kefine-locale';

export type KefineLocale = 'en' | 'ru';

export const KEFINE_LOCALE_TEXT = {
  en: KEFINE_TEXT_EN,
  ru: KEFINE_TEXT_RU
} as const;

export type KefineLocaleText = (typeof KEFINE_LOCALE_TEXT)[keyof typeof KEFINE_LOCALE_TEXT];

export function readLocaleFromStorage(): KefineLocale | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  if (savedLocale === 'ru' || savedLocale === 'en') {
    return savedLocale;
  }

  return undefined;
}

export const kefineLocale = writable<KefineLocale>(readLocaleFromStorage() ?? 'en');

export function setKefineLocale(locale: KefineLocale): void {
  kefineLocale.set(locale);
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // localStorage unavailable
  }
}

export function getLocaleText(locale: KefineLocale) {
  return KEFINE_LOCALE_TEXT[locale];
}
