import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { StatusCount } from '../../lib/analytics/metrics';
import { STATUS_COLORS } from '../../lib/analytics/theme';
import { EmptyChartState } from './ChartCard';

export function CampaignsByStatusChart({ data }: { data: StatusCount[] }) {
  const hasData = data.some((entry) => entry.count > 0);
  if (!hasData) {
    return <EmptyChartState message="No campaigns recorded yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid
          stroke="#e0cfb0"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          dataKey="status"
          tick={{ fontSize: 11, fill: '#7d5e34' }}
          interval={0}
          angle={-25}
          textAnchor="end"
          height={56}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#7d5e34' }}
          width={32}
          allowDecimals={false}
        />
        <Tooltip contentStyle={{ borderRadius: 8, borderColor: '#e0cfb0' }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
