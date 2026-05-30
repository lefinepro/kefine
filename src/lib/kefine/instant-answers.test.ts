import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import {
  findInstantAnswers,
  type InstantAnswer,
  type InstantAnswersData
} from './instant-answers';

const datasetUrl = new URL('../../../static/instant-answers.json', import.meta.url);
const data = JSON.parse(readFileSync(fileURLToPath(datasetUrl), 'utf-8')) as InstantAnswersData;
const sites: InstantAnswer[] = data.sites;

describe('instant-answers dataset', () => {
  it('is a non-empty array of valid entries', () => {
    expect(Array.isArray(sites)).toBe(true);
    expect(sites.length).toBeGreaterThan(0);
    for (const site of sites) {
      expect(typeof site.name).toBe('string');
      expect(site.url).toMatch(/^https:\/\//);
      expect(typeof site.icon).toBe('string');
      expect(typeof site.description).toBe('string');
      expect(Array.isArray(site.aliases)).toBe(true);
    }
  });

  it('contains SoundCloud pointing at https://soundcloud.com/', () => {
    const soundcloud = sites.find((site) => site.name === 'SoundCloud');
    expect(soundcloud).toBeDefined();
    expect(soundcloud?.url).toBe('https://soundcloud.com/');
  });
});

describe('findInstantAnswers', () => {
  it('matches "sound cloud" to SoundCloud (space-insensitive)', () => {
    const results = findInstantAnswers('sound cloud', sites);
    expect(results[0]?.name).toBe('SoundCloud');
    expect(results[0]?.url).toBe('https://soundcloud.com/');
  });

  it('matches "git hub" to GitHub (space-insensitive)', () => {
    const results = findInstantAnswers('git hub', sites);
    expect(results.some((site) => site.name === 'GitHub')).toBe(true);
    expect(results[0]?.name).toBe('GitHub');
  });

  it('matches Russian aliases case-insensitively', () => {
    const results = findInstantAnswers('ЮТУБ', sites);
    expect(results.some((site) => site.name === 'YouTube')).toBe(true);
  });

  it('returns [] for an empty query', () => {
    expect(findInstantAnswers('', sites)).toEqual([]);
  });

  it('returns [] for a whitespace-only query', () => {
    expect(findInstantAnswers('   ', sites)).toEqual([]);
  });

  it('returns [] for a nonsense query', () => {
    expect(findInstantAnswers('zzzznotarealsite', sites)).toEqual([]);
  });

  it('ranks prefix matches before substring matches', () => {
    const results = findInstantAnswers('git', sites);
    expect(results[0]?.name.toLowerCase().startsWith('git')).toBe(true);
  });

  it('caps the number of results', () => {
    const results = findInstantAnswers('а', sites, 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });
});
