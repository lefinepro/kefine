import { describe, expect, it } from 'vitest';
import { detectProxyServerIntent } from '../widgets/proxy-intent';

describe('detectProxyServerIntent', () => {
  it('matches the Russian reference phrasing from the issue', () => {
    expect(detectProxyServerIntent('Нужен прокси сервер')).toBe(true);
    expect(detectProxyServerIntent('нужен прокси')).toBe(true);
  });

  it('matches English proxy / vpn phrasing', () => {
    expect(detectProxyServerIntent('I need a proxy server')).toBe(true);
    expect(detectProxyServerIntent('set up a vpn for me')).toBe(true);
    expect(detectProxyServerIntent('give me a vless config')).toBe(true);
    expect(detectProxyServerIntent('shadowsocks please')).toBe(true);
  });

  it('matches Armenian proxy phrasing', () => {
    expect(detectProxyServerIntent('պրոքսի սերվեր')).toBe(true);
  });

  it('treats a bare "server" request as non-proxy', () => {
    expect(detectProxyServerIntent('I need a server for my game')).toBe(false);
    expect(detectProxyServerIntent('сервер для сайта')).toBe(false);
  });

  it('escalates "server" to proxy intent with the right context', () => {
    expect(detectProxyServerIntent('server to bypass blocks')).toBe(true);
    expect(detectProxyServerIntent('сервер для обхода блокировок')).toBe(true);
  });

  it('does not trigger on unrelated text or substrings', () => {
    expect(detectProxyServerIntent('build me a landing page')).toBe(false);
    expect(detectProxyServerIntent('serverless function deploy')).toBe(false);
    expect(detectProxyServerIntent('approximately five tasks')).toBe(false);
    expect(detectProxyServerIntent('')).toBe(false);
    expect(detectProxyServerIntent(null)).toBe(false);
    expect(detectProxyServerIntent('   ')).toBe(false);
  });
});
