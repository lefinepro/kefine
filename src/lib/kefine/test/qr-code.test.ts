import { describe, expect, it } from 'vitest';
import { createQrMatrix, qrMatrixToSvgPath } from '../widgets/qr-code';

describe('createQrMatrix', () => {
  it('produces a square matrix with an odd module count', () => {
    const qr = createQrMatrix('https://kefine.example/proxy');
    expect(qr.size).toBe(qr.modules.length);
    for (const row of qr.modules) {
      expect(row.length).toBe(qr.size);
    }
    expect(qr.size % 2).toBe(1);
    expect(qr.size).toBeGreaterThanOrEqual(21);
  });

  it('renders the three finder patterns in the corners', () => {
    const { modules, size } = createQrMatrix('finder-pattern-check');
    // Finder patterns are 7x7 with a dark 1-module border ring.
    const corners: Array<[number, number]> = [
      [0, 0],
      [0, size - 7],
      [size - 7, 0]
    ];
    for (const [y, x] of corners) {
      // Outer ring corner must be dark, the inner separator must be light.
      expect(modules[y][x]).toBe(true);
      expect(modules[y + 1][x + 1]).toBe(false);
      // 3x3 dark center block.
      expect(modules[y + 3][x + 3]).toBe(true);
    }
  });

  it('encodes longer payloads by selecting a higher version', () => {
    const short = createQrMatrix('short');
    const long = createQrMatrix('x'.repeat(400));
    expect(long.version).toBeGreaterThan(short.version);
    expect(long.size).toBeGreaterThan(short.size);
  });

  it('handles unicode payloads via UTF-8 byte encoding', () => {
    const qr = createQrMatrix('Нужен прокси сервер — vless://пример');
    expect(qr.size).toBeGreaterThanOrEqual(21);
    expect(qr.modules.flat().some(Boolean)).toBe(true);
  });

  it('is deterministic for identical input', () => {
    const a = createQrMatrix('vless://uuid@host:443?type=tcp');
    const b = createQrMatrix('vless://uuid@host:443?type=tcp');
    expect(a.size).toBe(b.size);
    expect(a.modules).toEqual(b.modules);
  });

  it('throws when the payload exceeds QR capacity', () => {
    expect(() => createQrMatrix('a'.repeat(5000))).toThrow();
  });

  it('emits one SVG sub-path per dark module', () => {
    const qr = createQrMatrix('vless://demo');
    const darkModules = qr.modules.flat().filter(Boolean).length;
    const path = qrMatrixToSvgPath(qr);
    expect(path.match(/M/g)?.length).toBe(darkModules);
    expect(path.startsWith('M')).toBe(true);
  });
});
