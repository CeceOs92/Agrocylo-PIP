/**
 * Example: React component using the ProductionEscrow hook
 * Demonstrates wallet integration and error handling
 *
 * Note: This is an example file for demonstration purposes.
 */

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from 'react';
import { useProductionEscrow } from '../useProductionEscrow';
import { AmountFormatter, CampaignStatus } from '../types';
import type { Campaign } from '../types';

const formatter = new AmountFormatter(7); // USDC decimals

export function CampaignDashboard({ campaignId }: { campaignId: bigint }) {
  const escrow = useProductionEscrow();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');

  // Load campaign data
  const loadCampaign = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await escrow.client.getCampaign(campaignId);
    if (result.success && result.data) {
      setCampaign(result.data);
    } else {
      setError(result.error?.message || 'Failed to load campaign');
    }

    setLoading(false);
  }, [campaignId, escrow.client]);

  useEffect(() => {
    loadCampaign();
  }, [loadCampaign]);

  const handleFund = async () => {
    if (!escrow.isReady) {
      setError('Please connect your wallet');
      return;
    }

    if (!fundAmount || parseFloat(fundAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const amount = formatter.fromDecimal(fundAmount);
      const result = await escrow.fundCampaign({
        campaignId,
        amount,
      });

      if (result.success) {
        alert(`Successfully funded ${fundAmount} USDC!`);
        setFundAmount('');
        await loadCampaign();
      } else {
        setError(result.error?.message || 'Funding failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRefund = async () => {
    if (!escrow.isReady) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await escrow.claimRefund({ campaignId });

      if (result.success) {
        alert('Refund claimed successfully!');
        await loadCampaign();
      } else {
        setError(result.error?.message || 'Refund claim failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReturn = async () => {
    if (!escrow.isReady) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await escrow.claimReturn({ campaignId });

      if (result.success) {
        alert('Returns claimed successfully!');
        await loadCampaign();
      } else {
        setError(result.error?.message || 'Return claim failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: CampaignStatus) => {
    const colors: Record<CampaignStatus, string> = {
      [CampaignStatus.Active]: 'bg-blue-100 text-blue-800',
      [CampaignStatus.Funding]: 'bg-green-100 text-green-800',
      [CampaignStatus.Funded]: 'bg-purple-100 text-purple-800',
      [CampaignStatus.Harvested]: 'bg-yellow-100 text-yellow-800',
      [CampaignStatus.Disputed]: 'bg-red-100 text-red-800',
      [CampaignStatus.Resolved]: 'bg-orange-100 text-orange-800',
      [CampaignStatus.Settled]: 'bg-teal-100 text-teal-800',
      [CampaignStatus.Failed]: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const canFund =
    campaign?.status === CampaignStatus.Active ||
    campaign?.status === CampaignStatus.Funding;
  const canClaimRefund =
    campaign?.status === CampaignStatus.Resolved ||
    campaign?.status === CampaignStatus.Failed;
  const canClaimReturn = campaign?.status === CampaignStatus.Settled;

  if (loading && !campaign) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-600">Loading campaign...</div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-800">{error || 'Campaign not found'}</p>
      </div>
    );
  }

  const fundingProgress =
    campaign.targetAmount > 0n
      ? (Number(campaign.totalFunded) / Number(campaign.targetAmount)) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Campaign Header */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Campaign #{campaignId.toString()}
          </h2>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(campaign.status)}`}
          >
            {campaign.status}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Farmer</p>
            <p className="font-mono text-sm">
              {campaign.farmer.slice(0, 8)}...{campaign.farmer.slice(-4)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Harvest</p>
            <p className="text-sm">{campaign.harvestMetadata}</p>
          </div>
        </div>
      </div>

      {/* Funding Progress */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">
          Funding Progress
        </h3>

        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatter.format(campaign.totalFunded, 'USDC')}</span>
            <span>{formatter.format(campaign.targetAmount, 'USDC')}</span>
          </div>
          <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${Math.min(fundingProgress, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-center text-sm text-gray-600">
            {fundingProgress.toFixed(1)}% funded
          </p>
        </div>

        {/* Fund Campaign */}
        {canFund && escrow.isReady && (
          <div className="mt-6 space-y-3">
            <input
              type="number"
              placeholder="Amount to fund (USDC)"
              value={fundAmount}
              onChange={(e) => setFundAmount(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-2"
              disabled={loading}
              step="0.01"
              min="0"
            />
            <button
              onClick={handleFund}
              disabled={loading}
              className="w-full rounded-md bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Fund Campaign'}
            </button>
          </div>
        )}
      </div>

      {/* Financial Breakdown */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h3 className="text-lg font-semibold text-gray-900">
          Financial Breakdown
        </h3>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Funded</span>
            <span className="font-medium">
              {formatter.format(campaign.totalFunded, 'USDC')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Released</span>
            <span className="font-medium">
              {formatter.format(campaign.released, 'USDC')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Refundable</span>
            <span className="font-medium">
              {formatter.format(campaign.refundable, 'USDC')}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Returnable</span>
            <span className="font-medium">
              {formatter.format(campaign.returnable, 'USDC')}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {escrow.isReady && (
        <div className="space-y-3">
          {canClaimRefund && (
            <button
              onClick={handleClaimRefund}
              disabled={loading}
              className="w-full rounded-md bg-orange-600 px-4 py-2 font-medium text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Claim Refund'}
            </button>
          )}

          {canClaimReturn && (
            <button
              onClick={handleClaimReturn}
              disabled={loading}
              className="w-full rounded-md bg-teal-600 px-4 py-2 font-medium text-white hover:bg-teal-700 disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : 'Claim Returns'}
            </button>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Wallet Connection Required */}
      {!escrow.isReady && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            Connect your wallet to interact with this campaign
          </p>
        </div>
      )}
    </div>
  );
}
