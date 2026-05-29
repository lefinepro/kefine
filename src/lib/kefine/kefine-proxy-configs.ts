/**
 * Sample proxy/server presets surfaced by the create-step proxy widget.
 *
 * These are intentionally static mock entries (like the demo solutions shown on
 * the same screen). They give the widget several switchable options, each with a
 * shareable subscription link, a downloadable config file and a QR payload.
 */

export interface ProxyConfigOption {
  id: string;
  /** Short display name (e.g. region / node label). */
  name: string;
  /** Human-friendly location used as a subtitle. */
  location: string;
  /** Protocol badge, e.g. VLESS / Shadowsocks / Trojan. */
  protocol: string;
  /** Shareable subscription / import link, also encoded into the QR code. */
  link: string;
  /** File name suggested when downloading the config. */
  fileName: string;
  /** Raw config file contents offered for download. */
  config: string;
}

export const proxyConfigOptions: readonly ProxyConfigOption[] = [
  {
    id: 'ams-vless',
    name: 'Amsterdam',
    location: 'Netherlands · EU-West',
    protocol: 'VLESS',
    link: 'vless://4f9c1e2a-7b3d-4a6c-9f21-8d5e0b1c2a34@ams.proxy.lefine.dev:443?encryption=none&security=tls&type=ws&host=ams.proxy.lefine.dev&path=%2Flefine#Lefine%20Amsterdam',
    fileName: 'lefine-amsterdam.json',
    config: [
      '{',
      '  "remarks": "Lefine · Amsterdam",',
      '  "server": "ams.proxy.lefine.dev",',
      '  "server_port": 443,',
      '  "protocol": "vless",',
      '  "uuid": "4f9c1e2a-7b3d-4a6c-9f21-8d5e0b1c2a34",',
      '  "security": "tls",',
      '  "transport": "ws",',
      '  "path": "/lefine"',
      '}'
    ].join('\n')
  },
  {
    id: 'fra-trojan',
    name: 'Frankfurt',
    location: 'Germany · EU-Central',
    protocol: 'Trojan',
    link: 'trojan://9a8b7c6d5e4f3a2b1c0d@fra.proxy.lefine.dev:443?security=tls&type=tcp&sni=fra.proxy.lefine.dev#Lefine%20Frankfurt',
    fileName: 'lefine-frankfurt.json',
    config: [
      '{',
      '  "remarks": "Lefine · Frankfurt",',
      '  "server": "fra.proxy.lefine.dev",',
      '  "server_port": 443,',
      '  "protocol": "trojan",',
      '  "password": "9a8b7c6d5e4f3a2b1c0d",',
      '  "security": "tls",',
      '  "sni": "fra.proxy.lefine.dev"',
      '}'
    ].join('\n')
  },
  {
    id: 'sgp-ss',
    name: 'Singapore',
    location: 'Singapore · Asia-Pacific',
    protocol: 'Shadowsocks',
    link: 'ss://YWVzLTI1Ni1nY206TGVmaW5lU2luZ2Fwb3JlUGFzcw@sgp.proxy.lefine.dev:8443#Lefine%20Singapore',
    fileName: 'lefine-singapore.json',
    config: [
      '{',
      '  "remarks": "Lefine · Singapore",',
      '  "server": "sgp.proxy.lefine.dev",',
      '  "server_port": 8443,',
      '  "protocol": "shadowsocks",',
      '  "method": "aes-256-gcm",',
      '  "password": "LefineSingaporePass"',
      '}'
    ].join('\n')
  }
];

/**
 * Keywords (across the supported locales) that signal the user is describing a
 * proxy/server task. Matching is case-insensitive and substring based, so
 * inflected forms such as "прокси-сервер" or "proxies" still match.
 */
const PROXY_KEYWORDS = ['proxy', 'proxies', 'прокси', 'պրոքսի'];

/**
 * Returns true when the task description looks like a request for a proxy
 * server, which is the trigger for showing the proxy config widget.
 */
export function matchesProxyServerTask(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return PROXY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
