import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { FundingOutcomeSlice } from '../../lib/analytics/metrics';
import { OUTCOME_COLORS } from '../../lib/analytics/theme';
import { EmptyChartState } from './ChartCard';

export function FundingOutcomeChart({ data }: { data: FundingOutcomeSlice[] }) {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  if (total === 0) {
    return <EmptyChartState message="No campaigns recorded yet." />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={60}
          outerRadius={95}
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell
              key={entry.label}
              fill={OUTCOME_COLORS[index % OUTCOME_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const numeric = Number(value ?? 0);
            return [
              `${numeric} (${((numeric / total) * 100).toFixed(0)}%)`,
              name,
            ];
          }}
          contentStyle={{ borderRadius: 8, borderColor: '#e0cfb0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#7d5e34' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
