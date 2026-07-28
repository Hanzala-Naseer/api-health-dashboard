import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronRight, Pencil, Trash2, Power, Zap, Shield } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import Card, { CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import StatusBadge, { MethodBadge, AuthTypeBadge } from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ResponseTimeChart from '../../components/charts/ResponseTimeChart';
import { getEndpointById, deleteEndpoint, toggleMonitoring } from '../../api/endpointApi';
import { getEndpointHistory, runManualCheck } from '../../api/monitoringApi';
import { getEndpointStatistics } from '../../api/dashboardApi';
import { getErrorMessage } from '../../api/client';
import { formatDateTime, formatMs, formatPercent } from '../../utils/formatters';
import { VALIDATION_RULE_LABELS, VALIDATION_RULE_FIELDS } from '../../utils/constants';

/** Renders the non-secret detail block for whichever auth type is configured. */
function AuthDetails({ authInfo }) {
  if (!authInfo) return null;

  if (authInfo.type === 'LOGIN_FLOW' && authInfo.loginConfig) {
    const isMultiStep = Array.isArray(authInfo.loginConfig.steps) && authInfo.loginConfig.steps.length > 0;

    if (isMultiStep) {
      return (
        <div className="border-t border-border pt-2">
          <p className="mb-1 text-xs font-semibold text-text-secondary">Multi-Step Login ({authInfo.loginConfig.steps.length} steps)</p>
          <ol className="space-y-1 text-xs">
            {authInfo.loginConfig.steps.map((step, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="text-text-muted">
                  {i + 1}. {step.method} {step.name ? `(${step.name})` : ''}
                </span>
                <span className="max-w-[60%] truncate text-right text-text-primary">{step.url}</span>
              </li>
            ))}
          </ol>
          <div className="mt-1 flex justify-between text-xs">
            <dt className="text-text-muted">Forward Cookies</dt>
            <dd className="text-text-primary">{authInfo.loginConfig.forwardCookies ? 'Yes' : 'No'}</dd>
          </div>
        </div>
      );
    }

    return (
      <div className="border-t border-border pt-2">
        <p className="mb-1 text-xs font-semibold text-text-secondary">Login Flow Configuration</p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-text-muted">Login URL</dt>
            <dd className="max-w-[60%] truncate text-right text-text-primary">{authInfo.loginConfig.loginUrl || '—'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Method</dt>
            <dd className="text-text-primary">{authInfo.loginConfig.method || 'POST'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Token Path</dt>
            <dd className="font-mono-code text-text-primary">{authInfo.loginConfig.tokenPath || 'data.accessToken'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">As Bearer</dt>
            <dd className="text-text-primary">{authInfo.loginConfig.asBearer !== false ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if (authInfo.type === 'API_KEY_QUERY') {
    return (
      <div className="border-t border-border pt-2">
        <div className="flex justify-between text-xs">
          <dt className="text-text-muted">Query Parameter</dt>
          <dd className="font-mono-code text-text-primary">{authInfo.apiKeyQueryParam || '—'}</dd>
        </div>
      </div>
    );
  }

  if (authInfo.type === 'HMAC' && authInfo.hmacConfig) {
    return (
      <div className="border-t border-border pt-2">
        <p className="mb-1 text-xs font-semibold text-text-secondary">HMAC Configuration</p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-text-muted">Signature Header</dt>
            <dd className="text-text-primary">{authInfo.hmacConfig.signatureHeader}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Format</dt>
            <dd className="text-text-primary">{authInfo.hmacConfig.format}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">Signed Fields</dt>
            <dd className="text-text-primary">{(authInfo.hmacConfig.signedFields || []).join(', ')}</dd>
          </div>
        </dl>
      </div>
    );
  }

  if ((authInfo.type === 'OAUTH2_CLIENT_CREDENTIALS' || authInfo.type === 'OAUTH2_REFRESH_TOKEN') && authInfo.oauth2Config) {
    return (
      <div className="border-t border-border pt-2">
        <p className="mb-1 text-xs font-semibold text-text-secondary">OAuth2 Configuration</p>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-text-muted">Token URL</dt>
            <dd className="max-w-[60%] truncate text-right text-text-primary">{authInfo.oauth2Config.tokenUrl || '—'}</dd>
          </div>
          {authInfo.oauth2Config.clientId && (
            <div className="flex justify-between">
              <dt className="text-text-muted">Client ID</dt>
              <dd className="text-text-primary">{authInfo.oauth2Config.clientId}</dd>
            </div>
          )}
          {authInfo.type === 'OAUTH2_REFRESH_TOKEN' && (
            <div className="flex justify-between">
              <dt className="text-text-muted">Refresh Token</dt>
              <dd className="text-text-primary">{authInfo.oauth2Config.hasRefreshToken ? 'Configured' : '—'}</dd>
            </div>
          )}
        </dl>
      </div>
    );
  }

  return null;
}

/** Compact, human-readable summary of one validation rule for display. */
function describeValidationRule(rule) {
  const fields = VALIDATION_RULE_FIELDS[rule.type] || [];
  const parts = fields.map((f) => `${f.label}: ${rule[f.name]}`);
  return parts.join(' · ');
}

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

  // Build authentication display info from the backend's flat sanitized
  // response — authType/apiKeyQueryParam/hmacConfig/oauth2Config/loginConfig
  // all sit at the top level (see toEndpointResponse), never a secret value.
  const authInfo = endpoint.hasAuthentication
    ? {
        type: endpoint.authType,
        apiKeyQueryParam: endpoint.apiKeyQueryParam,
        hmacConfig: endpoint.hmacConfig,
        oauth2Config: endpoint.oauth2Config,
        loginConfig: endpoint.loginConfig,
      }
    : null;

  const hasHeaders = endpoint.headers && Object.keys(endpoint.headers).length > 0;
  const hasQueryParams = endpoint.queryParams && Object.keys(endpoint.queryParams).length > 0;
  const hasBody = endpoint.bodyType && endpoint.bodyType !== 'NONE';
  const hasValidationRules = Array.isArray(endpoint.validationRules) && endpoint.validationRules.length > 0;
  const hasRequestConfig = hasHeaders || hasQueryParams || hasBody || hasValidationRules;

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
            <div className="flex justify-between border-t border-border pt-2">
              <dt className="flex items-center gap-1.5 text-text-secondary">
                <Shield className="h-3.5 w-3.5" />
                Authentication
              </dt>
              <dd className="text-text-primary">
                {authInfo ? <AuthTypeBadge authType={authInfo.type} /> : <span className="text-xs text-text-muted">None</span>}
              </dd>
            </div>
            <AuthDetails authInfo={authInfo} />
          </dl>
        </Card>
      </div>

      {hasRequestConfig && (
        <Card className="mb-6">
          <CardHeader title="Request Configuration" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {hasHeaders && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">Custom Headers</p>
                <dl className="space-y-1 text-xs">
                  {Object.entries(endpoint.headers).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="font-mono-code text-text-muted">{key}</dt>
                      <dd className="max-w-[60%] truncate text-right text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {hasQueryParams && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">Query Parameters</p>
                <dl className="space-y-1 text-xs">
                  {Object.entries(endpoint.queryParams).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="font-mono-code text-text-muted">{key}</dt>
                      <dd className="max-w-[60%] truncate text-right text-text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
            {hasBody && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">Body Type</p>
                <p className="text-xs text-text-primary">{endpoint.bodyType}</p>
              </div>
            )}
            {hasValidationRules && (
              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Response Validation Rules
                </p>
                <ul className="space-y-1 text-xs">
                  {endpoint.validationRules.map((rule, i) => (
                    <li key={i} className="flex justify-between gap-2 text-text-primary">
                      <span className="font-medium">{VALIDATION_RULE_LABELS[rule.type] || rule.type}</span>
                      <span className="text-text-muted">{describeValidationRule(rule)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

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
