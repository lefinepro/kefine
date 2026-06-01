import { afterEach, describe, expect, test } from 'vitest';
import {
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_PUBLIC_RUNTIME_CONFIG,
  isFeatureEnabled,
  normalizeFeatureFlags,
  resolvePublicRuntimeConfig,
  setBrowserPublicRuntimeConfig
} from './public-config';

describe('normalizeFeatureFlags', () => {
  test('returns defaults for missing or invalid input', () => {
    expect(normalizeFeatureFlags(undefined)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags(null)).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags('nope')).toEqual(DEFAULT_FEATURE_FLAGS);
    expect(normalizeFeatureFlags({})).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  test('respects explicit repository flag booleans', () => {
    expect(normalizeFeatureFlags({ repositories: false })).toEqual({ repositories: false });
    expect(normalizeFeatureFlags({ repositories: true })).toEqual({ repositories: true });
  });

  test('coerces common truthy and falsy forms', () => {
    expect(normalizeFeatureFlags({ repositories: 'false' }).repositories).toBe(false);
    expect(normalizeFeatureFlags({ repositories: 'off' }).repositories).toBe(false);
    expect(normalizeFeatureFlags({ repositories: 'disabled' }).repositories).toBe(false);
    expect(normalizeFeatureFlags({ repositories: 0 }).repositories).toBe(false);
    expect(normalizeFeatureFlags({ repositories: 'true' }).repositories).toBe(true);
    expect(normalizeFeatureFlags({ repositories: 'yes' }).repositories).toBe(true);
    expect(normalizeFeatureFlags({ repositories: 1 }).repositories).toBe(true);
  });

  test('falls back to defaults for unrecognized values', () => {
    expect(normalizeFeatureFlags({ repositories: 'maybe' }).repositories).toBe(
      DEFAULT_FEATURE_FLAGS.repositories
    );
    expect(normalizeFeatureFlags({ repositories: '' }).repositories).toBe(
      DEFAULT_FEATURE_FLAGS.repositories
    );
  });
});

describe('resolvePublicRuntimeConfig feature flags', () => {
  test('includes default feature flags when none are provided', () => {
    expect(resolvePublicRuntimeConfig({}).features).toEqual(DEFAULT_FEATURE_FLAGS);
  });

  test('threads configured feature flags through public config', () => {
    const config = resolvePublicRuntimeConfig({ features: { repositories: false } });
    expect(config.features.repositories).toBe(false);
  });
});

describe('isFeatureEnabled', () => {
  afterEach(() => {
    setBrowserPublicRuntimeConfig(DEFAULT_PUBLIC_RUNTIME_CONFIG);
  });

  test('reads from an explicitly provided config', () => {
    const enabled = resolvePublicRuntimeConfig({ features: { repositories: true } });
    const disabled = resolvePublicRuntimeConfig({ features: { repositories: false } });
    expect(isFeatureEnabled('repositories', enabled)).toBe(true);
    expect(isFeatureEnabled('repositories', disabled)).toBe(false);
  });

  test('defaults to the browser runtime config when no config is provided', () => {
    setBrowserPublicRuntimeConfig({ features: { repositories: false } });
    expect(isFeatureEnabled('repositories')).toBe(false);

    setBrowserPublicRuntimeConfig({ features: { repositories: true } });
    expect(isFeatureEnabled('repositories')).toBe(true);
  });
});
