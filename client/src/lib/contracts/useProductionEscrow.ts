import { useMemo } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ProductionEscrowClient } from './productionEscrow';
import type { ProductionEscrowConfig } from './productionEscrow';

const DEFAULT_CONFIG: ProductionEscrowConfig = {
  contractId: import.meta.env.VITE_ESCROW_CONTRACT_ID || '',
  rpcUrl:
    import.meta.env.VITE_SOROBAN_RPC_URL ||
    'https://soroban-testnet.stellar.org',
  networkPassphrase:
    import.meta.env.VITE_NETWORK_PASSPHRASE ||
    'Test SDF Network ; September 2015',
};

export function useProductionEscrow(config?: Partial<ProductionEscrowConfig>) {
  const { publicKey, signTransaction, isConnected } = useWallet();

  const client = useMemo(() => {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    return new ProductionEscrowClient(finalConfig);
  }, [config]);

  // Wrapper methods that automatically use connected wallet
  const methods = useMemo(() => {
    if (!publicKey || !isConnected) {
      return {
        client,
        isReady: false,
        publicKey: null,
      };
    }

    return {
      client,
      isReady: true,
      publicKey,

      // Write methods
      createCampaign: (params: {
        campaignId: bigint;
        targetAmount: bigint;
        tokenAddress: string;
        deadline: bigint;
        harvestMetadata: string;
      }) =>
        client.createCampaign(
          { ...params, farmer: publicKey },
          signTransaction,
        ),

      fundCampaign: (params: { campaignId: bigint; amount: bigint }) =>
        client.fundCampaign(
          { ...params, investor: publicKey },
          signTransaction,
        ),

      reportHarvest: (params: { campaignId: bigint; outcome: string }) =>
        client.reportHarvest({ ...params, farmer: publicKey }, signTransaction),

      openDispute: (params: { campaignId: bigint; reason: string }) =>
        client.openDispute({ ...params, opener: publicKey }, signTransaction),

      claimRefund: (params: { campaignId: bigint }) =>
        client.claimRefund({ ...params, investor: publicKey }, signTransaction),

      claimReturn: (params: { campaignId: bigint }) =>
        client.claimReturn({ ...params, investor: publicKey }, signTransaction),

      // Admin methods (require admin address)
      configureTranches: (params: {
        campaignId: bigint;
        tranches: Array<{
          amount: bigint;
          milestone: string;
          released: boolean;
        }>;
      }) =>
        client.configureTranches(
          { ...params, admin: publicKey },
          signTransaction,
        ),

      releaseTranche: (params: {
        campaignId: bigint;
        recipient: string;
        amount: bigint;
      }) =>
        client.releaseTranche({ ...params, admin: publicKey }, signTransaction),

      resolveDispute: (params: {
        campaignId: bigint;
        resolution: import('./types').DisputeResolution;
        payoutAmount: bigint;
      }) =>
        client.resolveDispute({ ...params, admin: publicKey }, signTransaction),

      settleCampaign: (params: {
        campaignId: bigint;
        farmer: string;
        farmerPayout: bigint;
      }) =>
        client.settleCampaign({ ...params, admin: publicKey }, signTransaction),

      markFailed: (params: { campaignId: bigint }) =>
        client.markFailed({ ...params, admin: publicKey }, signTransaction),

      // Read methods (no wallet needed)
      getCampaign: (campaignId: bigint) => client.getCampaign(campaignId),
      getDispute: (campaignId: bigint) => client.getDispute(campaignId),
      getContribution: (campaignId: bigint, investor?: string) =>
        client.getContribution(campaignId, investor || publicKey),
      getTranches: (campaignId: bigint) => client.getTranches(campaignId),
      getHarvestRecord: (campaignId: bigint) =>
        client.getHarvestRecord(campaignId),
    };
  }, [client, publicKey, isConnected, signTransaction]);

  return methods;
}
