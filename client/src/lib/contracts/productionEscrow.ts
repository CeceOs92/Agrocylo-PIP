import * as StellarSdk from '@stellar/stellar-sdk';
import { rpc } from '@stellar/stellar-sdk';
import type {
  Campaign,
  CampaignStatus,
  ContractResult,
  Dispute,
  DisputeResolution,
  HarvestRecord,
  Tranche,
} from './types';
import { ContractError } from './types';
import * as scval from './scval';

const { Contract, TransactionBuilder, Operation } = StellarSdk;

export interface ProductionEscrowConfig {
  contractId: string;
  rpcUrl: string;
  networkPassphrase: string;
}

export interface TransactionSigner {
  (xdr: string): Promise<string>;
}

/**
 * Main client for interacting with ProductionEscrowContract.
 */
export class ProductionEscrowClient {
  private readonly contract: StellarSdk.Contract;
  private readonly server: rpc.Server;
  private readonly networkPassphrase: string;

  constructor(config: ProductionEscrowConfig) {
    this.contract = new Contract(config.contractId);
    this.server = new rpc.Server(config.rpcUrl);
    this.networkPassphrase = config.networkPassphrase;
  }

  /**
   * Build and submit a contract transaction.
   */
  private async buildAndSubmit<T>(
    method: string,
    args: StellarSdk.xdr.ScVal[],
    sourceAccount: string,
    signer: TransactionSigner,
    parser?: (result: StellarSdk.xdr.ScVal) => T,
  ): Promise<ContractResult<T>> {
    try {
      // Load account
      const account = await this.server.getAccount(sourceAccount);

      // Build operation
      const operation = Operation.invokeContractFunction({
        contract: this.contract.address().toString(),
        function: method,
        args,
      });

      // Build transaction
      const txBuilder = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(300);

      const preparedTx = txBuilder.build();

      // Simulate to get resource fees
      const simulated = await this.server.simulateTransaction(preparedTx);

      if (rpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      if (!simulated.result) {
        throw new Error('Simulation returned no result');
      }

      // Assemble the transaction with simulation results
      const assembledTx = rpc
        .assembleTransaction(preparedTx, simulated)
        .build();

      // Sign transaction
      const signedXdr = await signer(assembledTx.toXDR());
      const signedTx = TransactionBuilder.fromXDR(
        signedXdr,
        this.networkPassphrase,
      );

      // Submit transaction
      const sendResult = await this.server.sendTransaction(signedTx);

      if (sendResult.status === 'ERROR') {
        throw new Error(
          `Transaction failed: ${sendResult.errorResult?.toXDR('base64')}`,
        );
      }

      // Poll for result
      let getResult = await this.server.getTransaction(sendResult.hash);
      let attempts = 0;
      const maxAttempts = 30;

      while (
        getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND &&
        attempts < maxAttempts
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        getResult = await this.server.getTransaction(sendResult.hash);
        attempts++;
      }

      if (getResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
        throw new Error('Transaction not found after polling');
      }

      if (getResult.status === rpc.Api.GetTransactionStatus.FAILED) {
        throw new Error(
          `Transaction failed: ${getResult.resultXdr?.toXDR('base64')}`,
        );
      }

      // Parse return value
      let data: T | undefined;
      if (parser && getResult.resultMetaXdr) {
        const meta = getResult.resultMetaXdr;
        const returnValue = meta.v3()?.sorobanMeta()?.returnValue();
        if (returnValue) {
          data = parser(returnValue);
        }
      }

      return {
        success: true,
        data,
        txHash: sendResult.hash,
      };
    } catch (error) {
      return {
        success: false,
        error: ContractError.fromRaw(error),
      };
    }
  }

  /**
   * Read-only contract call (view function).
   */
  private async simulate<T>(
    method: string,
    args: StellarSdk.xdr.ScVal[],
    parser: (result: StellarSdk.xdr.ScVal) => T,
  ): Promise<ContractResult<T>> {
    try {
      // Use a dummy source for simulation
      const dummySource =
        'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
      const account = new StellarSdk.Account(dummySource, '0');

      const operation = Operation.invokeContractFunction({
        contract: this.contract.address().toString(),
        function: method,
        args,
      });

      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(0)
        .build();

      const simulated = await this.server.simulateTransaction(tx);

      if (rpc.Api.isSimulationError(simulated)) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      if (!simulated.result) {
        throw new Error('Simulation returned no result');
      }

      const data = parser(simulated.result.retval);

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: ContractError.fromRaw(error),
      };
    }
  }

