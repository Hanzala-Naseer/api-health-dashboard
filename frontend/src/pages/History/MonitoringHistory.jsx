import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { History as HistoryIcon } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import { Select } from '../../components/common/FormField';
import { getMonitoringHistory } from '../../api/monitoringApi';
import { getErrorBreakdown } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/client';
import { HEALTH_CHECK_STATUS } from '../../utils/constants';
import { formatDateTime, formatMs } from '../../utils/formatters';

const LIMIT = 20;

export default function MonitoringHistory() {
  const [checks, setChecks] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [errorBreakdown, setErrorBreakdown] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  async function loadHistory(page = 1) {
    setIsLoading(true);
    try {
      const result = await getMonitoringHistory({ page, limit: LIMIT });
      setChecks(result.checks);
      setPagination(result.pagination);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load monitoring history.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory(1);
    getErrorBreakdown({ period: '7d' })
      .then(setErrorBreakdown)
      .catch(() => setErrorBreakdown([]));
  }, []);

  // The backend's GET /api/dashboard/recent-health-checks only accepts
  // page/limit — no search or status query params — so filtering here is
  // applied client-side to the page of results already fetched, not the
  // full dataset. Switching pages re-fetches; filters just narrow what's
  // currently on screen.
  const filteredChecks = useMemo(() => {
    return checks.filter((check) => {
      if (status && check.status !== status) return false;
      if (search && !check.endpointId?.name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [checks, search, status]);

  return (
    <div>
      <PageHeader
        eyebrow="Observability"
        title="Monitoring History"
        description="Real health-check log across every endpoint you monitor."
      />

      <Card className="mb-4" padding="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Filter this page by endpoint name..."
            className="md:max-w-xs"
          />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="md:w-40">
            <option value="">Status: All</option>
            {HEALTH_CHECK_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Card padding="p-0" className="lg:col-span-3">
          {isLoading ? (
            <Loader label="Loading history..." />
          ) : filteredChecks.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={HistoryIcon}
                title="No checks found"
                description="Try a different filter, or check back after the next scheduled probe."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Endpoint</th>
                    <th className="px-4 py-3 font-medium">Response Time</th>
                    <th className="px-4 py-3 font-medium">Status Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredChecks.map((check) => (
                    <tr key={check._id}>
                      <td className="px-4 py-3 text-text-secondary">{formatDateTime(check.checkedAt)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={check.status} />
                      </td>
                      <td className="px-4 py-3 font-mono-code text-text-primary">
                        {check.endpointId?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-text-primary">{formatMs(check.responseTime)}</td>
                      <td className="px-4 py-3 text-text-secondary">{check.statusCode ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Error Breakdown" subtitle="Last 7 days" />
          {errorBreakdown.length === 0 ? (
            <p className="text-sm text-text-secondary">No errors in this period.</p>
          ) : (
            <ul className="space-y-3">
              {errorBreakdown.map((item) => (
                <li key={item.type}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-text-primary">{item.type}</span>
                    <span className="text-text-secondary">
                      {item.count} · {item.percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div className="h-full rounded-full bg-danger" style={{ width: `${item.percentage}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {!isLoading && checks.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            itemLabel="checks"
            onPageChange={loadHistory}
          />
        </div>
      )}
    </div>
  );
}
