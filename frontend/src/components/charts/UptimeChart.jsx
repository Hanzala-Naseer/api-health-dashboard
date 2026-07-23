import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface-container-high px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 text-text-secondary">{label}</p>
      <p className="font-mono-code font-semibold text-info">{payload[0].value}% uptime</p>
    </div>
  );
}

export default function UptimeChart({ data = [], height = 240 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#262933" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7085', fontSize: 11 }}
          axisLine={{ stroke: '#262933' }}
          tickLine={false}
        />
        <YAxis domain={[0, 100]} tick={{ fill: '#6b7085', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="uptime" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.uptime >= 99 ? '#22c55e' : entry.uptime >= 95 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
