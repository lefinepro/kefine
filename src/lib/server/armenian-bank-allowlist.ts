const ARMENIAN_BANK_PATTERNS = [
  /ameriabank/i,
  /ardshinbank/i,
  /\bacba\b/i,
  /inecobank/i,
  /\bidbank\b/i,
  /converse bank/i,
  /evocabank/i,
  /armeconombank/i,
  /unibank/i,
  /vtb armenia/i,
  /fast bank/i
] as const;

export function matchesArmenianBank(bankName: string | null | undefined): boolean {
  if (!bankName) {
    return false;
  }

  return ARMENIAN_BANK_PATTERNS.some((pattern) => pattern.test(bankName));
}
