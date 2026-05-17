import { describe, test, expect } from 'vitest';

import {
  detectLanguage,
  highlightLine,
  highlightLines,
  splitHtmlByLine
} from './solution-highlight';

describe('detectLanguage', () => {
  test('returns "go" for .go files', () => {
    expect(detectLanguage('main.go')).toBe('go');
    expect(detectLanguage('pkg/server/handler.go')).toBe('go');
  });

  test('returns "go" for go.mod', () => {
    expect(detectLanguage('go.mod')).toBe('go');
    expect(detectLanguage('repo/go.mod')).toBe('go');
  });

  test('returns "rust" for .rs files', () => {
    expect(detectLanguage('lib.rs')).toBe('rust');
    expect(detectLanguage('src/main.rs')).toBe('rust');
  });

  test('returns "yaml" for .yaml and .yml files', () => {
    expect(detectLanguage('config.yaml')).toBe('yaml');
    expect(detectLanguage('config.yml')).toBe('yaml');
  });

  test('returns "plaintext" for unknown extensions', () => {
    expect(detectLanguage('readme.txt')).toBe('plaintext');
    expect(detectLanguage('Dockerfile')).toBe('plaintext');
    expect(detectLanguage('')).toBe('plaintext');
  });
});

describe('splitHtmlByLine', () => {
  test('splits plain text by newlines and pads to expected length', () => {
    const out = splitHtmlByLine('a\nb\nc', 3);
    expect(out).toEqual(['a', 'b', 'c']);
  });

  test('pads when input has fewer lines than expected', () => {
    const out = splitHtmlByLine('one', 3);
    expect(out).toEqual(['one', '', '']);
  });

  test('truncates when input has more lines than expected', () => {
    const out = splitHtmlByLine('a\nb\nc\nd', 2);
    expect(out).toEqual(['a', 'b']);
  });

  test('reopens span tags that span across newlines', () => {
    const html = '<span class="shiki-string">"hello\nworld"</span>';
    const out = splitHtmlByLine(html, 2);
    expect(out[0]).toBe('<span class="shiki-string">"hello</span>');
    expect(out[1]).toBe('<span class="shiki-string">world"</span>');
  });

  test('handles nested spans across newlines', () => {
    const html = '<span class="a"><span class="b">x\ny</span></span>';
    const out = splitHtmlByLine(html, 2);
    expect(out[0]).toBe('<span class="a"><span class="b">x</span></span>');
    expect(out[1]).toBe('<span class="a"><span class="b">y</span></span>');
  });
});

describe('highlightLines', () => {
  test('escapes HTML for unknown languages', async () => {
    const out = await highlightLines(['<script>alert(1)</script>', 'a & b'], 'unknown.txt');
    expect(out[0]).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(out[1]).toBe('a &amp; b');
  });

  test('returns one entry per input line for known languages', async () => {
    const lines = ['package main', '', 'import "fmt"'];
    const out = await highlightLines(lines, 'main.go');
    expect(out.length).toBe(3);
    out.forEach(entry => expect(typeof entry).toBe('string'));
  });

  test('handles empty input gracefully', async () => {
    expect(await highlightLines([], 'main.go')).toEqual([]);
  });
});

describe('highlightLine', () => {
  test('returns a single highlighted line', async () => {
    const out = await highlightLine('package main', 'main.go');
    expect(typeof out).toBe('string');
    expect(out.length).toBeGreaterThan(0);
  });

  test('escapes html in plaintext mode', async () => {
    const out = await highlightLine('<a>', 'readme.txt');
    expect(out).toBe('&lt;a&gt;');
  });
});