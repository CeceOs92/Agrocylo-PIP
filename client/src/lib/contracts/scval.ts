/**
 * Soroban ScVal encoding/decoding utilities.
 * Handles conversion between TypeScript types and Soroban contract values.
 */

import * as StellarSdk from '@stellar/stellar-sdk';

const { xdr, Address: StellarAddress } = StellarSdk;

/**
 * Encode a Stellar address to ScVal.
 */
export function addressToScVal(address: string): StellarSdk.xdr.ScVal {
  return StellarAddress.fromString(address).toScVal();
}

/**
 * Decode ScVal to Stellar address string.
 */
export function scValToAddress(scVal: StellarSdk.xdr.ScVal): string {
  return StellarAddress.fromScVal(scVal).toString();
}

/**
 * Encode u64 to ScVal.
 */
export function u64ToScVal(value: bigint | number): StellarSdk.xdr.ScVal {
  return xdr.ScVal.scvU64(
    new StellarSdk.xdr.Uint64(
      typeof value === 'bigint' ? value : BigInt(value),
    ),
  );
}

/**
 * Decode ScVal to u64 (as bigint).
 */
export function scValToU64(scVal: StellarSdk.xdr.ScVal): bigint {
  if (scVal.switch().name !== 'scvU64') {
    throw new Error('Expected ScVal of type u64');
  }
  const u64 = scVal.u64();
  return u64.toBigInt();
}

/**
 * Encode i128 to ScVal.
 */
export function i128ToScVal(value: bigint): StellarSdk.xdr.ScVal {
  const isNegative = value < 0n;
  const absValue = isNegative ? -value : value;

  const lo = absValue & 0xffffffffffffffffn;
  const hi = absValue >> 64n;

  const i128Parts = new xdr.Int128Parts({
    lo: new xdr.Uint64(lo),
    hi: new xdr.Int64(isNegative ? -hi : hi),
  });

  return xdr.ScVal.scvI128(i128Parts);
}

/**
 * Decode ScVal to i128 (as bigint).
 */
export function scValToI128(scVal: StellarSdk.xdr.ScVal): bigint {
  if (scVal.switch().name !== 'scvI128') {
    throw new Error('Expected ScVal of type i128');
  }
  const i128 = scVal.i128();
  const lo = i128.lo().toBigInt();
  const hi = i128.hi().toBigInt();

  // Reconstruct the value
  const value = (hi << 64n) | lo;
  return value;
}

/**
 * Encode Symbol to ScVal.
 */
export function symbolToScVal(symbol: string): StellarSdk.xdr.ScVal {
  if (symbol.length > 32) {
    throw new Error('Symbol length exceeds 32 characters');
  }
  return xdr.ScVal.scvSymbol(Buffer.from(symbol, 'utf8'));
}

/**
 * Decode ScVal to Symbol string.
 */
export function scValToSymbol(scVal: StellarSdk.xdr.ScVal): string {
  if (scVal.switch().name !== 'scvSymbol') {
    throw new Error('Expected ScVal of type Symbol');
  }
  return scVal.sym().toString('utf8');
}

/**
 * Encode Vec<T> to ScVal.
 */
export function vecToScVal(
  values: StellarSdk.xdr.ScVal[],
): StellarSdk.xdr.ScVal {
  return xdr.ScVal.scvVec(values);
}

/**
 * Decode ScVal to Vec<T>.
 */
export function scValToVec(
  scVal: StellarSdk.xdr.ScVal,
): StellarSdk.xdr.ScVal[] {
  if (scVal.switch().name !== 'scvVec') {
    throw new Error('Expected ScVal of type Vec');
  }
  return scVal.vec() ?? [];
}

/**
 * Encode boolean to ScVal.
 */
export function boolToScVal(value: boolean): StellarSdk.xdr.ScVal {
  return xdr.ScVal.scvBool(value);
}

/**
 * Decode ScVal to boolean.
 */
export function scValToBool(scVal: StellarSdk.xdr.ScVal): boolean {
  if (scVal.switch().name !== 'scvBool') {
    throw new Error('Expected ScVal of type Bool');
  }
  return scVal.b();
}

/**
 * Decode enum variant from ScVal.
 */
export function scValToEnum(scVal: StellarSdk.xdr.ScVal): string {
  if (scVal.switch().name !== 'scvVec') {
    throw new Error('Expected ScVal Vec for enum');
  }
  const vec = scVal.vec();
  if (!vec || vec.length === 0) {
    throw new Error('Empty enum Vec');
  }
  const first = vec[0];
  if (first.switch().name !== 'scvSymbol') {
    throw new Error('Expected Symbol as enum variant');
  }
  return scValToSymbol(first);
}

/**
 * Decode Tranche struct from ScVal.
 */
export function scValToTranche(scVal: StellarSdk.xdr.ScVal): {
  amount: bigint;
  milestone: string;
  released: boolean;
} {
  if (scVal.switch().name !== 'scvMap') {
    throw new Error('Expected ScVal Map for Tranche');
  }
  const map = scVal.map() ?? [];
  const result: Record<string, unknown> = {};

  for (const entry of map) {
    const key = scValToSymbol(entry.key());
    const val = entry.val();

    if (key === 'amount') {
      result.amount = scValToI128(val);
    } else if (key === 'milestone') {
      result.milestone = scValToSymbol(val);
    } else if (key === 'released') {
      result.released = scValToBool(val);
    }
  }

  return {
    amount: result.amount as bigint,
    milestone: result.milestone as string,
    released: result.released as boolean,
  };
}

/**
 * Encode Tranche to ScVal.
 */
export function trancheToScVal(tranche: {
  amount: bigint;
  milestone: string;
  released: boolean;
}): StellarSdk.xdr.ScVal {
  const entries = [
    new xdr.ScMapEntry({
      key: symbolToScVal('amount'),
      val: i128ToScVal(tranche.amount),
    }),
    new xdr.ScMapEntry({
      key: symbolToScVal('milestone'),
      val: symbolToScVal(tranche.milestone),
    }),
    new xdr.ScMapEntry({
      key: symbolToScVal('released'),
      val: boolToScVal(tranche.released),
    }),
  ];

  return xdr.ScVal.scvMap(entries);
}
