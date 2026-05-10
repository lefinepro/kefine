import assert from 'node:assert/strict';
import { describe, test } from 'bun:test';

import {
  detectLanguage,
  highlightLine,
  highlightLines,
  splitHighlightedByLine
} from '$lib/kefine/solution-highlight';

describe('detectLanguage', () => {
  test('returns "go" for .go files', () => {
    assert.equal(detectLanguage('main.go'), 'go');
    assert.equal(detectLanguage('pkg/server/handler.go'), 'go');
  });

  test('returns "go" for go.mod', () => {
    assert.equal(detectLanguage('go.mod'), 'go');
    assert.equal(detectLanguage('repo/go.mod'), 'go');
  });

  test('returns "rust" for .rs files', () => {
    assert.equal(detectLanguage('lib.rs'), 'rust');
    assert.equal(detectLanguage('src/main.rs'), 'rust');
  });

  test('returns "yaml" for .yaml and .yml files', () => {
    assert.equal(detectLanguage('config.yaml'), 'yaml');
    assert.equal(detectLanguage('config.yml'), 'yaml');
  });

  test('returns "plaintext" for unknown extensions', () => {
    assert.equal(detectLanguage('readme.txt'), 'plaintext');
    assert.equal(detectLanguage('Dockerfile'), 'plaintext');
    assert.equal(detectLanguage(''), 'plaintext');
  });
});

describe('splitHighlightedByLine', () => {
  test('splits plain text by newlines and pads to expected length', () => {
    const out = splitHighlightedByLine('a\nb\nc', 3);
    assert.deepEqual(out, ['a', 'b', 'c']);
  });

  test('pads when input has fewer lines than expected', () => {
    const out = splitHighlightedByLine('one', 3);
    assert.deepEqual(out, ['one', '', '']);
  });

  test('truncates when input has more lines than expected', () => {
    const out = splitHighlightedByLine('a\nb\nc\nd', 2);
    assert.deepEqual(out, ['a', 'b']);
  });

  test('reopens span tags that span across newlines', () => {
    const html = '<span class="hljs-string">"hello\nworld"</span>';
    const out = splitHighlightedByLine(html, 2);
    assert.equal(out[0], '<span class="hljs-string">"hello</span>');
    assert.equal(out[1], '<span class="hljs-string">world"</span>');
  });

  test('handles nested spans across newlines', () => {
    const html = '<span class="a"><span class="b">x\ny</span></span>';
    const out = splitHighlightedByLine(html, 2);
    assert.equal(out[0], '<span class="a"><span class="b">x</span></span>');
    assert.equal(out[1], '<span class="a"><span class="b">y</span></span>');
  });
});

describe('highlightLines', () => {
  test('escapes HTML for unknown languages', () => {
    const out = highlightLines(['<script>alert(1)</script>', 'a & b'], 'unknown.txt');
    assert.equal(out[0], '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.equal(out[1], 'a &amp; b');
  });

  test('returns one entry per input line for known languages', () => {
    const lines = ['package main', '', 'import "fmt"'];
    const out = highlightLines(lines, 'main.go');
    assert.equal(out.length, 3);
    out.forEach(entry => assert.equal(typeof entry, 'string'));
  });

  test('preserves multi-line tokens by highlighting whole text', () => {
    // A multi-line string literal in Go uses backticks. The highlighter
    // should still tag both halves of the literal as a string.
    const src = ['s := `line one', 'line two`'];
    const out = highlightLines(src, 'main.go');
    assert.equal(out.length, 2);
    assert.ok(
      out[0].includes('hljs-string'),
      `expected first line to contain hljs-string, got: ${out[0]}`
    );
    assert.ok(
      out[1].includes('hljs-string'),
      `expected second line to contain hljs-string, got: ${out[1]}`
    );
  });

  test('handles empty input gracefully', () => {
    assert.deepEqual(highlightLines([], 'main.go'), []);
  });
});

describe('highlightLine', () => {
  test('returns a single highlighted line', () => {
    const out = highlightLine('package main', 'main.go');
    assert.equal(typeof out, 'string');
    assert.ok(out.length > 0);
  });

  test('escapes html in plaintext mode', () => {
    const out = highlightLine('<a>', 'readme.txt');
    assert.equal(out, '&lt;a&gt;');
  });
});
