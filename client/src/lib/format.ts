const numberFormatter = new Intl.NumberFormat('en-US');

/** Formats a raw i128 contract amount (no assumed token decimals). */
export function formatContractAmount(value: bigint): string {
  return numberFormatter.format(value);
}

export function formatLedgerTimestamp(seconds: bigint | number): string {
  return new Date(Number(seconds) * 1000).toLocaleString();
}
