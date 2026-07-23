import { STATUS_META } from '../../lib/campaignStatus';
import type { CampaignStatusTag } from '../../lib/soroban/types';

export function StatusBadge({ status }: { status: CampaignStatusTag }) {
  const meta = STATUS_META[status];
  return (
    <span className={`status-badge ${meta.bgLight} ${meta.text}`}>
      <span className={`h-2 w-2 rounded-full ${meta.bg}`} aria-hidden="true" />
      {meta.label}
    </span>
  );
}
