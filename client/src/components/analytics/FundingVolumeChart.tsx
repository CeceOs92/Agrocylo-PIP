import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { FundingVolumePoint } from '../../lib/analytics/metrics';
import { CHART_COLORS } from '../../lib/analytics/theme';
import { EmptyChartState } from './ChartCard';

export function FundingVolumeChart({ data }: { data: FundingVolumePoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyChartState message="No contributions recorded yet for this window." />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="fundingVolumeFill" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={CHART_COLORS.leaf}
              stopOpacity={0.35}
            />
            <stop offset="100%" stopColor={CHART_COLORS.leaf} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="#e0cfb0"
          strokeDasharray="4 4"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12, fill: '#7d5e34' }}
          tickMargin={8}
        />
        <YAxis
          tick={{ fontSize: 12, fill: '#7d5e34' }}
          width={56}
          tickFormatter={(value: number) =>
            new Intl.NumberFormat('en-US', { notation: 'compact' }).format(
              value,
            )
          }
        />
        <Tooltip
          formatter={(value) => [
            Number(value ?? 0).toLocaleString('en-US'),
            'Amount (contract units)',
          ]}
          contentStyle={{ borderRadius: 8, borderColor: '#e0cfb0' }}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke={CHART_COLORS.leaf}
          strokeWidth={2}
          fill="url(#fundingVolumeFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
