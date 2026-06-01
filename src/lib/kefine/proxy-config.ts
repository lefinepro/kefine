/**
 * Pure, deterministic generator for the proxy configuration widget preview.
 *
 * The widget is a *preview* shown before any task is submitted, so the values do
 * not have to be live credentials — but they must look real, stay stable across
 * re-renders (no `Math.random`, which would also break SSR hydration) and change
 * coherently when the user switches region or protocol.
 */

export type ProxyProtocolId = 'vless' | 'wireguard' | 'shadowsocks';

export interface ProxyRegion {
  id: string;
  city: string;
  country: string;
  /** Regional indicator emoji flag. */
  flag: string;
  host: string;
  pingMs: number;
}

export interface ProxyProtocol {
  id: ProxyProtocolId;
  label: string;
  port: number;
}

export interface ProxyProfile {
  region: ProxyRegion;
  protocol: ProxyProtocol;
  /** Single-line connection URI / share link. */
  link: string;
  /** Multi-line configuration file body. */
  config: string;
  /** Suggested download file name. */
  fileName: string;
}

export const PROXY_REGIONS: readonly ProxyRegion[] = [
  { id: 'ams', city: 'Amsterdam', country: 'NL', flag: '🇳🇱', host: 'ams.edge.kefine.net', pingMs: 24 },
  { id: 'fra', city: 'Frankfurt', country: 'DE', flag: '🇩🇪', host: 'fra.edge.kefine.net', pingMs: 31 },
  { id: 'sto', city: 'Stockholm', country: 'SE', flag: '🇸🇪', host: 'sto.edge.kefine.net', pingMs: 42 },
  { id: 'sgp', city: 'Singapore', country: 'SG', flag: '🇸🇬', host: 'sgp.edge.kefine.net', pingMs: 86 }
];

export const PROXY_PROTOCOLS: readonly ProxyProtocol[] = [
  { id: 'vless', label: 'VLESS', port: 443 },
  { id: 'wireguard', label: 'WireGuard', port: 51820 },
  { id: 'shadowsocks', label: 'Shadowsocks', port: 8388 }
];

/** Tiny FNV-1a hash → lowercase hex, used to mint stable pseudo-credentials. */
function hashHex(seed: string, length: number): string {
  let hash = 0x811c9dc5;
  let out = '';
  let counter = 0;
  while (out.length < length) {
    for (let index = 0; index < seed.length; index++) {
      hash ^= seed.charCodeAt(index) + counter;
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    out += hash.toString(16).padStart(8, '0');
    counter++;
  }
  return out.slice(0, length);
}

function makeUuid(seed: string): string {
  const hex = hashHex(seed, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

function buildVlessProfile(region: ProxyRegion, protocol: ProxyProtocol): { link: string; config: string } {
  const uuid = makeUuid(`vless:${region.id}`);
  const tag = `Kefine-${region.city}`;
  const link =
    `vless://${uuid}@${region.host}:${protocol.port}` +
    `?type=tcp&security=reality&sni=www.cloudflare.com&fp=chrome&flow=xtls-rprx-vision#${encodeURIComponent(tag)}`;
  const config = [
    '{',
    '  "protocol": "vless",',
    `  "tag": "${tag}",`,
    '  "settings": {',
    '    "vnext": [',
    '      {',
    `        "address": "${region.host}",`,
    `        "port": ${protocol.port},`,
    '        "users": [',
    `          { "id": "${uuid}", "flow": "xtls-rprx-vision", "encryption": "none" }`,
    '        ]',
    '      }',
    '    ]',
    '  },',
    '  "streamSettings": {',
    '    "network": "tcp",',
    '    "security": "reality",',
    '    "realitySettings": { "serverName": "www.cloudflare.com", "fingerprint": "chrome" }',
    '  }',
    '}'
  ].join('\n');
  return { link, config };
}

function buildWireguardProfile(region: ProxyRegion, protocol: ProxyProtocol): { link: string; config: string } {
  const privateKey = `${hashHex(`wg-priv:${region.id}`, 42)}=`;
  const publicKey = `${hashHex(`wg-pub:${region.id}`, 42)}=`;
  const config = [
    '[Interface]',
    `PrivateKey = ${privateKey}`,
    'Address = 10.66.66.2/32, fd42:42:42::2/128',
    'DNS = 1.1.1.1, 1.0.0.1',
    '',
    '[Peer]',
    `PublicKey = ${publicKey}`,
    'AllowedIPs = 0.0.0.0/0, ::/0',
    `Endpoint = ${region.host}:${protocol.port}`,
    'PersistentKeepalive = 25'
  ].join('\n');
  // WireGuard has no canonical share URI; expose the endpoint as the link.
  const link = `wireguard://${region.host}:${protocol.port}?region=${region.id}`;
  return { link, config };
}

function buildShadowsocksProfile(region: ProxyRegion, protocol: ProxyProtocol): { link: string; config: string } {
  const method = 'chacha20-ietf-poly1305';
  const password = hashHex(`ss:${region.id}`, 24);
  const tag = `Kefine-${region.city}`;
  const userinfo =
    typeof btoa === 'function'
      ? btoa(`${method}:${password}`)
      : Buffer.from(`${method}:${password}`).toString('base64');
  const link = `ss://${userinfo}@${region.host}:${protocol.port}#${encodeURIComponent(tag)}`;
  const config = [
    '{',
    `  "server": "${region.host}",`,
    `  "server_port": ${protocol.port},`,
    `  "password": "${password}",`,
    `  "method": "${method}",`,
    `  "remarks": "${tag}"`,
    '}'
  ].join('\n');
  return { link, config };
}

export function buildProxyProfile(region: ProxyRegion, protocol: ProxyProtocol): ProxyProfile {
  const parts =
    protocol.id === 'wireguard'
      ? buildWireguardProfile(region, protocol)
      : protocol.id === 'shadowsocks'
        ? buildShadowsocksProfile(region, protocol)
        : buildVlessProfile(region, protocol);

  const extension = protocol.id === 'wireguard' ? 'conf' : 'json';
  return {
    region,
    protocol,
    link: parts.link,
    config: parts.config,
    fileName: `kefine-${protocol.id}-${region.id}.${extension}`
  };
}
