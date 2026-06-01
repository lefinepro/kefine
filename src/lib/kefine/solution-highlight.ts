import { codeToHtml } from 'shiki';

const languageMap: Record<string, string> = {
  go: 'go',
  rs: 'rust',
  rust: 'rust',
  yaml: 'yaml',
  yml: 'yaml',
  mod: 'go'
};

export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (filename.toLowerCase().endsWith('go.mod')) return 'go';
  if (ext === 'go' || ext === 'mod') return 'go';
  if (ext === 'rs') return 'rust';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  return 'plaintext';
}

export async function highlightCode(source: string, filename: string): Promise<string> {
  const language = detectLanguage(filename);
  const lang = language === 'plaintext' ? 'text' : (languageMap[language] ?? 'text');

  try {
    const html = await codeToHtml(source, {
      lang,
      theme: 'github-dark-dimmed'
    });
    return html;
  } catch {
    return escapeHtml(source);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function highlightLines(lines: string[], filename: string): Promise<string[]> {
  const language = detectLanguage(filename);
  if (language === 'plaintext') return lines.map(escapeHtml);

  const source = lines.join('\n');
  const html = await highlightCode(source, filename);

  return splitHtmlByLine(html, lines.length);
}

export async function highlightLine(line: string, filename: string): Promise<string> {
  const result = await highlightLines([line], filename);
  return result[0] ?? '';
}

export function splitHtmlByLine(html: string, expected: number): string[] {
  const bodyMatch = html.match(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/);
  const content = bodyMatch ? bodyMatch[1] : html;
  const result: string[] = [];
  const openTags: Array<{ tag: string; attrs: string }> = [];
  let current = '';
  let i = 0;

  while (i < content.length) {
    const ch = content[i];
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
      const end = content.indexOf('>', i);
      if (end === -1) {
        current += content.slice(i);
        break;
      }
      const tagContent = content.slice(i + 1, end);
      if (tagContent.startsWith('/')) {
        openTags.pop();
      } else if (!tagContent.endsWith('/')) {
        const spaceIndex = tagContent.indexOf(' ');
        const tag = spaceIndex === -1 ? tagContent : tagContent.slice(0, spaceIndex);
        const attrs = spaceIndex === -1 ? '' : tagContent.slice(spaceIndex);
        openTags.push({ tag, attrs });
      }
      current += content.slice(i, end + 1);
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