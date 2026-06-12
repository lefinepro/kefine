import { describe, expect, it } from 'vitest';
import { detectMusicExtractIntent } from '../music-intent';

describe('detectMusicExtractIntent', () => {
  it('matches the Russian reference phrasing from the issue', () => {
    expect(detectMusicExtractIntent('Извлечь музыку из видео')).toBe(true);
    expect(detectMusicExtractIntent('извлеки аудио из ролика')).toBe(true);
    expect(detectMusicExtractIntent('вытащить звук из видео')).toBe(true);
  });

  it('matches English extract-audio phrasing', () => {
    expect(detectMusicExtractIntent('extract music from video')).toBe(true);
    expect(detectMusicExtractIntent('separate the audio from this movie')).toBe(true);
    expect(detectMusicExtractIntent('rip the soundtrack from a clip')).toBe(true);
    expect(detectMusicExtractIntent('get the audio out of this video')).toBe(true);
  });

  it('matches Armenian extract-audio phrasing', () => {
    expect(detectMusicExtractIntent('առանձնացնել երաժշտությունը տեսանյութից')).toBe(true);
    expect(detectMusicExtractIntent('հանել ձայնը վիդեոյից')).toBe(true);
  });

  it('does not trigger on audio words alone', () => {
    expect(detectMusicExtractIntent('write me a song')).toBe(false);
    expect(detectMusicExtractIntent('generate background music')).toBe(false);
    expect(detectMusicExtractIntent('сделай музыку')).toBe(false);
  });

  it('does not trigger on unrelated text, substrings or empty input', () => {
    expect(detectMusicExtractIntent('build me a landing page')).toBe(false);
    expect(detectMusicExtractIntent('видеонаблюдение для офиса')).toBe(false);
    expect(detectMusicExtractIntent('')).toBe(false);
    expect(detectMusicExtractIntent(null)).toBe(false);
    expect(detectMusicExtractIntent('   ')).toBe(false);
  });
});