  // ==================== Write Methods ====================

  /**
   * Initialize the contract with an admin address.
   */
  async initialize(
    admin: string,
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [scval.addressToScVal(admin)];
    return this.buildAndSubmit('initialize', args, admin, signer);
  }

  /**
   * Create a new campaign.
   */
  async createCampaign(
    params: {
      campaignId: bigint;
      farmer: string;
      targetAmount: bigint;
      tokenAddress: string;
      deadline: bigint;
      harvestMetadata: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.farmer),
      scval.i128ToScVal(params.targetAmount),
      scval.addressToScVal(params.tokenAddress),
      scval.u64ToScVal(params.deadline),
      scval.symbolToScVal(params.harvestMetadata),
    ];
    return this.buildAndSubmit('create_campaign', args, params.farmer, signer);
  }

  /**
   * Fund a campaign (investor contributes tokens).
   */
  async fundCampaign(
    params: {
      campaignId: bigint;
      investor: string;
      amount: bigint;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.investor),
      scval.i128ToScVal(params.amount),
    ];
    return this.buildAndSubmit('fund_campaign', args, params.investor, signer);
  }

  /**
   * Configure tranches for a funded campaign (admin only).
   */
  async configureTranches(
    params: {
      campaignId: bigint;
      tranches: Array<{
        amount: bigint;
        milestone: string;
        released: boolean;
      }>;
      admin: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const tranchesScVal = scval.vecToScVal(
      params.tranches.map((t) => scval.trancheToScVal(t)),
    );
    const args = [scval.u64ToScVal(params.campaignId), tranchesScVal];
    return this.buildAndSubmit(
      'configure_tranches',
      args,
      params.admin,
      signer,
    );
  }

  /**
   * Release a tranche to the farmer (admin only).
   */
  async releaseTranche(
    params: {
      campaignId: bigint;
      recipient: string;
      amount: bigint;
      admin: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.recipient),
      scval.i128ToScVal(params.amount),
    ];
    return this.buildAndSubmit('release_tranche', args, params.admin, signer);
  }

  /**
   * Farmer reports harvest outcome.
   */
  async reportHarvest(
    params: {
      campaignId: bigint;
      farmer: string;
      outcome: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.farmer),
      scval.symbolToScVal(params.outcome),
    ];
    return this.buildAndSubmit('report_harvest', args, params.farmer, signer);
  }

  /**
   * Open a dispute on a campaign.
   */
  async openDispute(
    params: {
      campaignId: bigint;
      opener: string;
      reason: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.opener),
      scval.symbolToScVal(params.reason),
    ];
    return this.buildAndSubmit('open_dispute', args, params.opener, signer);
  }

  /**
   * Resolve a dispute (admin only).
   */
  async resolveDispute(
    params: {
      campaignId: bigint;
      resolution: DisputeResolution;
      payoutAmount: bigint;
      admin: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    // Encode resolution enum as Vec with Symbol variant
    const resolutionScVal = scval.vecToScVal([
      scval.symbolToScVal(params.resolution),
    ]);

    const args = [
      scval.u64ToScVal(params.campaignId),
      resolutionScVal,
      scval.i128ToScVal(params.payoutAmount),
    ];
    return this.buildAndSubmit('resolve_dispute', args, params.admin, signer);
  }

  /**
   * Investor claims refund from resolved or failed campaign.
   */
  async claimRefund(
    params: {
      campaignId: bigint;
      investor: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.investor),
    ];
    return this.buildAndSubmit('claim_refund', args, params.investor, signer);
  }

  /**
   * Settle a harvested campaign (admin only).
   */
  async settleCampaign(
    params: {
      campaignId: bigint;
      farmer: string;
      farmerPayout: bigint;
      admin: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.farmer),
      scval.i128ToScVal(params.farmerPayout),
    ];
    return this.buildAndSubmit('settle_campaign', args, params.admin, signer);
  }

  /**
   * Mark campaign as failed (admin only).
   */
  async markFailed(
    params: {
      campaignId: bigint;
      admin: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [scval.u64ToScVal(params.campaignId)];
    return this.buildAndSubmit('mark_failed', args, params.admin, signer);
  }

  /**
   * Investor claims returns from settled campaign.
   */
  async claimReturn(
    params: {
      campaignId: bigint;
      investor: string;
    },
    signer: TransactionSigner,
  ): Promise<ContractResult<void>> {
    const args = [
      scval.u64ToScVal(params.campaignId),
      scval.addressToScVal(params.investor),
    ];
    return this.buildAndSubmit('claim_return', args, params.investor, signer);
  }

  // ==================== Read Methods ====================

  /**
   * Get campaign details.
   */
  async getCampaign(campaignId: bigint): Promise<ContractResult<Campaign>> {
    const args = [scval.u64ToScVal(campaignId)];
    return this.simulate('get_campaign', args, (result) => {
      const map = result.map() ?? [];
      const campaign: Record<string, unknown> = {};

      for (const entry of map) {
        const key = scval.scValToSymbol(entry.key());
        const val = entry.val();

        switch (key) {
          case 'farmer':
            campaign.farmer = scval.scValToAddress(val);
            break;
          case 'target_amount':
            campaign.targetAmount = scval.scValToI128(val);
            break;
          case 'token_address':
            campaign.tokenAddress = scval.scValToAddress(val);
            break;
          case 'deadline':
            campaign.deadline = scval.scValToU64(val);
            break;
          case 'harvest_metadata':
            campaign.harvestMetadata = scval.scValToSymbol(val);
            break;
          case 'total_funded':
            campaign.totalFunded = scval.scValToI128(val);
            break;
          case 'released':
            campaign.released = scval.scValToI128(val);
            break;
          case 'refundable':
            campaign.refundable = scval.scValToI128(val);
            break;
          case 'returnable':
            campaign.returnable = scval.scValToI128(val);
            break;
          case 'status':
            campaign.status = scval.scValToEnum(val) as CampaignStatus;
            break;
        }
      }

      return campaign as Campaign;
    });
  }

  /**
   * Get dispute details.
   */
  async getDispute(campaignId: bigint): Promise<ContractResult<Dispute>> {
    const args = [scval.u64ToScVal(campaignId)];
    return this.simulate('get_dispute', args, (result) => {
      const map = result.map() ?? [];
      const dispute: Record<string, unknown> = {};

      for (const entry of map) {
        const key = scval.scValToSymbol(entry.key());
        const val = entry.val();

        switch (key) {
          case 'campaign_id':
            dispute.campaignId = scval.scValToU64(val);
            break;
          case 'opener':
            dispute.opener = scval.scValToAddress(val);
            break;
          case 'reason':
            dispute.reason = scval.scValToSymbol(val);
            break;
          case 'timestamp':
            dispute.timestamp = scval.scValToU64(val);
            break;
          case 'ledger_sequence':
            dispute.ledgerSequence = Number(scval.scValToU64(val));
            break;
          case 'status':
            dispute.status = scval.scValToEnum(val);
            break;
          case 'resolution':
            dispute.resolution = scval.scValToEnum(val);
            break;
        }
      }

      return dispute as Dispute;
    });
  }

  /**
   * Get investor contribution amount.
   */
  async getContribution(
    campaignId: bigint,
    investor: string,
  ): Promise<ContractResult<bigint>> {
    const args = [scval.u64ToScVal(campaignId), scval.addressToScVal(investor)];
    return this.simulate('get_contribution', args, (result) =>
      scval.scValToI128(result),
    );
  }

  /**
   * Get campaign tranches.
   */
  async getTranches(campaignId: bigint): Promise<ContractResult<Tranche[]>> {
    const args = [scval.u64ToScVal(campaignId)];
    return this.simulate('get_tranches', args, (result) => {
      const vec = scval.scValToVec(result);
      return vec.map((item) => {
        const tranche = scval.scValToTranche(item);
        return {
          amount: tranche.amount,
          milestone: tranche.milestone,
          released: tranche.released,
        };
      });
    });
  }

  /**
   * Get harvest record.
   */
  async getHarvestRecord(
    campaignId: bigint,
  ): Promise<ContractResult<HarvestRecord>> {
    const args = [scval.u64ToScVal(campaignId)];
    return this.simulate('get_harvest_record', args, (result) => {
      const map = result.map() ?? [];
      const record: Record<string, unknown> = {};

      for (const entry of map) {
        const key = scval.scValToSymbol(entry.key());
        const val = entry.val();

        switch (key) {
          case 'farmer':
            record.farmer = scval.scValToAddress(val);
            break;
          case 'outcome':
            record.outcome = scval.scValToSymbol(val);
            break;
          case 'timestamp':
            record.timestamp = scval.scValToU64(val);
            break;
          case 'ledger_sequence':
            record.ledgerSequence = Number(scval.scValToU64(val));
            break;
        }
      }

      return record as HarvestRecord;
    });
  }
}
