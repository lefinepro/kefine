import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import { buildQrMatrix } from './kefine-qr';

describe('buildQrMatrix', () => {
  test('produces a square matrix sized for the payload', () => {
    const matrix = buildQrMatrix('https://proxy.lefine.dev/sub/demo');
    assert.ok(matrix.count >= 21, 'QR module count should be at least the version-1 size');
    assert.equal(matrix.size, matrix.count + matrix.margin * 2);
  });

  test('emits both data and finder paths with non-zero geometry', () => {
    const matrix = buildQrMatrix('vless://demo@ams.proxy.lefine.dev:443');
    assert.ok(matrix.finderPath.length > 0, 'finder eyes should always have dark modules');
    assert.ok(matrix.dataPath.length > 0, 'data area should contain dark modules');
    assert.ok(matrix.finderPath.startsWith('M'), 'paths use absolute move commands');
  });

  test('never throws on an empty payload', () => {
    const matrix = buildQrMatrix('   ');
    assert.ok(matrix.count >= 21);
    assert.ok(matrix.finderPath.length > 0);
  });

  test('different payloads yield different data paths', () => {
    const first = buildQrMatrix('config-a');
    const second = buildQrMatrix('config-b');
    assert.notEqual(first.dataPath, second.dataPath);
  });
});
