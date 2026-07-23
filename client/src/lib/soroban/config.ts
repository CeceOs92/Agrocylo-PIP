import { Networks } from '@stellar/stellar-sdk';

export const RPC_URL = import.meta.env.VITE_SOROBAN_RPC_URL || undefined;

export const NETWORK_PASSPHRASE =
  import.meta.env.VITE_SOROBAN_NETWORK_PASSPHRASE || Networks.TESTNET;

export const ESCROW_CONTRACT_ID =
  import.meta.env.VITE_PRODUCTION_ESCROW_CONTRACT_ID || undefined;

export const REGISTRY_CONTRACT_ID =
  import.meta.env.VITE_REGISTRY_CONTRACT_ID || undefined;

export function isEscrowConfigured(): boolean {
  return Boolean(RPC_URL && ESCROW_CONTRACT_ID);
}

export function isRegistryConfigured(): boolean {
  return Boolean(RPC_URL && REGISTRY_CONTRACT_ID);
}

/** Base URL for a stellar.expert explorer link, derived from the configured network. */
export function explorerBaseUrl(): string {
  return NETWORK_PASSPHRASE === Networks.PUBLIC
    ? 'https://stellar.expert/explorer/public'
    : 'https://stellar.expert/explorer/testnet';
}

export function explorerContractUrl(contractId: string): string {
  return `${explorerBaseUrl()}/contract/${contractId}`;
}

/** Stellar accounts (G...) and contracts (C...) live at different explorer paths. */
export function explorerAddressUrl(address: string): string {
  const kind = address.startsWith('C') ? 'contract' : 'account';
  return `${explorerBaseUrl()}/${kind}/${address}`;
}

export function explorerTxUrl(hash: string): string {
  return `${explorerBaseUrl()}/tx/${hash}`;
}
