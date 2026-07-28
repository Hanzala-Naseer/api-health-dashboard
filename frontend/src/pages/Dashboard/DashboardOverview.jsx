// import { useEffect, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { RefreshCcw, Plus, AlertTriangle, Activity } from 'lucide-react';
// import toast from 'react-hot-toast';
// import PageHeader from '../../components/layout/PageHeader';
// import Card, { CardHeader } from '../../components/common/Card';
// import Button from '../../components/common/Button';
// import Loader from '../../components/common/Loader';
// import EmptyState from '../../components/common/EmptyState';
// import StatusBadge from '../../components/common/StatusBadge';
// import ResponseTimeChart from '../../components/charts/ResponseTimeChart';
// import StatusPieChart from '../../components/charts/StatusPieChart';
// import { getEndpoints } from '../../api/endpointApi';
// import { getDashboardSummary, getResponseTimeTrend, getRecentHealthChecks } from '../../api/dashboardApi';
// import { getErrorMessage } from '../../api/client';
// import { formatRelativeTime } from '../../utils/formatters';

// export default function DashboardOverview() {
//   const [summary, setSummary] = useState(null);
//   const [endpoints, setEndpoints] = useState([]);
//   const [trend, setTrend] = useState([]);
//   const [recentChecks, setRecentChecks] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   async function loadData() {
//     try {
//       const [summaryResult, endpointsResult, trendResult, recentResult] = await Promise.all([
//         getDashboardSummary(),
//         getEndpoints({ page: 1, limit: 100 }),
//         getResponseTimeTrend({ period: '7d' }),
//         getRecentHealthChecks({ limit: 5 }),
//       ]);
//       setSummary(summaryResult);
//       setEndpoints(endpointsResult.endpoints);
//       setTrend(trendResult.map((point) => ({ time: point.date, responseTime: point.averageResponseTime })));
//       setRecentChecks(recentResult.checks);
//     } catch (error) {
//       toast.error(getErrorMessage(error, 'Could not load dashboard data.'));
//     } finally {
//       setIsLoading(false);
//       setIsRefreshing(false);
//     }
//   }

//   useEffect(() => {
//     // eslint-disable-next-line react-hooks/set-state-in-effect
//     loadData();
//   }, []);

//   async function handleRefresh() {
//     setIsRefreshing(true);
//     await loadData();
//     toast.success('Dashboard refreshed.');
//   }

//   // Degraded ("Slow") count isn't in the dashboard summary, but each
//   // endpoint's own currentStatus is real (from GET /api/endpoints) — so we
//   // derive it from there for the status-distribution donut.
//   const slow = endpoints.filter((e) => e.currentStatus === 'DEGRADED').length;
//   const recentFailures = endpoints.filter((e) => e.currentStatus === 'DOWN').slice(0, 5);

//   if (isLoading || !summary) {
//     return <Loader label="Loading system overview..." fullHeight />;
//   }

//   return (
//     <div>
//       <PageHeader
//         eyebrow="Infrastructure Health"
//         title="System Overview"
//         actions={
//           <>
//             <Button variant="secondary" icon={RefreshCcw} isLoading={isRefreshing} onClick={handleRefresh}>
//               Refresh Dashboard
//             </Button>
//             <Link to="/dashboard/endpoints/new">
//               <Button icon={Plus}>Quick Add API</Button>
//             </Link>
//           </>
//         }
//       />

//       {/* KPI cards — sourced from the real GET /api/dashboard summary */}
//       <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
//         <Card>
//           <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total APIs</p>
//           <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalEndpoints}</p>
//         </Card>
//         <Card>
//           <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Online</p>
//           <p className="mt-2 text-2xl font-bold text-success">{summary.healthyEndpoints}</p>
//         </Card>
//         <Card>
//           <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Offline</p>
//           <p className="mt-2 text-2xl font-bold text-danger">{summary.downEndpoints}</p>
//         </Card>
//         <Card>
//           <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Active Alerts</p>
//           <p className="mt-2 text-2xl font-bold text-warning">{summary.activeAlerts}</p>
//         </Card>
//         <Card>
//           <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Uptime</p>
//           <p className="mt-2 text-2xl font-bold text-text-primary">{summary.averageUptime}%</p>
//         </Card>
//       </div>

