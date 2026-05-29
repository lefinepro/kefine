import assert from 'node:assert/strict';
import { describe, test } from 'vitest';

import { matchesProxyServerTask, proxyConfigOptions } from './kefine-proxy-configs';

describe('matchesProxyServerTask', () => {
  test('matches English proxy descriptions', () => {
    assert.equal(matchesProxyServerTask('I need a proxy server'), true);
    assert.equal(matchesProxyServerTask('Set up proxies for the team'), true);
  });

  test('matches Russian proxy descriptions', () => {
    assert.equal(matchesProxyServerTask('Нужен прокси сервер'), true);
    assert.equal(matchesProxyServerTask('настроить прокси-сервер'), true);
  });

  test('matches Armenian proxy descriptions', () => {
    assert.equal(matchesProxyServerTask('Պետք է պրոքսի սերվեր'), true);
  });

  test('ignores unrelated or empty input', () => {
    assert.equal(matchesProxyServerTask(''), false);
    assert.equal(matchesProxyServerTask('   '), false);
    assert.equal(matchesProxyServerTask('Build a landing page'), false);
  });
});

describe('proxyConfigOptions data integrity', () => {
  test('every option has a unique id', () => {
    const ids = proxyConfigOptions.map((option) => option.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('every option carries a link, file name and config payload', () => {
    for (const option of proxyConfigOptions) {
      assert.ok(option.link.length > 0, `${option.id} should expose a link`);
      assert.ok(option.fileName.endsWith('.json'), `${option.id} should suggest a file name`);
      assert.ok(option.config.includes(option.name), `${option.id} config should reference its name`);
    }
  });
});
