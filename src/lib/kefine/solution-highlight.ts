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
  if (ext === 'go' || ext === 'mod') return 'go';
  if (ext === 'rs') return 'rust';
  if (ext === 'yaml' || ext === 'yml') return 'yaml';
  return 'plaintext';
}

export function highlightLine(line: string, filename: string): string {
  ensureLanguagesRegistered();
  const language = detectLanguage(filename);
  if (language === 'plaintext') return escapeHtml(line);
  try {
    return hljs.highlight(line, { language, ignoreIllegals: true }).value;
  } catch {
    return escapeHtml(line);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
