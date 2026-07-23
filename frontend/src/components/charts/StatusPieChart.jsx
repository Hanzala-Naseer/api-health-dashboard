import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = {
  online: '#0ea5e9',
  offline: '#ef4444',
  slow: '#f59e0b',
};

export default function StatusPieChart({ online = 0, offline = 0, slow = 0, size = 192 }) {
  const total = online + offline + slow;
  const data = [
    { name: 'Online', value: online, color: COLORS.online },
    { name: 'Offline', value: offline, color: COLORS.offline },
    { name: 'Slow', value: slow, color: COLORS.slow },
  ].filter((d) => d.value > 0);

  const chartData = data.length ? data : [{ name: 'No data', value: 1, color: '#32343d' }];

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-text-primary">{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-text-secondary">Total</span>
      </div>
    </div>
  );
}
