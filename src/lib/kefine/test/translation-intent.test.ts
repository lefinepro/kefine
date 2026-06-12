import { describe, expect, it } from 'vitest';
import {
  DEFAULT_TRANSLATION_LANGUAGES,
  detectTranslationIntent,
  extractTranslationLanguages
} from '../widgets/translation-intent';

describe('detectTranslationIntent', () => {
  it('matches the generic translation prompts from the issue', () => {
    expect(detectTranslationIntent('Translate')).toBe(true);
    expect(detectTranslationIntent('Перевод')).toBe(true);
  });

  it('matches language-pair translation prompts', () => {
    expect(detectTranslationIntent('Translation from Chinese to English')).toBe(true);
    expect(detectTranslationIntent('Перевод с китайского на английский')).toBe(true);
  });

  it('does not trigger on unrelated words or substrings', () => {
    expect(detectTranslationIntent('build a dark widget')).toBe(false);
    expect(detectTranslationIntent('transport price estimate')).toBe(false);
    expect(detectTranslationIntent('')).toBe(false);
    expect(detectTranslationIntent(null)).toBe(false);
  });
});

describe('extractTranslationLanguages', () => {
  it('returns the default pair for generic translation prompts', () => {
    expect(extractTranslationLanguages('Перевод')).toEqual(DEFAULT_TRANSLATION_LANGUAGES);
  });

  it('extracts an English language pair', () => {
    expect(extractTranslationLanguages('Translation from Chinese to English')).toEqual({
      source: 'chinese',
      target: 'english'
    });
  });

  it('extracts a Russian language pair with grammatical forms', () => {
    expect(extractTranslationLanguages('Перевод с китайского на английский')).toEqual({
      source: 'chinese',
      target: 'english'
    });
  });

  it('extracts target-only prompts while keeping a useful source default', () => {
    expect(extractTranslationLanguages('translate to Spanish')).toEqual({
      source: DEFAULT_TRANSLATION_LANGUAGES.source,
      target: 'spanish'
    });
  });
});
