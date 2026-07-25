import React, { useState } from 'react';
import { FundCampaignModal } from '../components/campaign/FundCampaignModal';
import { StatusBadge } from '../components/campaign/StatusBadge';
import { ReportHarvestModal } from '../components/campaign/ReportHarvestModal';
import { useWallet } from '../context/WalletContext';
import { useCampaign, useHarvestRecord } from '../hooks/contract';
import { isEscrowConfigured } from '../lib/soroban/config';

export interface CampaignData {
  id: string;
  title: string;
  description: string;
  totalTarget: number;
  currentRaised: number;
  status: 'Active' | 'Funding' | 'InProduction' | 'Harvested' | 'Resolved' | 'Failed' | 'Settled';
  farmer: string;
}

export const CampaignDetailPage: React.FC = () => {
  const wallet = useWallet();
  const configured = isEscrowConfigured();
  
  // For the purpose of the demo/UI, we use a mocked campaign ID if there is no URL param.
  // In a real router setup, we'd use useParams().id
  const campaignId = '1';

  const { data: realCampaign, isLoading } = useCampaign(campaignId);
  const { data: realHarvestRecord } = useHarvestRecord(campaignId);

  // Mock state fallback if not configured
  const [mockCampaign, setMockCampaign] = useState<CampaignData>({
    id: 'camp-101',
    title: 'Organic Maize Irrigation & Harvesting PIP',
    description:
      'Scaling sustainable maize production across 250 hectares with automated precision drip irrigation and AI-powered yield monitoring.',
    totalTarget: 50000,
    currentRaised: 50000,
    status: 'InProduction', // Set to InProduction so it can be harvested
    farmer: wallet.publicKey || 'GDF4...M9XZ', // Make the connected wallet the farmer for testing
  });

  const [mockHarvestOutcome, setMockHarvestOutcome] = useState<string | null>(null);

  const [isFundModalOpen, setIsFundModalOpen] = useState(false);
  const [isHarvestModalOpen, setIsHarvestModalOpen] = useState(false);

  // Use real data if configured and loaded, else fallback to mock
  const campaign = configured && realCampaign
    ? {
        id: campaignId,
        title: 'Contract Campaign', // Missing title in basic struct, but this is an example
        description: 'Details from contract',
        totalTarget: Number(realCampaign.target_amount),
        currentRaised: Number(realCampaign.total_funded),
        status: realCampaign.status.tag as CampaignData['status'],
        farmer: realCampaign.farmer,
      }
    : mockCampaign;

  const harvestOutcome = configured && realHarvestRecord
    ? realHarvestRecord.outcome
    : mockHarvestOutcome;

  const percentage = Math.min(
    100,
    Math.round((campaign.currentRaised / campaign.totalTarget) * 100),
  );

  const handleFundingSuccess = (_res: unknown, addedAmount: number) => {
    if (!configured) {
      setMockCampaign((prev) => ({
        ...prev,
        currentRaised: prev.currentRaised + addedAmount,
      }));
    }
  };

  const handleHarvestSuccess = (outcome: string) => {
    if (!configured) {
      setMockHarvestOutcome(outcome);
      setMockCampaign((prev) => ({
        ...prev,
        status: 'Harvested',
      }));
    }
  };

  const isFarmer = wallet.isConnected && wallet.publicKey === campaign.farmer;
  const canReportHarvest =
    isFarmer &&
    (campaign.status === 'InProduction' || campaign.status === 'Funded');

  if (configured && isLoading) {
    return <div className="p-6 text-center text-slate-500">Loading campaign...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <StatusBadge status={campaign.status} />
          <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
            ID: {campaign.id}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
          {campaign.title}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 mt-2">
          {campaign.description}
        </p>
        <p className="text-sm font-mono text-slate-500 mt-2">
          Farmer: {campaign.farmer}
        </p>

        {/* Progress Bar */}
        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-900 dark:text-white">
              ${campaign.currentRaised.toLocaleString()}{' '}
              <span className="font-normal text-slate-600 dark:text-slate-400">
                raised
              </span>
            </span>
            <span className="font-medium text-slate-500">
              Target: ${campaign.totalTarget.toLocaleString()} ({percentage}%)
            </span>
          </div>

          <div
            className="h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Campaign funding progress: ${percentage}% of target raised`}
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Harvest Record Display */}
        {harvestOutcome && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">
              Harvest Reported
            </h3>
            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
              <span className="font-medium">Outcome:</span> {harvestOutcome}
            </p>
            {configured && realHarvestRecord && (
              <p className="mt-1 text-xs font-mono text-emerald-600 dark:text-emerald-500">
                Ledger Seq: {realHarvestRecord.ledger_sequence} | Timestamp: {Number(realHarvestRecord.timestamp)}
              </p>
            )}
          </div>
        )}

        {/* Action CTAs */}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setIsFundModalOpen(true)}
            disabled={campaign.currentRaised >= campaign.totalTarget}
            className="rounded-xl bg-slate-100 px-6 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Fund this campaign
          </button>
          
          {canReportHarvest && (
            <button
              type="button"
              onClick={() => setIsHarvestModalOpen(true)}
              className="rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-emerald-800"
            >
              Report Harvest
            </button>
          )}
        </div>
      </div>

      <FundCampaignModal
        isOpen={isFundModalOpen}
        onClose={() => setIsFundModalOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        totalTarget={campaign.totalTarget}
        currentRaised={campaign.currentRaised}
        onSuccess={handleFundingSuccess}
      />
      
      <ReportHarvestModal
        isOpen={isHarvestModalOpen}
        onClose={() => setIsHarvestModalOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        farmer={campaign.farmer}
        onSuccess={handleHarvestSuccess}
      />
    </div>
  );
};

export default CampaignDetailPage;
