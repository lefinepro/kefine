/**
 * Lightweight detector that decides whether a free-form task draft is asking for
 * a proxy / VPN server. The proxy configuration widget reacts to this *while the
 * user is still typing* (no submit required), so the matcher is intentionally
 * cheap and forgiving across English, Russian and Armenian phrasing.
 */

/**
 * Protocol / product keywords that on their own clearly signal a proxy request.
 * Matched as whole words (with Unicode-aware boundaries) so "approxy" or
 * "serverless" do not trigger the widget by accident.
 */
const STRONG_KEYWORDS: readonly string[] = [
  'proxy',
  'proxies',
  'прокси',
  'պրոքսի',
  'vpn',
  'впн',
  'vless',
  'vmess',
  'trojan',
  'shadowsocks',
  'shadowsocks',
  'wireguard',
  'outline',
  'socks5',
  'socks',
  'xray',
  'v2ray'
];

/**
 * "server" by itself is too generic, so it only counts as a proxy intent when it
 * co-occurs with one of these context words in the same draft.
 */
const SERVER_WORDS: readonly string[] = ['server', 'сервер', 'սերվեր'];
const SERVER_CONTEXT: readonly string[] = [
  'proxy',
  'прокси',
  'պրոքսի',
  'vpn',
  'впн',
  'tunnel',
  'туннель',
  'тоннель',
  'обход',
  'bypass',
  'unblock',
  'разблок'
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

export function detectProxyServerIntent(text: string | null | undefined): boolean {
  if (!text) {
    return false;
  }

  const normalized = ` ${text.toLowerCase().trim()} `;
  if (normalized.trim().length < 3) {
    return false;
  }

  if (STRONG_KEYWORDS.some((keyword) => containsWord(normalized, keyword))) {
    return true;
  }

  // Context words are matched as stems (substring) so inflected Russian forms
  // like "обхода" / "разблокировки" still count.
  const mentionsServer = SERVER_WORDS.some((word) => containsWord(normalized, word));
  if (mentionsServer && SERVER_CONTEXT.some((word) => normalized.includes(word))) {
    return true;
  }

  return false;
}
