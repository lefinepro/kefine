/**
 * Lightweight detector and language-pair parser for translator prompts. It is
 * deliberately local and cheap so the composer can reveal the widget while the
 * user is still typing.
 */

export const TRANSLATION_LANGUAGE_IDS = [
  'auto',
  'english',
  'russian',
  'chinese',
  'spanish',
  'french',
  'german',
  'armenian',
  'japanese',
  'korean',
  'italian',
  'portuguese',
  'arabic',
  'turkish',
  'ukrainian',
  'belarusian'
] as const;

export type TranslationLanguageId = (typeof TRANSLATION_LANGUAGE_IDS)[number];

export interface TranslationLanguagePair {
  source: TranslationLanguageId;
  target: TranslationLanguageId;
}

export const DEFAULT_TRANSLATION_LANGUAGES: TranslationLanguagePair = {
  source: 'english',
  target: 'russian'
};

const TRIGGER_WORDS: readonly string[] = [
  'translate',
  'translation',
  'translator',
  'перевод',
  'переведи',
  'перевести',
  'переводчик',
  'թարգմանել',
  'թարգմանություն',
  'թարգմանիչ'
];

const LANGUAGE_ALIASES: Record<TranslationLanguageId, readonly string[]> = {
  auto: ['auto', 'detect language', 'auto detect', 'авто', 'автоопределение', 'определить', 'ինքնորոշում'],
  english: ['english', 'en', 'английский', 'английского', 'английском', 'английски', 'англ', 'անգլերեն'],
  russian: ['russian', 'ru', 'русский', 'русского', 'русском', 'русски', 'рус', 'ռուսերեն'],
  chinese: [
    'chinese',
    'mandarin',
    'zh',
    'китайский',
    'китайского',
    'китайском',
    'китайски',
    'кит',
    'չինարեն'
  ],
  spanish: ['spanish', 'espanol', 'español', 'es', 'испанский', 'испанского', 'испанском', 'испански', 'իսպաներեն'],
  french: ['french', 'fr', 'французский', 'французского', 'французском', 'французски', 'ֆրանսերեն'],
  german: ['german', 'de', 'немецкий', 'немецкого', 'немецком', 'немецки', 'գերմաներեն'],
  armenian: ['armenian', 'hy', 'армянский', 'армянского', 'армянском', 'армянски', 'հայերեն'],
  japanese: ['japanese', 'ja', 'японский', 'японского', 'японском', 'японски', 'ճապոներեն'],
  korean: ['korean', 'ko', 'корейский', 'корейского', 'корейском', 'корейски', 'կորեերեն'],
  italian: ['italian', 'it', 'итальянский', 'итальянского', 'итальянском', 'итальянски', 'իտալերեն'],
  portuguese: [
    'portuguese',
    'pt',
    'португальский',
    'португальского',
    'португальском',
    'португальски',
    'պորտուգալերեն'
  ],
  arabic: ['arabic', 'ar', 'арабский', 'арабского', 'арабском', 'арабски', 'արաբերեն'],
  turkish: ['turkish', 'tr', 'турецкий', 'турецкого', 'турецком', 'турецки', 'թուրքերեն'],
  ukrainian: ['ukrainian', 'uk', 'украинский', 'украинского', 'украинском', 'украински', 'ուկրաիներեն'],
  belarusian: ['belarusian', 'be', 'белорусский', 'белорусского', 'белорусском', 'белорусски', 'բելառուսերեն']
};

function normalizeForMatching(value: string): string {
  return value
    .toLocaleLowerCase()
    .normalize('NFC')
    .replace(/ё/g, 'е')
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ALIAS_TO_LANGUAGE = new Map<string, TranslationLanguageId>();

for (const id of TRANSLATION_LANGUAGE_IDS) {
  for (const alias of LANGUAGE_ALIASES[id]) {
    ALIAS_TO_LANGUAGE.set(normalizeForMatching(alias), id);
  }
}

const LANGUAGE_ALIAS_PATTERN = Array.from(ALIAS_TO_LANGUAGE.keys())
  .sort((a, b) => b.length - a.length)
  .map(escapeForRegExp)
  .join('|');

const WORD_BEFORE = '(?:^|[^\\p{L}\\p{N}])';
const WORD_AFTER = '(?=$|[^\\p{L}\\p{N}])';

const SOURCE_TARGET_PATTERNS: readonly RegExp[] = [
  new RegExp(
    `${WORD_BEFORE}(?:from|from the|с|со|из)\\s+(?<source>${LANGUAGE_ALIAS_PATTERN})\\s+(?:to|into|на|в|դեպի)\\s+(?<target>${LANGUAGE_ALIAS_PATTERN})${WORD_AFTER}`,
    'iu'
  ),
  new RegExp(
    `${WORD_BEFORE}(?<source>${LANGUAGE_ALIAS_PATTERN})\\s+(?:to|into|на|в|դեպի)\\s+(?<target>${LANGUAGE_ALIAS_PATTERN})${WORD_AFTER}`,
    'iu'
  )
];

const TARGET_PATTERNS: readonly RegExp[] = [
  new RegExp(`${WORD_BEFORE}(?:to|into|на|в|դեպի)\\s+(?<target>${LANGUAGE_ALIAS_PATTERN})${WORD_AFTER}`, 'iu')
];

function containsWord(haystack: string, word: string): boolean {
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeForRegExp(word)}(?:$|[^\\p{L}\\p{N}])`, 'iu');
  return pattern.test(haystack);
}

function resolveLanguageId(value: string | undefined): TranslationLanguageId | null {
  if (!value) return null;
  return ALIAS_TO_LANGUAGE.get(normalizeForMatching(value)) ?? null;
}

function parseLanguagePair(text: string): TranslationLanguagePair | null {
  for (const pattern of SOURCE_TARGET_PATTERNS) {
    const match = pattern.exec(text);
    const source = resolveLanguageId(match?.groups?.source);
    const target = resolveLanguageId(match?.groups?.target);
    if (source && target) {
      return { source, target };
    }
  }

  for (const pattern of TARGET_PATTERNS) {
    const match = pattern.exec(text);
    const target = resolveLanguageId(match?.groups?.target);
    if (target) {
      return { source: DEFAULT_TRANSLATION_LANGUAGES.source, target };
    }
  }

  return null;
}

export function detectTranslationIntent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const normalized = normalizeForMatching(text);
  if (normalized.length < 3) {
    return false;
  }

  const padded = ` ${normalized} `;
  if (TRIGGER_WORDS.some((word) => containsWord(padded, normalizeForMatching(word)))) {
    return true;
  }

  return parseLanguagePair(normalized) !== null;
}

export function extractTranslationLanguages(text: string | null | undefined): TranslationLanguagePair {
  if (!text) {
    return DEFAULT_TRANSLATION_LANGUAGES;
  }

  return parseLanguagePair(normalizeForMatching(text)) ?? DEFAULT_TRANSLATION_LANGUAGES;
}
