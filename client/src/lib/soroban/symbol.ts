/**
 * Soroban `Symbol` values (used for harvest_metadata, harvest outcome, and
 * dispute reason) are restricted on-chain to at most 32 characters from
 * [A-Za-z0-9_]. Validate client-side so a bad value fails fast in the form
 * instead of surfacing as an opaque SDK encoding error after submit.
 */
const CONTRACT_SYMBOL_PATTERN = /^[A-Za-z0-9_]{1,32}$/;

export function isValidContractSymbol(value: string): boolean {
  return CONTRACT_SYMBOL_PATTERN.test(value);
}

export const CONTRACT_SYMBOL_HINT =
  'Letters, numbers, and underscores only, max 32 characters.';
