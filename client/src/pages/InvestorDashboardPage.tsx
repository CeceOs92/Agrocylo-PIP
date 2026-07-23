import React, { useState } from 'react';
import {
  getInvestorPortfolio,
  calculatePortfolioStats,
  claimRefund,
  claimReturn,
  type FundedInvestment,
} from '../lib/soroban/investorService';
import { InvestorSummaryStats } from '../components/investor/InvestorSummaryStats';
import { InvestmentCard } from '../components/investor/InvestmentCard';

export const InvestorDashboardPage: React.FC = () => {
  const [walletAddress] = useState<string>('GDF4...M9XZ');
  const [investments, setInvestments] = useState<FundedInvestment[]>(() =>
    getInvestorPortfolio(walletAddress),
  );
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
    txHash?: string;
  } | null>(null);

  const stats = calculatePortfolioStats(investments);

  const handleClaimRefund = async (campaignId: string) => {
    setNotification(null);
    const res = await claimRefund(campaignId, walletAddress);

    if (!res.success) {
      setNotification({
        type: 'error',
        message: res.error || 'Failed to claim refund',
      });
    } else {
      setInvestments((prev) =>
        prev.map((inv) =>
          inv.campaignId === campaignId ? { ...inv, claimed: true } : inv,
        ),
      );
      setNotification({
        type: 'success',
        message: `Successfully claimed refund of $${res.claimedAmount?.toLocaleString()}!`,
        txHash: res.txHash,
      });
    }
  };

  const handleClaimReturn = async (campaignId: string) => {
    setNotification(null);
    const res = await claimReturn(campaignId, walletAddress);

    if (!res.success) {
      setNotification({
        type: 'error',
        message: res.error || 'Failed to claim return',
      });
    } else {
      setInvestments((prev) =>
        prev.map((inv) =>
          inv.campaignId === campaignId ? { ...inv, claimed: true } : inv,
        ),
      );
      setNotification({
        type: 'success',
        message: `Successfully claimed return payout of $${res.claimedAmount?.toLocaleString()}!`,
        txHash: res.txHash,
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Investor Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Track funded campaigns, claimable returns, and pro-rata refunds.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Connected: {walletAddress}</span>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border text-sm flex flex-col md:flex-row md:items-center justify-between gap-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          <span>{notification.message}</span>
          {notification.txHash && (
            <span className="font-mono text-xs opacity-80 break-all">
              Tx: {notification.txHash}
            </span>
          )}
        </div>
      )}

      {/* Summary Metrics */}
      <InvestorSummaryStats stats={stats} totalCampaigns={investments.length} />

      {/* Investments List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Your Contributions ({investments.length})
        </h2>

        {investments.length === 0 ? (
          /* Empty State */
          <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl font-bold">
              📂
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              No Funded Investments Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              You haven&apos;t contributed to any PIP campaigns yet. Browse
              active campaigns to start investing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((inv) => (
              <InvestmentCard
                key={inv.campaignId}
                investment={inv}
                onClaimRefund={handleClaimRefund}
                onClaimReturn={handleClaimReturn}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvestorDashboardPage;