//       {/* Charts */}
//       <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
//         <Card className="lg:col-span-2">
//           <CardHeader title="Response Time Trend" subtitle="Last 7 days, grouped by day" />
//           {trend.length === 0 ? (
//             <p className="py-10 text-center text-sm text-text-secondary">Not enough check history yet.</p>
//           ) : (
//             <ResponseTimeChart data={trend} />
//           )}
//         </Card>
//         <Card>
//           <CardHeader title="Status Distribution" />
//           <StatusPieChart online={summary.healthyEndpoints} offline={summary.downEndpoints} slow={slow} />
//           <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
//             <div>
//               <p className="font-bold text-info">{summary.healthyEndpoints}</p>
//               <p className="text-xs text-text-secondary">Online</p>
//             </div>
//             <div>
//               <p className="font-bold text-danger">{summary.downEndpoints}</p>
//               <p className="text-xs text-text-secondary">Offline</p>
//             </div>
//             <div>
//               <p className="font-bold text-warning">{slow}</p>
//               <p className="text-xs text-text-secondary">Slow</p>
//             </div>
//           </div>
//         </Card>
//       </div>

//       {/* Recent failures / recent activity */}
//       <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
//         <Card padding="p-0">
//           <div className="flex items-center justify-between border-b border-border px-4 py-4">
//             <div className="flex items-center gap-2">
//               <AlertTriangle className="h-4 w-4 text-danger" />
//               <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">Recent Failures</h3>
//             </div>
//             <Link to="/dashboard/endpoints" className="text-xs font-medium text-primary hover:underline">
//               View All
//             </Link>
//           </div>
//           {recentFailures.length === 0 ? (
//             <div className="p-6">
//               <EmptyState
//                 icon={Activity}
//                 title="No failures right now"
//                 description="All monitored endpoints are healthy."
//               />
//             </div>
//           ) : (
//             <ul className="divide-y divide-border">
//               {recentFailures.map((e) => (
//                 <li key={e.id} className="flex items-center justify-between px-4 py-3 text-sm">
//                   <Link to={`/dashboard/endpoints/${e.id}`} className="font-medium text-text-primary hover:text-primary">
//                     {e.name}
//                   </Link>
//                   <span className="text-text-secondary">{formatRelativeTime(e.updatedAt)}</span>
//                 </li>
//               ))}
//             </ul>
//           )}
//         </Card>

//         <Card padding="p-0">
//           <div className="flex items-center justify-between border-b border-border px-4 py-4">
//             <div className="flex items-center gap-2">
//               <Activity className="h-4 w-4 text-info" />
//               <h3 className="text-sm font-semibold uppercase tracking-wide text-text-primary">Recent Health Checks</h3>
//             </div>
//             <Link to="/dashboard/history" className="text-xs font-medium text-primary hover:underline">
//               Full Log
//             </Link>
//           </div>
//           {recentChecks.length === 0 ? (
//             <div className="p-6">
//               <EmptyState title="No checks yet" description="Add an endpoint to start monitoring it." />
//             </div>
//           ) : (
//             <ul className="divide-y divide-border">
//               {recentChecks.map((check) => (
//                 <li key={check._id} className="flex items-center justify-between px-4 py-3 text-sm">
//                   <div className="min-w-0">
//                     <Link
//                       to={`/dashboard/endpoints/${check.endpointId?._id}`}
//                       className="block truncate font-medium text-text-primary hover:text-primary"
//                     >
//                       {check.endpointId?.name || 'Unknown endpoint'}
//                     </Link>
//                     <span className="text-xs text-text-muted">{formatRelativeTime(check.checkedAt)}</span>
//                   </div>
//                   <StatusBadge status={check.status} />
//                 </li>
//               ))}
//             </ul>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// }


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
import UptimeChart from '../../components/charts/UptimeChart';
import StatusPieChart from '../../components/charts/StatusPieChart';
import { getEndpoints } from '../../api/endpointApi';
import { 
  getDashboardSummary, 
  getResponseTimeTrend, 
  getUptimeTrend,
  getRecentHealthChecks 
} from '../../api/dashboardApi';
import { getSchedulerHealth } from '../../api/healthApi';
import { getErrorMessage } from '../../api/client';
import { formatRelativeTime } from '../../utils/formatters';

