import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Plus, AlertTriangle, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import StatusBadge from '../../components/common/StatusBadge';
import ResponseTimeChart from '../../components/charts/ResponseTimeChart';
import StatusPieChart from '../../components/charts/StatusPieChart';
import { getEndpoints } from '../../api/endpointApi';
import { getDashboardSummary, getResponseTimeTrend, getRecentHealthChecks } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/client';
import { formatRelativeTime } from '../../utils/formatters';

export default function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [trend, setTrend] = useState([]);
  const [recentChecks, setRecentChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadData() {
    try {
      const [summaryResult, endpointsResult, trendResult, recentResult] = await Promise.all([
        getDashboardSummary(),
        getEndpoints({ page: 1, limit: 100 }),
        getResponseTimeTrend({ period: '7d' }),
        getRecentHealthChecks({ limit: 5 }),
      ]);
      setSummary(summaryResult);
      setEndpoints(endpointsResult.endpoints);
      setTrend(trendResult.map((point) => ({ time: point.date, responseTime: point.averageResponseTime })));
      setRecentChecks(recentResult.checks);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load dashboard data.'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    await loadData();
    toast.success('Dashboard refreshed.');
  }

  // Degraded ("Slow") count isn't in the dashboard summary, but each
  // endpoint's own currentStatus is real (from GET /api/endpoints) — so we
  // derive it from there for the status-distribution donut.
  const slow = endpoints.filter((e) => e.currentStatus === 'DEGRADED').length;
  const recentFailures = endpoints.filter((e) => e.currentStatus === 'DOWN').slice(0, 5);

  if (isLoading || !summary) {
    return <Loader label="Loading system overview..." fullHeight />;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Infrastructure Health"
        title="System Overview"
        actions={
          <>
            <Button variant="secondary" icon={RefreshCcw} isLoading={isRefreshing} onClick={handleRefresh}>
              Refresh Dashboard
            </Button>
            <Link to="/dashboard/endpoints/new">
              <Button icon={Plus}>Quick Add API</Button>
            </Link>
          </>
        }
      />

      {/* KPI cards — sourced from the real GET /api/dashboard summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total APIs</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalEndpoints}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Online</p>
          <p className="mt-2 text-2xl font-bold text-success">{summary.healthyEndpoints}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Offline</p>
          <p className="mt-2 text-2xl font-bold text-danger">{summary.downEndpoints}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Active Alerts</p>
          <p className="mt-2 text-2xl font-bold text-warning">{summary.activeAlerts}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Uptime</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.averageUptime}%</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Response Time Trend" subtitle="Last 7 days, grouped by day" />
          {trend.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-secondary">Not enough check history yet.</p>
          ) : (
            <ResponseTimeChart data={trend} />
          )}
        </Card>
        <Card>
          <CardHeader title="Status Distribution" />
          <StatusPieChart online={summary.healthyEndpoints} offline={summary.downEndpoints} slow={slow} />
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-info">{summary.healthyEndpoints}</p>
              <p className="text-xs text-text-secondary">Online</p>
            </div>
            <div>
              <p className="font-bold text-danger">{summary.downEndpoints}</p>
              <p className="text-xs text-text-secondary">Offline</p>
            </div>
            <div>
              <p className="font-bold text-warning">{slow}</p>
              <p className="text-xs text-text-secondary">Slow</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent failures / recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card padding="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-danger" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">Recent Failures</h3>
            </div>
            <Link to="/dashboard/endpoints" className="text-xs font-medium text-primary hover:underline">
              View All
            </Link>
          </div>
          {recentFailures.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Activity}
                title="No failures right now"
                description="All monitored endpoints are healthy."
              />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentFailures.map((e) => (
                <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <Link to={`/dashboard/endpoints/${e.id}`} className="font-medium text-text-primary hover:text-primary">
                    {e.name}
                  </Link>
                  <span className="text-text-secondary">{formatRelativeTime(e.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="p-0">
          <div className="flex items-center justify-between border-b border-border px-4 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-info" />
              <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">Recent Health Checks</h3>
            </div>
            <Link to="/dashboard/history" className="text-xs font-medium text-primary hover:underline">
              Full Log
            </Link>
          </div>
          {recentChecks.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No checks yet" description="Add an endpoint to start monitoring it." />
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentChecks.map((check) => (
                <li key={check._id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <Link
                      to={`/dashboard/endpoints/${check.endpointId?._id}`}
                      className="block truncate font-medium text-text-primary hover:text-primary"
                    >
                      {check.endpointId?.name || 'Unknown endpoint'}
                    </Link>
                    <span className="text-xs text-text-muted">{formatRelativeTime(check.checkedAt)}</span>
                  </div>
                  <StatusBadge status={check.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
