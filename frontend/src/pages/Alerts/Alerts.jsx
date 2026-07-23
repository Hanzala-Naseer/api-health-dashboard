import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { SeverityBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { getActiveAlerts, getAlertHistory } from '../../api/alertApi';
import { getErrorMessage } from '../../api/client';
import { formatDateTime } from '../../utils/formatters';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
];

export default function Alerts() {
  const [tab, setTab] = useState('active');
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  async function loadAlerts(page = 1) {
    setIsLoading(true);
    try {
      const fetcher = tab === 'active' ? getActiveAlerts : getAlertHistory;
      const result = await fetcher({ page, limit: 10 });
      setAlerts(result.alerts);
      setPagination({
        page: result.meta?.page ?? page,
        totalPages: result.meta?.totalPages ?? 1,
        total: result.meta?.total ?? result.alerts.length,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load alerts.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAlerts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div>
      <PageHeader
        eyebrow="Real-time Surveillance"
        title="Alerts"
        description="Generated automatically when a monitored endpoint's health check fails. There's no manual alert-creation step — this list mirrors what the monitoring pipeline has detected."
      />

      <div className="mb-4 flex gap-2 rounded-lg border border-border bg-surface-container-low p-1 w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-primary text-on-primary' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card padding="p-0">
        {isLoading ? (
          <Loader label="Loading alerts..." />
        ) : alerts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={tab === 'active' ? ShieldCheck : ShieldAlert}
              title={tab === 'active' ? 'No active alerts' : 'No alert history yet'}
              description={
                tab === 'active'
                  ? 'Nothing is currently down or degraded.'
                  : 'Alerts will show up here once your endpoints have triggered any.'
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3 font-medium">Alert</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Endpoint</th>
                  <th className="px-4 py-3 font-medium">Created At</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((alert) => (
                  <tr key={alert._id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{alert.title}</p>
                      <p className="text-xs text-text-muted">{alert.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td className="px-4 py-3 font-mono-code text-text-secondary">
                      {alert.endpointId?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatDateTime(alert.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={alert.status === 'RESOLVED' ? 'text-success' : 'text-warning'}>
                        {alert.status === 'RESOLVED' ? 'Resolved' : 'Active'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && alerts.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            itemLabel="alerts"
            onPageChange={loadAlerts}
          />
        </div>
      )}
    </div>
  );
}