/**
 * SchedulerStatusCard — small, self-polling widget showing whether the
 * monitoring scheduler is alive on this server instance, its last run's
 * metrics, and current configuration. Loads independently of the rest of
 * the dashboard (it has its own data source, POST /api/health/scheduler)
 * and re-polls every 15s so it stays current without a full page refresh.
 */
function SchedulerStatusCard() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const result = await getSchedulerHealth();
        if (!cancelled) {
          setStatus(result);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <Card>
      <CardHeader
        title="Monitoring Scheduler"
        subtitle={status ? `Worker: ${status.workerId}` : undefined}
        action={
          status && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
                status.running
                  ? 'border-success/20 bg-success/10 text-success'
                  : 'border-danger/20 bg-danger/10 text-danger'
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${status.running ? 'bg-success' : 'bg-danger'}`} />
              {status.running ? 'Running' : 'Stopped'}
            </span>
          )
        }
      />

      {error && <p className="text-sm text-text-secondary">Could not reach the scheduler status endpoint.</p>}

      {!error && !status && <p className="text-sm text-text-secondary">Loading…</p>}

      {status && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-text-secondary">Last Run</p>
            <p className="text-sm font-medium text-text-primary">
              {status.lastRun?.startedAt ? formatRelativeTime(status.lastRun.startedAt) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Processed / Skipped / Failed</p>
            <p className="text-sm font-medium text-text-primary">
              {status.lastRun?.processed ?? 0} / {status.lastRun?.skipped ?? 0} / {status.lastRun?.failed ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Active Workers</p>
            <p className="text-sm font-medium text-text-primary">{status.activeWorkers ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">Config</p>
            <p className="text-sm font-medium text-text-primary">
              every {Math.round((status.config?.intervalMs ?? 0) / 1000)}s · batch {status.config?.batchSize} · concurrency{' '}
              {status.config?.concurrencyLimit}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function DashboardOverview() {
  const [summary, setSummary] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [trend, setTrend] = useState([]);
  const [uptimeTrend, setUptimeTrend] = useState([]);
  const [recentChecks, setRecentChecks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadData() {
    try {
      const summaryResult = await getDashboardSummary();
      const endpointsResult = await getEndpoints({ page: 1, limit: 100 });
      const trendResult = await getResponseTimeTrend({ period: '7d' });
      const uptimeResult = await getUptimeTrend({ period: '7d' });
      const recentResult = await getRecentHealthChecks({ limit: 5 });

      setSummary(summaryResult);
      setEndpoints(endpointsResult.endpoints || []);
      
      // Transform Response Time Data
      let transformedTrend = [];
      if (trendResult && Array.isArray(trendResult) && trendResult.length > 0) {
        transformedTrend = trendResult.map((point) => {
          const dateValue = point._id || point.date || null;
          const responseValue = point.averageResponseTime || 
                                point.responseTime || 
                                point.value || 
                                point.totalChecks || 
                                0;
          return {
            date: dateValue,
            responseTime: responseValue,
          };
        });
      }
      setTrend(transformedTrend);

      // Transform Uptime Data
      let transformedUptime = [];
      if (uptimeResult && Array.isArray(uptimeResult) && uptimeResult.length > 0) {
        transformedUptime = uptimeResult.map((point) => {
          const dateValue = point._id || point.date || null;
          const uptimeValue = point.uptime || 
                              point.averageUptime || 
                              (point.successfulChecks / point.totalChecks * 100) || 
                              100;
          return {
            label: dateValue,
            uptime: Number(uptimeValue.toFixed(2)),
          };
        });
      }
      setUptimeTrend(transformedUptime);

      setRecentChecks(recentResult.checks || []);
      
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

      {/* KPI Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Total APIs</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.totalEndpoints || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Online</p>
          <p className="mt-2 text-2xl font-bold text-success">{summary.healthyEndpoints || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Offline</p>
          <p className="mt-2 text-2xl font-bold text-danger">{summary.downEndpoints || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Active Alerts</p>
          <p className="mt-2 text-2xl font-bold text-warning">{summary.activeAlerts || 0}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Avg Uptime</p>
          <p className="mt-2 text-2xl font-bold text-text-primary">{summary.averageUptime || 0}%</p>
        </Card>
      </div>

      {/* Scheduler status — polls POST /api/health/scheduler every 15s */}
      <div className="mb-6">
        <SchedulerStatusCard />
      </div>

      {/* Row 1: Response Time + Status Distribution */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Response Time Trend" subtitle="Last 7 days, grouped by day" />
          {trend.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-secondary">
              No response time data available yet.
              <p className="mt-2 text-xs text-text-muted">
                Run a manual check or wait for the next scheduled check.
              </p>
            </div>
          ) : (
            <ResponseTimeChart data={trend} />
          )}
        </Card>
        <Card>
          <CardHeader title="Status Distribution" />
          <StatusPieChart 
            online={summary.healthyEndpoints || 0} 
            offline={summary.downEndpoints || 0} 
            slow={slow || 0} 
          />
          <div className="mt-6 grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="font-bold text-info">{summary.healthyEndpoints || 0}</p>
              <p className="text-xs text-text-secondary">Online</p>
            </div>
            <div>
              <p className="font-bold text-danger">{summary.downEndpoints || 0}</p>
              <p className="text-xs text-text-secondary">Offline</p>
            </div>
            <div>
              <p className="font-bold text-warning">{slow || 0}</p>
              <p className="text-xs text-text-secondary">Slow</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Uptime Trend + Recent Failures */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Uptime Trend" subtitle="Last 7 days, grouped by day" />
          {uptimeTrend.length === 0 ? (
            <div className="py-10 text-center text-sm text-text-secondary">
              No uptime data available yet.
              <p className="mt-2 text-xs text-text-muted">
                Run a manual check or wait for the next scheduled check.
              </p>
            </div>
          ) : (
            <UptimeChart data={uptimeTrend} />
          )}
        </Card>

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
                  <Link 
                    to={`/dashboard/endpoints/${e.id}`} 
                    className="font-medium text-text-primary hover:text-primary"
                  >
                    {e.name}
                  </Link>
                  <span className="text-text-secondary">{formatRelativeTime(e.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Row 3: Recent Health Checks */}
      <div className="grid grid-cols-1 gap-4">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Endpoint</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Response Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentChecks.map((check) => (
                    <tr key={check._id}>
                      <td className="px-4 py-3 text-text-secondary">
                        {formatRelativeTime(check.checkedAt)}
                      </td>
                      <td className="px-4 py-3 font-medium text-text-primary">
                        <Link 
                          to={`/dashboard/endpoints/${check.endpointId?._id}`}
                          className="hover:text-primary"
                        >
                          {check.endpointId?.name || 'Unknown endpoint'}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={check.status} />
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        {check.responseTime ? `${check.responseTime}ms` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Debug panel */}
      <div className="mt-8 rounded-lg border border-border bg-surface-container-low p-4 text-xs text-text-secondary">
        <p><strong>🔍 Debug Info:</strong></p>
        <p>Summary: {summary ? '✅' : '❌'}</p>
        <p>Endpoints: {endpoints.length}</p>
        <p>Response Time Points: {trend.length}</p>
        <p>Uptime Points: {uptimeTrend.length}</p>
        <p>Recent checks: {recentChecks.length}</p>
        {trend.length > 0 && (
          <p>First trend: {JSON.stringify(trend[0]).substring(0, 100)}</p>
        )}
        {uptimeTrend.length > 0 && (
          <p>First uptime: {JSON.stringify(uptimeTrend[0]).substring(0, 100)}</p>
        )}
      </div>
    </div>
  );
}