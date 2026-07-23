import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-container-high px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-text-secondary">{label}</p>
      <p className="font-mono-code font-semibold text-primary">{payload[0].value}ms</p>
    </div>
  );
}

export default function ResponseTimeChart({ data = [], height = 280 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="responseTimeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#262933" vertical={false} />
        <XAxis
          dataKey="time"
          tick={{ fill: '#6b7085', fontSize: 11 }}
          axisLine={{ stroke: '#262933' }}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#6b7085', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} />
        <Area
          type="monotone"
          dataKey="responseTime"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#responseTimeGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
