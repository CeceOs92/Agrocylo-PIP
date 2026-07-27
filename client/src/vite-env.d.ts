/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOROBAN_RPC_URL?: string;
  readonly VITE_SOROBAN_NETWORK_PASSPHRASE?: string;
  readonly VITE_PRODUCTION_ESCROW_CONTRACT_ID?: string;
  readonly VITE_REGISTRY_CONTRACT_ID?: string;
  readonly VITE_SOROBAN_EVENTS_LOOKBACK_LEDGERS?: string;
  readonly VITE_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
