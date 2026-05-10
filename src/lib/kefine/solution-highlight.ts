import hljs from 'highlight.js/lib/core';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import yaml from 'highlight.js/lib/languages/yaml';

let registered = false;

export function ensureLanguagesRegistered(): void {
  if (registered) return;
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('rust', rust);
  hljs.registerLanguage('yaml', yaml);
  registered = true;
}

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (filename.toLowerCase().endsWith('go.mod')) return 'go';
  if (ext === 'go' || ext === 'mod') return 'go';
  if (ext === 'rs') return 'rust';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  return 'plaintext';
}

export function highlightLines(lines: string[], filename: string): string[] {
  ensureLanguagesRegistered();
  const language = detectLanguage(filename);
  if (language === 'plaintext') return lines.map(escapeHtml);

  const source = lines.join('\n');
  let highlighted: string;
  try {
    highlighted = hljs.highlight(source, { language, ignoreIllegals: true }).value;
  } catch {
    return lines.map(escapeHtml);
  }

  return splitHighlightedByLine(highlighted, lines.length);
}

export function highlightLine(line: string, filename: string): string {
  return highlightLines([line], filename)[0] ?? '';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function splitHighlightedByLine(html: string, expected: number): string[] {
  const result: string[] = [];
  const openTags: Array<{ tag: string; attrs: string }> = [];
  let current = '';
  let i = 0;

  while (i < html.length) {
    const ch = html[i];
    if (ch === '\n') {
      const closing = openTags.map(() => '</span>').join('');
      const reopening = openTags
        .map(({ tag, attrs }) => `<${tag}${attrs}>`)
        .join('');
      result.push(current + closing);
      current = reopening;
      i += 1;
      continue;
    }
    if (ch === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) {
        current += html.slice(i);
        break;
      }
      const tagContent = html.slice(i + 1, end);
      if (tagContent.startsWith('/')) {
        openTags.pop();
      } else if (!tagContent.endsWith('/')) {
        const spaceIndex = tagContent.indexOf(' ');
        const tag = spaceIndex === -1 ? tagContent : tagContent.slice(0, spaceIndex);
        const attrs = spaceIndex === -1 ? '' : tagContent.slice(spaceIndex);
        openTags.push({ tag, attrs });
      }
      current += html.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    current += ch;
    i += 1;
  }
  result.push(current);

  while (result.length < expected) {
    result.push('');
  }
  return result.slice(0, expected);
}
