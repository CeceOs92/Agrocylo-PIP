import { contract } from '@stellar/stellar-sdk';
import type { SignTransaction } from '@stellar/stellar-sdk/contract';
import {
  ESCROW_CONTRACT_ID,
  NETWORK_PASSPHRASE,
  REGISTRY_CONTRACT_ID,
  RPC_URL,
  isEscrowConfigured,
  isRegistryConfigured,
} from './config';

/**
 * Generic (non-codegen) Soroban contract clients. `contract.Client.from`
 * fetches the deployed contract's WASM once to derive its call spec, then
 * exposes every contract method as a same-named async method that returns an
 * `AssembledTransaction`. Read-only calls resolve `.result` right away (via
 * simulation); mutations are signed and submitted with `.signAndSend()`.
 *
 * Clients are memoized per contract id so repeated hook calls/mutations
 * don't re-fetch the contract WASM on every invocation.
 */
let escrowClientPromise: Promise<contract.Client> | null = null;
let registryClientPromise: Promise<contract.Client> | null = null;

export function getEscrowClient(): Promise<contract.Client> {
  if (!isEscrowConfigured()) {
    return Promise.reject(
      new Error(
        'ProductionEscrowContract is not configured. Set VITE_SOROBAN_RPC_URL and VITE_PRODUCTION_ESCROW_CONTRACT_ID.',
      ),
    );
  }
  if (!escrowClientPromise) {
    escrowClientPromise = contract.Client.from({
      contractId: ESCROW_CONTRACT_ID!,
      rpcUrl: RPC_URL!,
      networkPassphrase: NETWORK_PASSPHRASE,
    }).catch((err: unknown) => {
      escrowClientPromise = null;
      throw err;
    });
  }
  return escrowClientPromise;
}

export function getRegistryClient(): Promise<contract.Client> {
  if (!isRegistryConfigured()) {
    return Promise.reject(
      new Error(
        'RegistryContract is not configured. Set VITE_SOROBAN_RPC_URL and VITE_REGISTRY_CONTRACT_ID.',
      ),
    );
  }
  if (!registryClientPromise) {
    registryClientPromise = contract.Client.from({
      contractId: REGISTRY_CONTRACT_ID!,
      rpcUrl: RPC_URL!,
      networkPassphrase: NETWORK_PASSPHRASE,
    }).catch((err: unknown) => {
      registryClientPromise = null;
      throw err;
    });
  }
  return registryClientPromise;
}

export type ContractCall<T = unknown> = (
  args?: Record<string, unknown>,
  options?: Record<string, unknown>,
) => Promise<contract.AssembledTransaction<T>>;

/**
 * `contract.Client` attaches one method per contract function at
 * construction time (see node_modules/@stellar/stellar-sdk .../contract/client.js),
 * so TypeScript can't see them statically. This looks a method up by its
 * on-chain name (e.g. "get_campaign", "fund_campaign").
 */
export function contractMethod<T = unknown>(
  client: contract.Client,
  method: string,
): ContractCall<T> {
  const fn = (client as unknown as Record<string, unknown>)[method];
  if (typeof fn !== 'function') {
    throw new Error(`Contract method "${method}" is not available.`);
  }
  return (fn as ContractCall<T>).bind(client);
}

/** Adapts WalletContext's `signTransaction(xdr)` to the shape `contract.Client` expects. */
export function createWalletSigner(
  walletSignTransaction: (xdr: string) => Promise<string>,
): SignTransaction {
  return async (xdr: string) => {
    const signedTxXdr = await walletSignTransaction(xdr);
    return { signedTxXdr };
  };
}

export interface ContractWallet {
  publicKey: string | null;
  signTransaction: (xdr: string) => Promise<string>;
}

/**
 * Calls a write (state-changing) contract method by name: builds the
 * transaction, signs it with the connected wallet, submits it, and waits for
 * the network to confirm it. Used by the mutation hooks in
 * hooks/contract/useEscrowMutations.ts and useRegistryMutations.ts.
 */
export async function invokeContractWrite<T = unknown>(
  clientPromise: Promise<contract.Client>,
  method: string,
  args: Record<string, unknown> | undefined,
  wallet: ContractWallet,
): Promise<T> {
  if (!wallet.publicKey) {
    throw new Error('Connect your wallet to continue.');
  }
  const client = await clientPromise;
  const call = contractMethod<T>(client, method);
  const signTransaction = createWalletSigner(wallet.signTransaction);
  const assembled = await call(args, {
    publicKey: wallet.publicKey,
    signTransaction,
  });
  const sent = await assembled.signAndSend({ signTransaction });
  return sent.result;
}

/** Extracts a readable message from a thrown AssembledTransaction/host or RPC error. */
export function describeContractError(err: unknown): string {
  if (err instanceof Error) {
    // Host panics surface as "HostError: ... Error(Contract, #N)" plus a long
    // diagnostic dump; the first line is the useful part.
    return err.message.split('\n')[0];
  }
  // Soroban RPC client methods (e.g. getContractWasmByContractId) reject with
  // a plain `{ code, message }` object rather than an Error instance.
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message.split('\n')[0];
  }
  return 'An unknown error occurred while talking to the Soroban network.';
}
