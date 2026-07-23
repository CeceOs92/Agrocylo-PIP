import React, { useState } from 'react';
import { FundCampaignModal } from '../components/campaign/FundCampaignModal';

export interface CampaignData {
  id: string;
  title: string;
  description: string;
  totalTarget: number;
  currentRaised: number;
  status: 'Active' | 'Funding' | 'Resolved' | 'Failed' | 'Settled';
}

export const CampaignDetailPage: React.FC = () => {
  const [campaign, setCampaign] = useState<CampaignData>({
    id: 'camp-101',
    title: 'Organic Maize Irrigation & Harvesting PIP',
    description:
      'Scaling sustainable maize production across 250 hectares with automated precision drip irrigation and AI-powered yield monitoring.',
    totalTarget: 50000,
    currentRaised: 32500,
    status: 'Funding',
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  const percentage = Math.min(
    100,
    Math.round((campaign.currentRaised / campaign.totalTarget) * 100),
  );

  const handleFundingSuccess = (_res: unknown, addedAmount: number) => {
    setCampaign((prev) => ({
      ...prev,
      currentRaised: prev.currentRaised + addedAmount,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {campaign.status}
          </span>
          <span className="text-sm font-mono text-slate-400">
            ID: {campaign.id}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
          {campaign.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          {campaign.description}
        </p>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
              ${campaign.currentRaised.toLocaleString()}{' '}
              <span className="text-slate-400 font-normal">raised</span>
            </span>
            <span className="text-slate-500 font-medium">
              Target: ${campaign.totalTarget.toLocaleString()} ({percentage}%)
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Fund Action CTA */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={campaign.currentRaised >= campaign.totalTarget}
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold shadow-md transition"
          >
            Fund this campaign
          </button>
        </div>
      </div>

      <FundCampaignModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        totalTarget={campaign.totalTarget}
        currentRaised={campaign.currentRaised}
        onSuccess={handleFundingSuccess}
      />
    </div>
  );
};

export default CampaignDetailPage;
