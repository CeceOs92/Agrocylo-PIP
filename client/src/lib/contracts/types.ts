export enum CampaignStatus {
  Active = 'Active',
  Funding = 'Funding',
  Funded = 'Funded',
  Harvested = 'Harvested',
  Disputed = 'Disputed',
  Resolved = 'Resolved',
  Settled = 'Settled',
  Failed = 'Failed',
}

export enum DisputeStatus {
  Open = 'Open',
  Resolved = 'Resolved',
}

export enum DisputeResolution {
  Pending = 'Pending',
  FullRefund = 'FullRefund',
  PartialSettlement = 'PartialSettlement',
  FullPayout = 'FullPayout',
}

export interface Campaign {
  farmer: string;
  targetAmount: bigint;
  tokenAddress: string;
  deadline: bigint;
  harvestMetadata: string;
  totalFunded: bigint;
  released: bigint;
  refundable: bigint;
  returnable: bigint;
  status: CampaignStatus;
}

export interface HarvestRecord {
  farmer: string;
  outcome: string;
  timestamp: bigint;
  ledgerSequence: number;
}

export interface Dispute {
  campaignId: bigint;
  opener: string;
  reason: string;
  timestamp: bigint;
  ledgerSequence: number;
  status: DisputeStatus;
  resolution: DisputeResolution;
}

export interface Tranche {
  amount: bigint;
  milestone: string;
  released: boolean;
}

/**
 * Result wrapper for contract operations.
 */
export interface ContractResult<T> {
  success: boolean;
  data?: T;
  error?: ContractError;
  txHash?: string;
}

/**
 * Typed error from contract execution.
 */
export class ContractError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ContractError';
  }

  static fromRaw(error: unknown): ContractError {
    if (error instanceof ContractError) {
      return error;
    }

    if (error instanceof Error) {
      const message = error.message.toLowerCase();

      // Map common contract panic messages to typed errors
      if (message.includes('campaign not accepting contributions')) {
        return new ContractError(
          'Campaign is not accepting contributions',
          'CAMPAIGN_NOT_ACCEPTING',
          error,
        );
      }
      if (message.includes('campaign already exists')) {
        return new ContractError(
          'Campaign already exists',
          'CAMPAIGN_EXISTS',
          error,
        );
      }
      if (message.includes('campaign not found')) {
        return new ContractError(
          'Campaign not found',
          'CAMPAIGN_NOT_FOUND',
          error,
        );
      }
      if (message.includes('not authorized')) {
        return new ContractError('Not authorized', 'UNAUTHORIZED', error);
      }
      if (message.includes('campaign not funded')) {
        return new ContractError('Campaign not funded', 'NOT_FUNDED', error);
      }
      if (message.includes('campaign not harvested')) {
        return new ContractError(
          'Campaign not harvested',
          'NOT_HARVESTED',
          error,
        );
      }
      if (message.includes('campaign not disputed')) {
        return new ContractError(
          'Campaign not disputed',
          'NOT_DISPUTED',
          error,
        );
      }
      if (message.includes('campaign not settled')) {
        return new ContractError('Campaign not settled', 'NOT_SETTLED', error);
      }
      if (message.includes('nothing to refund')) {
        return new ContractError(
          'Nothing to refund',
          'NOTHING_TO_REFUND',
          error,
        );
      }
      if (message.includes('nothing to return')) {
        return new ContractError(
          'Nothing to return',
          'NOTHING_TO_RETURN',
          error,
        );
      }
      if (message.includes('contribution exceeds remaining target')) {
        return new ContractError(
          'Contribution exceeds remaining target',
          'EXCEEDS_TARGET',
          error,
        );
      }
      if (message.includes('amount exceeds escrow balance')) {
        return new ContractError(
          'Amount exceeds escrow balance',
          'EXCEEDS_BALANCE',
          error,
        );
      }
      if (message.includes('user declined')) {
        return new ContractError(
          'Transaction rejected by user',
          'USER_REJECTED',
          error,
        );
      }

      return new ContractError(error.message, 'UNKNOWN_ERROR', error);
    }

    return new ContractError(String(error), 'UNKNOWN_ERROR', error);
  }
}

/**
 * Amount formatting utilities for token decimals.
 */
export class AmountFormatter {
  constructor(private readonly decimals: number = 7) {}

  /**
   * Convert stroops (contract i128) to decimal display string.
   * @param stroops Amount in smallest unit (bigint)
   * @returns Formatted decimal string
   */
  toDecimal(stroops: bigint): string {
    const divisor = BigInt(10 ** this.decimals);
    const whole = stroops / divisor;
    const fraction = stroops % divisor;

    if (fraction === 0n) {
      return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(this.decimals, '0');
    const trimmed = fractionStr.replace(/0+$/, '');
    return `${whole}.${trimmed}`;
  }

  /**
   * Convert decimal string to stroops (contract i128).
   * @param decimal Decimal string (e.g., "123.45")
   * @returns Amount in smallest unit (bigint)
   */
  fromDecimal(decimal: string): bigint {
    const [whole, fraction = ''] = decimal.split('.');
    const paddedFraction = fraction.padEnd(this.decimals, '0');

    if (paddedFraction.length > this.decimals) {
      throw new Error(`Decimal precision exceeds ${this.decimals} places`);
    }

    const wholeBig = BigInt(whole || 0);
    const fractionBig = BigInt(paddedFraction);
    const multiplier = BigInt(10 ** this.decimals);

    return wholeBig * multiplier + fractionBig;
  }

  format(stroops: bigint, symbol: string = ''): string {
    const decimal = this.toDecimal(stroops);
    return symbol ? `${decimal} ${symbol}` : decimal;
  }
}
