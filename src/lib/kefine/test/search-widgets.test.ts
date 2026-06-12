import { describe, expect, it } from 'vitest';
import {
  KEFINE_SEARCH_WIDGET_IDS,
  isSearchWidgetSlug,
  normalizeSearchWidgetId
} from '../search-widgets';

describe('normalizeSearchWidgetId', () => {
  it('maps canonical slugs to their widget id', () => {
    expect(normalizeSearchWidgetId('weather')).toBe('weather');
    expect(normalizeSearchWidgetId('clock')).toBe('clock');
    expect(normalizeSearchWidgetId('translate')).toBe('translate');
    expect(normalizeSearchWidgetId('music')).toBe('music');
    expect(normalizeSearchWidgetId('proxy')).toBe('proxy');
  });

  it('accepts human-friendly aliases', () => {
    expect(normalizeSearchWidgetId('forecast')).toBe('weather');
    expect(normalizeSearchWidgetId('time')).toBe('clock');
    expect(normalizeSearchWidgetId('translator')).toBe('translate');
    expect(normalizeSearchWidgetId('translation')).toBe('translate');
    expect(normalizeSearchWidgetId('track')).toBe('music');
    expect(normalizeSearchWidgetId('vpn')).toBe('proxy');
  });

  it('is case-insensitive and trims whitespace', () => {
    expect(normalizeSearchWidgetId('  Weather ')).toBe('weather');
    expect(normalizeSearchWidgetId('TRANSLATOR')).toBe('translate');
  });

  it('returns null for unknown or empty slugs', () => {
    expect(normalizeSearchWidgetId('orders')).toBeNull();
    expect(normalizeSearchWidgetId('')).toBeNull();
    expect(normalizeSearchWidgetId(null)).toBeNull();
    expect(normalizeSearchWidgetId(undefined)).toBeNull();
  });

  it('covers every canonical widget id', () => {
    for (const id of KEFINE_SEARCH_WIDGET_IDS) {
      expect(normalizeSearchWidgetId(id)).toBe(id);
    }
  });
});

describe('isSearchWidgetSlug', () => {
  it('is true for known widget slugs and aliases', () => {
    expect(isSearchWidgetSlug('weather')).toBe(true);
    expect(isSearchWidgetSlug('forecast')).toBe(true);
    expect(isSearchWidgetSlug('clock')).toBe(true);
    expect(isSearchWidgetSlug('time')).toBe(true);
    expect(isSearchWidgetSlug('translator')).toBe(true);
    expect(isSearchWidgetSlug('music')).toBe(true);
    expect(isSearchWidgetSlug('proxy')).toBe(true);
    expect(isSearchWidgetSlug('vpn')).toBe(true);
  });

  it('is false for anything else', () => {
    expect(isSearchWidgetSlug('weatherly')).toBe(false);
    expect(isSearchWidgetSlug('order-123')).toBe(false);
    expect(isSearchWidgetSlug('')).toBe(false);
  });
});
