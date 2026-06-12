import { describe, expect, it } from 'vitest';
import { matchesArmenianBank } from '../bank/armenian-bank-allowlist';

describe('matchesArmenianBank', () => {
  it('matches allowlisted Armenian issuers regardless of casing or suffixes', () => {
    expect(matchesArmenianBank('Ameriabank CJSC')).toBe(true);
    expect(matchesArmenianBank('INECOBANK')).toBe(true);
    expect(matchesArmenianBank('Ardshinbank')).toBe(true);
    expect(matchesArmenianBank('ACBA Bank')).toBe(true);
    expect(matchesArmenianBank('VTB Armenia')).toBe(true);
  });

  it('rejects banks that are not on the allowlist', () => {
    expect(matchesArmenianBank('JPMORGAN CHASE BANK N.A.')).toBe(false);
    expect(matchesArmenianBank('Sberbank')).toBe(false);
  });

  it('treats missing bank names as ineligible', () => {
    expect(matchesArmenianBank(null)).toBe(false);
    expect(matchesArmenianBank(undefined)).toBe(false);
    expect(matchesArmenianBank('')).toBe(false);
  });
});
