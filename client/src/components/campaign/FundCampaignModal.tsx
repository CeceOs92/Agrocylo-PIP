import React, { useState } from 'react';
import {
  validateContribution,
  calculateOwnershipShare,
  fundCampaign,
  type FundCampaignResult,
} from '../../lib/soroban/campaignService';

export interface FundCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  totalTarget: number;
  currentRaised: number;
  walletAddress?: string;
  onSuccess?: (result: FundCampaignResult, addedAmount: number) => void;
}

export const FundCampaignModal: React.FC<FundCampaignModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  totalTarget,
  currentRaised,
  walletAddress = 'GDF4...M9XZ',
  onSuccess,
}) => {
  const remainingTarget = Math.max(0, totalTarget - currentRaised);

  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<FundCampaignResult | null>(
    null,
  );

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const estimatedShare = calculateOwnershipShare(numAmount, totalTarget);

  const handlePercentageSelect = (percentage: number) => {
    const calculated = Math.round((remainingTarget * percentage) / 100);
    setAmount(calculated.toString());
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateContribution(numAmount, remainingTarget);
    if (!validation.valid) {
      setError(validation.error || 'Invalid contribution amount');
      return;
    }

    setLoading(true);
    try {
      const res = await fundCampaign(
        { campaignId, amount: numAmount, walletAddress },
        currentRaised,
        totalTarget,
      );

      if (!res.success) {
        setError(res.error || 'Failed to fund campaign');
      } else {
        setSuccessResult(res);
        if (onSuccess) {
          onSuccess(res, numAmount);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setAmount('');
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Fund Campaign
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {campaignTitle}
            </p>
          </div>
          <button
            onClick={resetAndClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Success View */}
        {successResult ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Contribution Successful!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              You contributed{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                ${numAmount.toLocaleString()}
              </span>{' '}
              to {campaignTitle}.
            </p>

            {successResult.txHash && (
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 text-left">
                <span className="text-xs text-slate-400 font-mono block">
                  Transaction Hash
                </span>
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all">
                  {successResult.txHash}
                </span>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={resetAndClose}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Input Form View */
          <form onSubmit={handleSubmit} className="py-4 space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Remaining Target
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  ${remainingTarget.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Est. Share
                </span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {estimatedShare}%
                </span>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Input field */}
            <div>
              <label
                htmlFor="contribution-amount"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Contribution Amount (USDC)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                  $
                </span>
                <input
                  id="contribution-amount"
                  type="number"
                  min="1"
                  max={remainingTarget}
                  step="any"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. 500"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                />
              </div>
            </div>

            {/* Quick selectors */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Quick fill:</span>
              {[25, 50, 100].map((pct) => (
                <button
                  type="button"
                  key={pct}
                  onClick={() => handlePercentageSelect(pct)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetAndClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || remainingTarget <= 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold shadow-sm transition"
              >
                {loading ? 'Confirming...' : 'Confirm Contribution'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
