import { describe, expect, test } from 'vitest';
import { localizeKefineOrderStatus } from './kefine-order-formatters';
import { KEFINE_TEXT_EN } from '$lib/constants/kefine-locale-en';
import { KEFINE_TEXT_RU } from '$lib/constants/kefine-locale-ru';
import { KEFINE_TEXT_HY } from '$lib/constants/kefine-locale-hy';

describe('localizeKefineOrderStatus', () => {
  test('uses the localized label for a known status', () => {
    expect(localizeKefineOrderStatus('queued', KEFINE_TEXT_HY.orderStatus)).toBe('Հերթում');
    expect(localizeKefineOrderStatus('queued', KEFINE_TEXT_RU.orderStatus)).toBe('В очереди');
    expect(localizeKefineOrderStatus('queued', KEFINE_TEXT_EN.orderStatus)).toBe('Queued');
  });

  test('normalizes casing and whitespace before lookup', () => {
    expect(localizeKefineOrderStatus('  COMPLETED  ', KEFINE_TEXT_HY.orderStatus)).toBe('Ավարտված');
  });

  test('falls back to an empty status as queued', () => {
    expect(localizeKefineOrderStatus('', KEFINE_TEXT_HY.orderStatus)).toBe('Հերթում');
  });

  test('capitalizes unknown statuses when no label exists', () => {
    expect(localizeKefineOrderStatus('mystery', KEFINE_TEXT_EN.orderStatus)).toBe('Mystery');
  });
});

describe('locale parity for translated sections', () => {
  const sections = ['orderStatus', 'solutionTask'] as const;

  for (const section of sections) {
    test(`ru "${section}" covers every English key`, () => {
      const enKeys = Object.keys(KEFINE_TEXT_EN[section]);
      const ruKeys = Object.keys((KEFINE_TEXT_RU as Record<string, Record<string, unknown>>)[section]);
      expect(ruKeys).toEqual(expect.arrayContaining(enKeys));
    });

    test(`hy "${section}" covers every English key`, () => {
      const enKeys = Object.keys(KEFINE_TEXT_EN[section]);
      const hyKeys = Object.keys((KEFINE_TEXT_HY as Record<string, Record<string, unknown>>)[section]);
      expect(hyKeys).toEqual(expect.arrayContaining(enKeys));
    });
  }
});
