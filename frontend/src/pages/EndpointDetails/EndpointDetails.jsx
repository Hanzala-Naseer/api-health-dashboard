import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Pencil, Trash2, Power, Zap } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import StatusBadge, { MethodBadge } from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ResponseTimeChart from '../../components/charts/ResponseTimeChart';
import { getEndpointById, deleteEndpoint, toggleMonitoring } from '../../api/endpointApi';
import { getEndpointHistory, runManualCheck } from '../../api/monitoringApi';
import { getEndpointStatistics } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/client';
import { formatDateTime, formatMs, formatPercent } from '../../utils/formatters';

export default function EndpointDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [endpoint, setEndpoint] = useState(null);
  const [history, setHistory] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  async function loadAll() {
    try {
      const [endpointData, historyResult, statsResult] = await Promise.all([
        getEndpointById(id),
        getEndpointHistory(id, { limit: 50 }),
        getEndpointStatistics(id, { period: '7d' }),
      ]);
      setEndpoint(endpointData);
      setHistory(historyResult.history);
      setStatistics(statsResult);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load this endpoint.'));
      navigate('/dashboard/endpoints');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteEndpoint(id);
      toast.success('Endpoint deleted.');
      navigate('/dashboard/endpoints');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete this endpoint.'));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggle() {
    setIsToggling(true);
    try {
      const updated = await toggleMonitoring(id, !endpoint.monitoringEnabled);
      setEndpoint((prev) => ({ ...prev, monitoringEnabled: updated.monitoringEnabled }));
      toast.success(`Monitoring ${updated.monitoringEnabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update monitoring for this endpoint.'));
    } finally {
      setIsToggling(false);
    }
  }

  async function handleRunCheck() {
    setIsChecking(true);
    try {
      const result = await runManualCheck(id);
      toast.success(`Check complete — ${result.status}${result.responseTime ? ` in ${result.responseTime}ms` : ''}.`);
      await loadAll();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not run a check right now.'));
    } finally {
      setIsChecking(false);
    }
  }

  if (isLoading || !endpoint) {
    return <Loader label="Loading endpoint details..." fullHeight />;
  }

  // history is sorted newest-first by the backend — reverse for a
  // chronological (oldest → newest) chart, and format each point's time.
  const chartData = [...history]
    .slice(0, 24)
    .reverse()
    .map((check) => ({
      time: new Date(check.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      responseTime: check.responseTime ?? 0,
    }));

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
        <Link to="/dashboard/endpoints" className="hover:text-text-primary">
          Endpoints
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-text-primary">{endpoint.name}</span>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {endpoint.name}
            <StatusBadge status={endpoint.currentStatus} />
          </span>
        }
        description={
          <span className="flex items-center gap-2 font-mono-code text-xs">
            <MethodBadge method={endpoint.method} />
            {endpoint.url}
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={Zap} isLoading={isChecking} onClick={handleRunCheck}>
              Run Check
            </Button>
            <Button variant="secondary" icon={Power} isLoading={isToggling} onClick={handleToggle}>
              {endpoint.monitoringEnabled ? 'Disable' : 'Enable'} Monitoring
            </Button>
            <Link to={`/dashboard/endpoints/${id}/edit`}>
              <Button variant="secondary" icon={Pencil}>
                Edit
              </Button>
            </Link>
            <Button variant="danger" icon={Trash2} onClick={() => setIsDeleteOpen(true)}>
              Delete
            </Button>
          </>
        }
      />

      {/* Stats sourced from real 7-day analytics (GET /api/analytics/endpoints/:id/statistics) */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Latency (7d)</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">
            {formatMs(statistics?.performance?.averageResponseTime)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            min {formatMs(statistics?.performance?.minResponseTime)} · max{' '}
            {formatMs(statistics?.performance?.maxResponseTime)}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Uptime (7d)</p>
          <p className="mt-2 text-2xl font-bold text-success">{formatPercent(statistics?.uptime?.percentage)}</p>
          <p className="mt-1 text-xs text-text-muted">{statistics?.uptime?.totalChecks ?? 0} checks</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Failed Checks (7d)</p>
          <p className="mt-2 text-2xl font-bold text-danger">{statistics?.uptime?.failedChecks ?? 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Expected Status</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{endpoint.expectedStatus}</p>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Latency" subtitle="Last 24 recorded checks" />
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-secondary">
              No checks recorded yet — click &quot;Run Check&quot; to probe this endpoint now.
            </p>
          ) : (
            <ResponseTimeChart data={chartData} />
          )}
        </Card>
        <Card>
          <CardHeader title="General Info" />
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-text-secondary">Description</dt>
              <dd className="max-w-[60%] text-right text-text-primary">{endpoint.description || '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Frequency</dt>
              <dd className="text-text-primary">{endpoint.frequency ? `${endpoint.frequency}s` : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Created</dt>
              <dd className="text-text-primary">{formatDateTime(endpoint.createdAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Last Checked</dt>
              <dd className="text-text-primary">{formatDateTime(endpoint.lastCheckedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-text-secondary">Monitoring</dt>
              <dd className="text-text-primary">{endpoint.monitoringEnabled ? 'Enabled' : 'Disabled'}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card padding="p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">Recent Checks</h3>
        </div>
        {history.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-secondary">No checks recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Status Code</th>
                  <th className="px-4 py-3 font-medium">Latency</th>
                  <th className="px-4 py-3 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {history.slice(0, 10).map((check) => (
                  <tr key={check._id || check.id || check.checkedAt}>
                    <td className="px-4 py-3 text-text-secondary">{formatDateTime(check.checkedAt)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={check.status} />
                    </td>
                    <td className="px-4 py-3 text-text-primary">{check.statusCode ?? '—'}</td>
                    <td className="px-4 py-3 text-text-primary">{formatMs(check.responseTime)}</td>
                    <td className="px-4 py-3 text-text-secondary">{check.errorMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete endpoint"
        confirmLabel="Delete"
        message={`Are you sure you want to delete "${endpoint.name}"? This action cannot be undone.`}
      />
    </div>
  );
}
