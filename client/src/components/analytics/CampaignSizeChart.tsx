import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { SizeBucket } from '../../lib/analytics/metrics';
import { CHART_COLORS } from '../../lib/analytics/theme';
import { EmptyChartState } from './ChartCard';

export function CampaignSizeChart({ data }: { data: SizeBucket[] }) {
  if (data.length === 0) {
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
          dataKey="label"
          tick={{ fontSize: 11, fill: '#7d5e34' }}
          interval={0}
          angle={-20}
          textAnchor="end"
          height={56}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#7d5e34' }}
          width={32}
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value) => [String(value ?? 0), 'Campaigns']}
          labelFormatter={(label) => `Target amount: ${label}`}
          contentStyle={{ borderRadius: 8, borderColor: '#e0cfb0' }}
        />
        <Bar dataKey="count" fill={CHART_COLORS.amber} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
