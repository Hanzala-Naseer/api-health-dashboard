

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, Radio } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/layout/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge, { MethodBadge, AuthTypeBadge } from '../../components/common/StatusBadge';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Select } from '../../components/common/FormField';
import { getEndpoints, deleteEndpoint } from '../../api/endpointApi';
import { getErrorMessage } from '../../api/client';
import { HTTP_METHODS, ENDPOINT_STATUS, AUTH_TYPES, AUTH_TYPE_LABELS } from '../../utils/constants';
import { formatRelativeTime, formatMs } from '../../utils/formatters';

const LIMIT = 10;

export default function EndpointsList() {
  const [endpoints, setEndpoints] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [authType, setAuthType] = useState(''); // V1.5
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function loadEndpoints(page = 1) {
    setIsLoading(true);
    try {
      const result = await getEndpoints({
        page,
        limit: LIMIT,
        search: search || undefined,
        method: method || undefined,
        status: status || undefined,
        authType: authType || undefined, // V1.5
      });

      console.log('🔍 Auth Debug:', result.endpoints.map(e => ({
      name: e.name,
      hasAuthentication: e.hasAuthentication,
      authType: e.authType,
      auth: e.auth // Check if auth object exists
    })));
      setEndpoints(result.endpoints);
      setPagination({
        page: result.pagination?.page ?? page,
        totalPages: result.pagination?.totalPages ?? 1,
        total: result.pagination?.total ?? result.endpoints.length,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load endpoints.'));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => loadEndpoints(1), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, method, status, authType]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteEndpoint(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" deleted.`);
      setEndpoints((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete this endpoint.'));
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Infrastructure"
        title="API Endpoints"
        actions={
          <Link to="/dashboard/endpoints/new">
            <Button icon={Plus}>Add Endpoint</Button>
          </Link>
        }
      />

      <Card className="mb-4" padding="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search endpoints..." className="flex-1 min-w-[150px] md:max-w-xs" />
          <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-[130px]">
            <option value="">Method: Any</option>
            {HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-[140px]">
            <option value="">Status: Any</option>
            {ENDPOINT_STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {/* V1.5 — Authentication Type Filter */}
          <Select value={authType} onChange={(e) => setAuthType(e.target.value)} className="w-[150px]">
            <option value="">Auth: Any</option>
            {AUTH_TYPES.map((type) => (
              <option key={type} value={type}>
                {AUTH_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card padding="p-0">
        {isLoading ? (
          <Loader label="Loading endpoints..." />
        ) : endpoints.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Radio}
              title="No endpoints found"
              description="Add your first API endpoint to start monitoring it."
              actionLabel="Add Endpoint"
              onAction={() => window.location.assign('/dashboard/endpoints/new')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-text-secondary">
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Method</th>
                  <th className="px-4 py-3 font-medium">URL</th>
                  <th className="px-4 py-3 font-medium">Auth</th>
                  <th className="px-4 py-3 font-medium">Avg Response</th>
                  <th className="px-4 py-3 font-medium">Last Checked</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {endpoints.map((endpoint) => (
                  <tr key={endpoint.id} className="hover:bg-surface-container-high/50">
                    <td className="px-4 py-3">
                      <StatusBadge status={endpoint.currentStatus} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/dashboard/endpoints/${endpoint.id}`}
                        className="font-medium text-text-primary hover:text-primary"
                      >
                        {endpoint.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <MethodBadge method={endpoint.method} />
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 font-mono-code text-text-secondary">
                      {endpoint.url}
                    </td>
                    <td className="px-4 py-3">
                      {endpoint.hasAuthentication ? (
                        <AuthTypeBadge authType={endpoint.authType} />
                      ) : (
                        <span className="text-text-muted text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{formatMs(endpoint.lastResponseTime)}</td>
                    <td className="px-4 py-3 text-text-secondary">{formatRelativeTime(endpoint.lastCheckedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/dashboard/endpoints/${endpoint.id}`}
                          aria-label={`View ${endpoint.name}`}
                          className="rounded-lg p-2 text-text-secondary hover:bg-surface-container-highest hover:text-primary"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          to={`/dashboard/endpoints/${endpoint.id}/edit`}
                          aria-label={`Edit ${endpoint.name}`}
                          className="rounded-lg p-2 text-text-secondary hover:bg-surface-container-highest hover:text-primary"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Delete ${endpoint.name}`}
                          onClick={() => setDeleteTarget(endpoint)}
                          className="rounded-lg p-2 text-text-secondary hover:bg-surface-container-highest hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && endpoints.length > 0 && (
        <div className="mt-4">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            itemLabel="endpoints"
            onPageChange={loadEndpoints}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete endpoint"
        confirmLabel="Delete"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will stop monitoring it.`}
      />
    </div>
  );
}