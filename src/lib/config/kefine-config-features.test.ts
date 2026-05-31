import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { resolvePublicRuntimeConfig } from './public-config';

describe('shipped kefine.config.json feature flags', () => {
  test('disables the repositories feature by default', () => {
    const configPath = path.resolve(process.cwd(), 'kefine.config.json');
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const resolved = resolvePublicRuntimeConfig(raw);
    expect(resolved.features.repositories).toBe(false);
  });
});
