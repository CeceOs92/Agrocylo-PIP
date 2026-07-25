import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useWallet } from '../context/WalletContext';
import { StatusBadge } from '../components/campaign/StatusBadge';
import { ReportHarvestModal } from '../components/campaign/ReportHarvestModal';

const cardClass =
  'rounded-campaign border border-soil-200 bg-white p-6 shadow-campaign sm:p-8';

// Mock data for the dashboard
const MOCK_CAMPAIGNS = [
  {
    id: '1',
    title: 'Organic Maize Irrigation & Harvesting PIP',
    totalTarget: 50000,
    currentRaised: 50000,
    status: 'InProduction' as const,
    farmer: 'GDF4...M9XZ',
  },
  {
    id: '2',
    title: 'Solar-Powered Drip Irrigation System',
    totalTarget: 25000,
    currentRaised: 10000,
    status: 'Funding' as const,
    farmer: 'GDF4...M9XZ',
  },
];

export function FarmerDashboardPage() {
  const wallet = useWallet();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [harvestOutcomes, setHarvestOutcomes] = useState<Record<string, string>>({});
  const [campaignStatuses, setCampaignStatuses] = useState<Record<string, string>>({});

  // Use connected wallet or fallback to the mock farmer ID
  const currentFarmerId = wallet.publicKey || 'GDF4...M9XZ';
  
  const myCampaigns = MOCK_CAMPAIGNS.map(camp => ({
    ...camp,
    status: campaignStatuses[camp.id] || camp.status,
  })).filter(camp => camp.farmer === currentFarmerId || !wallet.isConnected); // show mock if not connected

  const handleHarvestSuccess = (campaignId: string, outcome: string) => {
    setHarvestOutcomes(prev => ({ ...prev, [campaignId]: outcome }));
    setCampaignStatuses(prev => ({ ...prev, [campaignId]: 'Harvested' }));
  };

  const selectedCampaign = myCampaigns.find(c => c.id === selectedCampaignId);

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <Header />

      <div className="mb-8 mt-6">
        <Link
          to="/"
          className="text-body-sm font-semibold text-leaf-700 hover:text-leaf-800"
        >
          ← Back
        </Link>
        <p className="mt-4 text-label text-leaf-700">Dashboard</p>
        <h1 className="mt-1 text-soil-950">Farmer dashboard</h1>
        <p className="mt-2 text-body-sm text-soil-500">
          Manage your campaigns, report milestones, and track funding from one place.
        </p>
      </div>

      <div className="space-y-6">
        {myCampaigns.length === 0 ? (
          <div className={cardClass}>
            <p className="text-body-sm text-soil-500">You don't have any active campaigns.</p>
          </div>
        ) : (
          myCampaigns.map(campaign => {
            const percentage = Math.min(100, Math.round((campaign.currentRaised / campaign.totalTarget) * 100));
            const canReportHarvest = campaign.status === 'InProduction' || campaign.status === 'Funded';
            const reportedOutcome = harvestOutcomes[campaign.id];

            return (
              <div key={campaign.id} className={cardClass}>
                <div className="flex items-center justify-between">
                  <StatusBadge status={campaign.status as any} />
                  <span className="text-sm font-mono text-slate-600 dark:text-slate-400">
                    ID: {campaign.id}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mt-3 mb-2">{campaign.title}</h3>
                
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-900">
                    ${campaign.currentRaised.toLocaleString()}{' '}
                    <span className="font-normal text-slate-600">raised</span>
                  </span>
                  <span className="font-medium text-slate-500">
                    Target: ${campaign.totalTarget.toLocaleString()} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-4">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                
                {reportedOutcome && (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <span className="font-semibold">Harvest Reported:</span> {reportedOutcome}
                  </div>
                )}

                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                  <Link
                    to={`/campaign/${campaign.id}`}
                    className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    View Details
                  </Link>
                  {canReportHarvest && (
                    <button
                      type="button"
                      onClick={() => setSelectedCampaignId(campaign.id)}
                      className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white transition hover:bg-emerald-800"
                    >
                      Report Harvest
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedCampaign && (
        <ReportHarvestModal
          isOpen={!!selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
          campaignId={selectedCampaign.id}
          campaignTitle={selectedCampaign.title}
          farmer={selectedCampaign.farmer}
          onSuccess={(outcome) => handleHarvestSuccess(selectedCampaign.id, outcome)}
        />
      )}
    </section>
  );
}
