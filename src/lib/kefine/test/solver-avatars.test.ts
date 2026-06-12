import { describe, expect, test } from 'vitest';
import {
  buildSolverAvatars,
  solverAvatarColor,
  solverAvatarHue,
  solverInitials
} from '../solutions/solver-avatars';

describe('solverInitials', () => {
  test('uses first and last word initials', () => {
    expect(solverInitials('Go Proxy Pro')).toBe('GP');
    expect(solverInitials('Go Proxy Enterprise')).toBe('GE');
  });

  test('uses the first two letters for single-word names', () => {
    expect(solverInitials('Basic')).toBe('BA');
  });

  test('falls back to a placeholder for empty input', () => {
    expect(solverInitials('   ')).toBe('?');
  });
});

describe('solverAvatarHue', () => {
  test('is deterministic and within range', () => {
    const hue = solverAvatarHue('Go Proxy Basic');
    expect(hue).toBe(solverAvatarHue('Go Proxy Basic'));
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  test('produces an hsl colour string', () => {
    expect(solverAvatarColor('Go Proxy Basic')).toMatch(/^hsl\(\d+ \d+% \d+%\)$/);
  });
});

describe('buildSolverAvatars', () => {
  const solvers = [
    { id: '5', solver: 'Go Proxy Basic' },
    { id: '6', solver: 'Go Proxy Pro' },
    { id: '7', solver: 'Go Proxy Enterprise' },
    { id: '8', solver: 'Go Proxy Edge' },
    { id: '9', solver: 'Go Proxy Cloud' }
  ];

  test('limits the visible avatars and reports the overflow', () => {
    const { avatars, overflow } = buildSolverAvatars(solvers, 3);
    expect(avatars).toHaveLength(3);
    expect(overflow).toBe(2);
    expect(avatars[0]).toMatchObject({ id: '5', name: 'Go Proxy Basic', initials: 'GB' });
  });

  test('has no overflow when everything fits', () => {
    const { avatars, overflow } = buildSolverAvatars(solvers.slice(0, 2), 4);
    expect(avatars).toHaveLength(2);
    expect(overflow).toBe(0);
  });
});
