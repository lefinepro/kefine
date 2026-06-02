import { describe, expect, test } from 'vitest';
import {
  parseOrgLinks,
  parseOrgReadme,
  parseOrgTodos,
  repoReadme,
  repoTodos
} from './repo-docs';

describe('parseOrgLinks', () => {
  test('parses Org-style links', () => {
    expect(parseOrgLinks('see [[https://kefine.pro/demo][Live demo]] now')).toEqual([
      { url: 'https://kefine.pro/demo', label: 'Live demo' }
    ]);
  });

  test('parses bare URLs', () => {
    expect(parseOrgLinks('docs at https://kefine.pro/docs')).toEqual([
      { url: 'https://kefine.pro/docs', label: 'https://kefine.pro/docs' }
    ]);
  });
});

describe('parseOrgReadme', () => {
  const src = [
    '#+TITLE: kefine/go-proxy',
    '',
    '* Brief',
    '  Minimal HTTP proxy in Go.',
    '  Forwards requests.',
    '',
    '* Settings',
    '  - Default branch :: main',
    '  - Visibility :: public',
    '',
    '* Demonstration',
    '  - [[https://go-proxy.kefine.pro][Live demo app]]'
  ].join('\n');

  test('reads the title', () => {
    expect(parseOrgReadme(src).title).toBe('kefine/go-proxy');
  });

  test('collapses the Brief section into prose', () => {
    expect(parseOrgReadme(src).brief).toBe('Minimal HTTP proxy in Go. Forwards requests.');
  });

  test('parses key/value settings', () => {
    const settings = parseOrgReadme(src).sections.find((s) => s.id === 'settings');
    expect(settings?.settings).toEqual([
      { key: 'Default branch', value: 'main' },
      { key: 'Visibility', value: 'public' }
    ]);
  });

  test('parses links and strips markup from items', () => {
    const demo = parseOrgReadme(src).sections.find((s) => s.id === 'demonstration');
    expect(demo?.links).toEqual([{ url: 'https://go-proxy.kefine.pro', label: 'Live demo app' }]);
    expect(demo?.items).toEqual(['Live demo app']);
  });
});

describe('parseOrgTodos', () => {
  test('reads TODO and DONE states in order', () => {
    const todos = parseOrgTodos(['* TODO First task', '* DONE Second task'].join('\n'));
    expect(todos).toEqual([
      { id: 'todo-1', state: 'TODO', title: 'First task', done: false },
      { id: 'todo-2', state: 'DONE', title: 'Second task', done: true }
    ]);
  });

  test('ignores non-task headings', () => {
    expect(parseOrgTodos('* Notes\nsome prose')).toEqual([]);
  });
});

describe('repository docs (?raw imports)', () => {
  test('the bundled README exposes a Brief section', () => {
    expect(repoReadme.title).toContain('go-proxy');
    expect(repoReadme.brief.length).toBeGreaterThan(0);
    expect(repoReadme.sections.some((s) => s.id === 'brief')).toBe(true);
    expect(repoReadme.sections.some((s) => s.id === 'demonstration')).toBe(true);
  });

  test('the bundled TODO file has stored tasks', () => {
    expect(repoTodos.length).toBeGreaterThan(0);
    expect(repoTodos.every((t) => t.title.length > 0)).toBe(true);
  });
});
