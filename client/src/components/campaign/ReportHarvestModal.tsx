import React, { useState } from 'react';
import { Modal } from '../ui/Modal/Modal';
import { useReportHarvest } from '../../hooks/contract/useEscrowMutations';

export interface ReportHarvestModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  farmer: string;
  onSuccess?: (outcome: string) => void;
}

export const ReportHarvestModal: React.FC<ReportHarvestModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  campaignTitle,
  farmer,
  onSuccess,
}) => {
  const [outcome, setOutcome] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const reportHarvestMutation = useReportHarvest();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!outcome.trim()) {
      setError('Please provide an outcome description or metadata symbol.');
      return;
    }

    try {
      await reportHarvestMutation.mutateAsync({
        campaignId,
        farmer,
        outcome: outcome.trim(),
      });
      setSuccess(true);
      if (onSuccess) {
        onSuccess(outcome.trim());
      }
    } catch (err) {
      setError((err as Error).message || 'Failed to report harvest');
    }
  };

  const resetAndClose = () => {
    setOutcome('');
    setError(null);
    setSuccess(false);
    reportHarvestMutation.reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={
        <>
          Report Harvest
          <span className="mt-1 block text-sm font-normal text-slate-500 dark:text-slate-400">
            {campaignTitle}
          </span>
        </>
      }
      size="md"
    >
      {/* Success View */}
      {success ? (
        <div className="space-y-4 py-2 text-center">
          <div
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
            aria-hidden="true"
          >
            ✓
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Harvest Reported!
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The harvest outcome for {campaignTitle} has been successfully recorded.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={resetAndClose}
              className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-medium text-white transition hover:bg-emerald-800"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Input Form View */
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div
              id="report-harvest-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {/* Input field */}
          <div>
            <label
              htmlFor="harvest-outcome"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Outcome Description or Metadata Symbol
            </label>
            <div className="relative">
              <textarea
                id="harvest-outcome"
                value={outcome}
                onChange={(e) => {
                  setOutcome(e.target.value);
                  setError(null);
                }}
                placeholder="e.g. 50 tons of organic maize harvested"
                rows={4}
                aria-invalid={!!error}
                aria-describedby={error ? 'report-harvest-error' : undefined}
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900 outline-none transition focus:border-transparent focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <button
              type="button"
              onClick={resetAndClose}
              className="rounded-xl border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportHarvestMutation.isPending || !outcome.trim()}
              className="rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:opacity-50"
            >
              {reportHarvestMutation.isPending ? 'Reporting...' : 'Report Harvest'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
