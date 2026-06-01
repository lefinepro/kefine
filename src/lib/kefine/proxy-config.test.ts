import { describe, expect, it } from 'vitest';
import {
  PROXY_PROTOCOLS,
  PROXY_REGIONS,
  buildProxyProfile,
  type ProxyProtocol,
  type ProxyRegion
} from './proxy-config';

const region: ProxyRegion = PROXY_REGIONS[0];
const byId = (id: string): ProxyProtocol => PROXY_PROTOCOLS.find((p) => p.id === id)!;

describe('buildProxyProfile', () => {
  it('is deterministic for the same region/protocol', () => {
    const a = buildProxyProfile(region, byId('vless'));
    const b = buildProxyProfile(region, byId('vless'));
    expect(a).toEqual(b);
  });

  it('produces a VLESS share link and JSON config', () => {
    const profile = buildProxyProfile(region, byId('vless'));
    expect(profile.link.startsWith('vless://')).toBe(true);
    expect(profile.link).toContain(region.host);
    expect(profile.config).toContain('"protocol": "vless"');
    expect(profile.fileName).toBe('kefine-vless-ams.json');
  });

  it('produces a WireGuard .conf with interface and peer sections', () => {
    const profile = buildProxyProfile(region, byId('wireguard'));
    expect(profile.config).toContain('[Interface]');
    expect(profile.config).toContain('[Peer]');
    expect(profile.config).toContain(`Endpoint = ${region.host}:51820`);
    expect(profile.fileName.endsWith('.conf')).toBe(true);
  });

  it('produces a Shadowsocks ss:// link', () => {
    const profile = buildProxyProfile(region, byId('shadowsocks'));
    expect(profile.link.startsWith('ss://')).toBe(true);
    expect(profile.config).toContain('chacha20-ietf-poly1305');
  });

  it('changes credentials when the region changes', () => {
    const ams = buildProxyProfile(PROXY_REGIONS[0], byId('vless'));
    const fra = buildProxyProfile(PROXY_REGIONS[1], byId('vless'));
    expect(ams.link).not.toBe(fra.link);
  });

  it('exposes at least one region and the three core protocols', () => {
    expect(PROXY_REGIONS.length).toBeGreaterThan(0);
    expect(PROXY_PROTOCOLS.map((p) => p.id).sort()).toEqual(['shadowsocks', 'vless', 'wireguard']);
  });
});
