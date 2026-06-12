/**
 * Lightweight detector that decides whether a free-form task draft is asking to
 * extract music / audio out of a video. The music widget reacts to this *while
 * the user is still typing* (no submit required), so the matcher is intentionally
 * cheap and forgiving across English, Russian and Armenian phrasing.
 *
 * Mirrors the shape of `proxy-intent.ts`: whole-word, Unicode-aware matching that
 * avoids false positives on substrings.
 */

/** An audio word on its own only counts when paired with a media/extract word. */
const AUDIO_WORDS: readonly string[] = [
  'music',
  'audio',
  'sound',
  'soundtrack',
  'song',
  'mp3',
  'музыку',
  'музыка',
  'музыки',
  'звук',
  'звука',
  'аудио',
  'песню',
  'песня',
  'երաժշտություն',
  'երաժշտությունը',
  'ձայն',
  'ձայնը',
  'աուդիո'
];

/** Media sources we expect the audio to be pulled out of. */
const MEDIA_WORDS: readonly string[] = [
  'video',
  'movie',
  'clip',
  'film',
  'видео',
  'ролик',
  'ролика',
  'фильма',
  'клипа',
  'видеоролика',
  'տեսանյութ',
  'տեսանյութից',
  'վիդեո',
  'վիդեոյից'
];

/** Verbs that signal "separate / pull out", strengthening the audio intent. */
const EXTRACT_WORDS: readonly string[] = [
  'extract',
  'separate',
  'rip',
  'isolate',
  'split',
  'pull',
  'convert',
  'извлечь',
  'извлеки',
  'извлечение',
  'вытащить',
  'отделить',
  'выделить',
  'разделить',
  'առանձնացնել',
  'հանել',
  'առանձնացրու'
];

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Whole-word test that works for Latin and Cyrillic/Armenian scripts. `\b` in
 * JavaScript is ASCII-only, so we assert non-letter boundaries manually.
 */
function containsWord(haystack: string, word: string): boolean {
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeForRegExp(word)}(?:$|[^\\p{L}\\p{N}])`, 'iu');
  return pattern.test(haystack);
}

export function detectMusicExtractIntent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const normalized = ` ${text.toLowerCase().trim()} `;
  if (normalized.trim().length < 3) {
    return false;
  }

  const mentionsAudio = AUDIO_WORDS.some((word) => containsWord(normalized, word));
  if (!mentionsAudio) {
    return false;
  }

  // Audio + (a media source OR an extraction verb) reads as "get the audio out".
  const mentionsMedia = MEDIA_WORDS.some((word) => containsWord(normalized, word));
  const mentionsExtract = EXTRACT_WORDS.some((word) => containsWord(normalized, word));
  return mentionsMedia || mentionsExtract;
}
