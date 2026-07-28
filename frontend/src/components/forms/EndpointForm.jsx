import { useForm, useFieldArray } from 'react-hook-form';
import { Save, Plus } from 'lucide-react';
import {
  HTTP_METHODS,
  AUTH_TYPES,
  AUTH_TYPE_LABELS,
  AUTH_TYPE_DESCRIPTIONS,
  LOGIN_HTTP_METHODS,
  BODY_TYPES,
  BODY_TYPE_LABELS,
} from '../../utils/constants';
import { Field, TextInput, Select, Textarea } from '../common/FormField';
import Button from '../common/Button';
import KeyValueListEditor, { keyValueListToObject, objectToKeyValueList } from '../common/KeyValueListEditor';
import ValidationRulesEditor, { cleanValidationRules } from '../common/ValidationRulesEditor';
import LoginStepRow from './LoginStepRow';

const FREQUENCY_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
];

const STATUS_OPTIONS = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

// Pre-filled demo login body as a STRING (not an object) — the textarea
// edits a string; it's parsed to JSON right before submit.
const DEMO_LOGIN_BODY = JSON.stringify(
  { email: 'demo@pulseops.app', password: 'DemoPassword123!' },
  null,
  2
);

const DEFAULT_HMAC_SIGNED_FIELDS = 'timestamp,method,path,body';

function emptyLoginStep() {
  return { name: '', url: '', method: 'POST', headersJson: '{}', bodyJson: '', extract: [] };
}

/** Best-effort JSON parse — returns null on failure so callers can decide how to handle it. */
function tryParseJson(value) {
  if (!value || typeof value !== 'string' || value.trim() === '') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default function EndpointForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save Endpoint',
  allowFrequency = false,
}) {
  // Build default values with proper auth/body/validation merging. Several
  // backend shapes (headers, queryParams, validationRules — plain
  // objects/arrays) get converted here into the array-of-rows shape the
  // form's field arrays need; they're converted back on submit.
  const buildDefaultValues = () => {
    const source = defaultValues || {};

    // The backend's GET /endpoints/:id response is FLAT (authType,
    // apiKeyQueryParam, hmacConfig, oauth2Config, loginConfig all sit at
    // the top level of the endpoint document — see toEndpointResponse in
    // endpoint.service.js). The create-mode initial object instead nests
    // everything under `auth`. Reading both shapes here means this form
    // works whether `defaultValues` came from the backend or from a
    // freshly-initialized "new endpoint" object.
    const auth = {
      type: source.auth?.type ?? source.authType ?? 'NONE',
      staticToken: source.auth?.staticToken ?? '',
      apiKeyHeader: source.auth?.apiKeyHeader ?? '',
      apiKeyValue: source.auth?.apiKeyValue ?? '',
      basicUsername: source.auth?.basicUsername ?? '',
      basicPassword: source.auth?.basicPassword ?? '',
      apiKeyQueryParam: source.auth?.apiKeyQueryParam ?? source.apiKeyQueryParam ?? '',
      hmacSecret: source.auth?.hmacSecret ?? '',
      hmacConfig: source.auth?.hmacConfig ?? source.hmacConfig ?? null,
      oauth2Config: source.auth?.oauth2Config ?? source.oauth2Config ?? null,
      loginConfig: source.auth?.loginConfig ?? source.loginConfig ?? null,
    };

    const isMultiStep = Array.isArray(auth.loginConfig?.steps) && auth.loginConfig.steps.length > 0;

    return {
      name: source.name ?? '',
      url: source.url ?? '',
      method: source.method ?? 'GET',
      expectedStatus: source.expectedStatus ?? 200,
      frequency: source.frequency ?? 300,
      description: source.description ?? '',

      headersList: objectToKeyValueList(source.headers),
      queryParamsList: objectToKeyValueList(source.queryParams),

      bodyType: source.bodyType ?? 'NONE',
      body:
        source.body && typeof source.body === 'object'
          ? JSON.stringify(source.body, null, 2)
          : source.body ?? '',

      validationRulesList: Array.isArray(source.validationRules) ? source.validationRules : [],

      auth: {
        type: auth.type ?? 'NONE',
        staticToken: auth.staticToken ?? '',
        apiKeyHeader: auth.apiKeyHeader ?? '',
        apiKeyValue: auth.apiKeyValue ?? '',
        basicUsername: auth.basicUsername ?? '',
        basicPassword: auth.basicPassword ?? '',

        // API_KEY_QUERY
        apiKeyQueryParam: auth.apiKeyQueryParam ?? '',

        // HMAC
        hmacSecret: auth.hmacSecret ?? '',
        hmacSignatureHeader: auth.hmacConfig?.signatureHeader ?? auth.hmacSignatureHeader ?? 'X-Signature',
        hmacTimestampHeader: auth.hmacConfig?.timestampHeader ?? auth.hmacTimestampHeader ?? 'X-Timestamp',
        hmacNonceHeader: auth.hmacConfig?.nonceHeader ?? auth.hmacNonceHeader ?? '',
        hmacFormat: auth.hmacConfig?.format ?? auth.hmacFormat ?? 'hex',
        hmacSignedFieldsText: Array.isArray(auth.hmacConfig?.signedFields ?? auth.hmacSignedFields)
          ? (auth.hmacConfig?.signedFields ?? auth.hmacSignedFields).join(',')
          : DEFAULT_HMAC_SIGNED_FIELDS,

        // OAUTH2_CLIENT_CREDENTIALS / OAUTH2_REFRESH_TOKEN (both share oauth2Config)
        oauth2Config: {
          tokenUrl: auth.oauth2Config?.tokenUrl ?? '',
          clientId: auth.oauth2Config?.clientId ?? '',
          clientSecret: auth.oauth2Config?.clientSecret ?? '',
          refreshToken: '', // never returned by the backend — must be re-entered to change it
          scope: auth.oauth2Config?.scope ?? '',
          audience: auth.oauth2Config?.audience ?? '',
        },

        // LOGIN_FLOW — single-step (unchanged shape) + multi-step toggle
        useMultiStep: isMultiStep,
        loginConfig: {
          loginUrl: auth.loginConfig?.loginUrl ?? 'http://localhost:5001/api/health-demo/items/login',
          method: auth.loginConfig?.method ?? 'POST',
          headers: auth.loginConfig?.headers ?? { 'Content-Type': 'application/json' },
          body:
            auth.loginConfig?.body && typeof auth.loginConfig.body === 'object'
              ? JSON.stringify(auth.loginConfig.body, null, 2)
              : auth.loginConfig?.body ?? DEMO_LOGIN_BODY,
          tokenPath: auth.loginConfig?.tokenPath ?? 'data.accessToken',
          asBearer: auth.loginConfig?.asBearer !== false,
          tokenVariable: auth.loginConfig?.tokenVariable ?? 'token',
          forwardCookies: Boolean(auth.loginConfig?.forwardCookies),
          stepsList: isMultiStep
            ? auth.loginConfig.steps.map((step) => ({
                name: step.name ?? '',
                url: step.url ?? '',
                method: step.method ?? 'POST',
                headersJson: step.headers ? JSON.stringify(step.headers, null, 2) : '{}',
                bodyJson:
                  step.body && !step.hasBody // hasBody-only (from a sanitized GET response) means no real body to show
                    ? JSON.stringify(step.body, null, 2)
                    : '',
                extract: Array.isArray(step.extract) ? step.extract : [],
              }))
            : [emptyLoginStep()],
        },
      },
    };
  };

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm({ defaultValues: buildDefaultValues() });

  const authType = watch('auth.type') || 'NONE';
  const bodyType = watch('bodyType') || 'NONE';
  const useMultiStep = watch('auth.useMultiStep');

  const stepsArray = useFieldArray({ control, name: 'auth.loginConfig.stepsList' });

  function submit(values) {
    const payload = {
      name: values.name,
      url: values.url,
      method: values.method,
      expectedStatus: Number(values.expectedStatus),
      description: values.description || undefined,
    };

    if (allowFrequency) {
      payload.frequency = Number(values.frequency);
    }

    // --- Headers / query params ---
    const headers = keyValueListToObject(values.headersList);
    const queryParams = keyValueListToObject(values.queryParamsList);
    if (Object.keys(headers).length > 0) payload.headers = headers;
    if (Object.keys(queryParams).length > 0) payload.queryParams = queryParams;

    // --- Body ---
    payload.bodyType = values.bodyType;
    if (values.bodyType !== 'NONE') {
      if (values.bodyType === 'JSON' || values.bodyType === 'MULTIPART') {
        payload.body = tryParseJson(values.body) ?? values.body;
      } else {
        payload.body = values.body;
      }
    }

    // --- Response validation rules ---
    const validationRules = cleanValidationRules(values.validationRulesList);
    if (validationRules.length > 0) payload.validationRules = validationRules;

    // --- Authentication ---
    const { type } = values.auth;

    if (type === 'NONE') {
      payload.auth = { type: 'NONE' };
    } else if (type === 'STATIC_BEARER') {
      payload.auth = { type, staticToken: values.auth.staticToken };
    } else if (type === 'API_KEY') {
      payload.auth = {
        type,
        apiKeyHeader: values.auth.apiKeyHeader,
        apiKeyValue: values.auth.apiKeyValue,
      };
    } else if (type === 'API_KEY_QUERY') {
      payload.auth = {
        type,
        apiKeyQueryParam: values.auth.apiKeyQueryParam,
        apiKeyValue: values.auth.apiKeyValue,
      };
    } else if (type === 'BASIC') {
      payload.auth = {
        type,
        basicUsername: values.auth.basicUsername,
        basicPassword: values.auth.basicPassword,
      };
    } else if (type === 'HMAC') {
      const signedFields = (values.auth.hmacSignedFieldsText || '')
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      payload.auth = {
        type,
        hmacSecret: values.auth.hmacSecret,
        hmacSignatureHeader: values.auth.hmacSignatureHeader || 'X-Signature',
        hmacTimestampHeader: values.auth.hmacTimestampHeader || 'X-Timestamp',
        hmacFormat: values.auth.hmacFormat || 'hex',
        ...(values.auth.hmacNonceHeader ? { hmacNonceHeader: values.auth.hmacNonceHeader } : {}),
        ...(signedFields.length > 0 ? { hmacSignedFields: signedFields } : {}),
      };
    } else if (type === 'OAUTH2_CLIENT_CREDENTIALS') {
      payload.auth = {
        type,
        oauth2Config: {
          tokenUrl: values.auth.oauth2Config.tokenUrl,
          clientId: values.auth.oauth2Config.clientId,
          clientSecret: values.auth.oauth2Config.clientSecret,
          ...(values.auth.oauth2Config.scope ? { scope: values.auth.oauth2Config.scope } : {}),
          ...(values.auth.oauth2Config.audience ? { audience: values.auth.oauth2Config.audience } : {}),
        },
      };
    } else if (type === 'OAUTH2_REFRESH_TOKEN') {
      payload.auth = {
        type,
        oauth2Config: {
          tokenUrl: values.auth.oauth2Config.tokenUrl,
          refreshToken: values.auth.oauth2Config.refreshToken,
          ...(values.auth.oauth2Config.clientId ? { clientId: values.auth.oauth2Config.clientId } : {}),
          ...(values.auth.oauth2Config.clientSecret ? { clientSecret: values.auth.oauth2Config.clientSecret } : {}),
          ...(values.auth.oauth2Config.scope ? { scope: values.auth.oauth2Config.scope } : {}),
        },
      };
    } else if (type === 'LOGIN_FLOW') {
      if (values.auth.useMultiStep) {
        const steps = values.auth.loginConfig.stepsList
          .filter((step) => step.url && step.url.trim())
          .map((step) => ({
            name: step.name || undefined,
            url: step.url,
            method: step.method || 'GET',
            headers: tryParseJson(step.headersJson) || undefined,
            body: tryParseJson(step.bodyJson) || undefined,
            extract: (step.extract || []).filter((rule) => rule.name && rule.path),
          }));

        payload.auth = {
          type,
          loginConfig: {
            steps,
            tokenVariable: values.auth.loginConfig.tokenVariable || 'token',
            forwardCookies: Boolean(values.auth.loginConfig.forwardCookies),
            asBearer: values.auth.loginConfig.asBearer !== false,
          },
        };
      } else {
        payload.auth = {
          type,
          loginConfig: {
            loginUrl: values.auth.loginConfig.loginUrl,
            method: values.auth.loginConfig.method || 'POST',
            headers: values.auth.loginConfig.headers || { 'Content-Type': 'application/json' },
            body: tryParseJson(values.auth.loginConfig.body) ?? values.auth.loginConfig.body,
            tokenPath: values.auth.loginConfig.tokenPath || 'data.accessToken',
            asBearer: values.auth.loginConfig.asBearer !== false,
          },
        };
      }
    }

    onSubmit(payload);
  }

  function renderAuthFields() {
    switch (authType) {
      case 'STATIC_BEARER':
        return (
          <Field
            label="Static Bearer Token"
            htmlFor="auth.staticToken"
            error={errors.auth?.staticToken?.message}
            hint="The token will be sent as: Authorization: Bearer <token>"
          >
            <TextInput
              id="auth.staticToken"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              error={errors.auth?.staticToken}
              {...register('auth.staticToken', {
                required: authType === 'STATIC_BEARER' ? 'Bearer token is required' : false,
              })}
            />
          </Field>
        );

      case 'API_KEY':
        return (
          <>
            <Field
              label="API Key Header Name"
              htmlFor="auth.apiKeyHeader"
              error={errors.auth?.apiKeyHeader?.message}
              hint="The header where the API key will be sent (e.g., X-API-Key)"
            >
              <TextInput
                id="auth.apiKeyHeader"
                placeholder="X-API-Key"
                error={errors.auth?.apiKeyHeader}
                {...register('auth.apiKeyHeader', {
                  required: authType === 'API_KEY' ? 'API key header is required' : false,
                })}
              />
            </Field>
            <Field label="API Key Value" htmlFor="auth.apiKeyValue" error={errors.auth?.apiKeyValue?.message}>
              <TextInput
                id="auth.apiKeyValue"
                type="password"
                placeholder="Your API key"
                error={errors.auth?.apiKeyValue}
                {...register('auth.apiKeyValue', {
                  required: authType === 'API_KEY' ? 'API key value is required' : false,
                })}
              />
            </Field>
          </>
        );

      case 'API_KEY_QUERY':
        return (
          <>
            <Field
              label="Query Parameter Name"
              htmlFor="auth.apiKeyQueryParam"
              hint="e.g. api_key, apikey, token — the endpoint will be called as ?that_name=value"
              error={errors.auth?.apiKeyQueryParam?.message}
            >
              <TextInput
                id="auth.apiKeyQueryParam"
                placeholder="api_key"
                error={errors.auth?.apiKeyQueryParam}
                {...register('auth.apiKeyQueryParam', {
                  required: authType === 'API_KEY_QUERY' ? 'Query parameter name is required' : false,
                })}
              />
            </Field>
            <Field label="API Key Value" htmlFor="auth.apiKeyValue" error={errors.auth?.apiKeyValue?.message}>
              <TextInput
                id="auth.apiKeyValue"
                type="password"
                placeholder="Your API key"
                error={errors.auth?.apiKeyValue}
                {...register('auth.apiKeyValue', {
                  required: authType === 'API_KEY_QUERY' ? 'API key value is required' : false,
                })}
              />
            </Field>
          </>
        );

      case 'BASIC':
        return (
          <>
            <Field label="Username" htmlFor="auth.basicUsername" error={errors.auth?.basicUsername?.message}>
              <TextInput
                id="auth.basicUsername"
                placeholder="admin"
                error={errors.auth?.basicUsername}
                {...register('auth.basicUsername', {
                  required: authType === 'BASIC' ? 'Username is required' : false,
                })}
              />
            </Field>
            <Field label="Password" htmlFor="auth.basicPassword" error={errors.auth?.basicPassword?.message}>
              <TextInput
                id="auth.basicPassword"
                type="password"
                placeholder="••••••••"
                error={errors.auth?.basicPassword}
                {...register('auth.basicPassword', {
                  required: authType === 'BASIC' ? 'Password is required' : false,
                })}
              />
            </Field>
          </>
        );

      case 'HMAC':
        return (
          <>
            <Field
              label="Shared Secret"
              htmlFor="auth.hmacSecret"
              error={errors.auth?.hmacSecret?.message}
              hint="Used to compute an HMAC-SHA256 signature for every request."
            >
              <TextInput
                id="auth.hmacSecret"
                type="password"
                placeholder="your-shared-secret"
                error={errors.auth?.hmacSecret}
                {...register('auth.hmacSecret', {
                  required: authType === 'HMAC' ? 'Shared secret is required' : false,
                })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Signature Header" htmlFor="auth.hmacSignatureHeader">
                <TextInput id="auth.hmacSignatureHeader" placeholder="X-Signature" {...register('auth.hmacSignatureHeader')} />
              </Field>
              <Field label="Timestamp Header" htmlFor="auth.hmacTimestampHeader">
                <TextInput id="auth.hmacTimestampHeader" placeholder="X-Timestamp" {...register('auth.hmacTimestampHeader')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nonce Header" htmlFor="auth.hmacNonceHeader" hint="Optional">
                <TextInput id="auth.hmacNonceHeader" placeholder="X-Nonce (optional)" {...register('auth.hmacNonceHeader')} />
              </Field>
              <Field label="Signature Format" htmlFor="auth.hmacFormat">
                <Select id="auth.hmacFormat" {...register('auth.hmacFormat')}>
                  <option value="hex">hex</option>
                  <option value="base64">base64</option>
                </Select>
              </Field>
            </div>
            <Field
              label="Signed Fields (order matters)"
              htmlFor="auth.hmacSignedFieldsText"
              hint="Comma-separated, from: timestamp, nonce, method, path, body"
            >
              <TextInput
                id="auth.hmacSignedFieldsText"
                placeholder="timestamp,method,path,body"
                {...register('auth.hmacSignedFieldsText')}
              />
            </Field>
          </>
        );

      case 'OAUTH2_CLIENT_CREDENTIALS':
        return (
          <>
            <Field
              label="Token URL"
              htmlFor="auth.oauth2Config.tokenUrl"
              error={errors.auth?.oauth2Config?.tokenUrl?.message}
            >
              <TextInput
                id="auth.oauth2Config.tokenUrl"
                placeholder="https://auth.example.com/oauth/token"
                error={errors.auth?.oauth2Config?.tokenUrl}
                {...register('auth.oauth2Config.tokenUrl', {
                  required: authType === 'OAUTH2_CLIENT_CREDENTIALS' ? 'Token URL is required' : false,
                })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client ID" htmlFor="auth.oauth2Config.clientId">
                <TextInput id="auth.oauth2Config.clientId" {...register('auth.oauth2Config.clientId')} />
              </Field>
              <Field label="Client Secret" htmlFor="auth.oauth2Config.clientSecret">
                <TextInput id="auth.oauth2Config.clientSecret" type="password" {...register('auth.oauth2Config.clientSecret')} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Scope" htmlFor="auth.oauth2Config.scope" hint="Optional">
                <TextInput id="auth.oauth2Config.scope" placeholder="read write" {...register('auth.oauth2Config.scope')} />
              </Field>
              <Field label="Audience" htmlFor="auth.oauth2Config.audience" hint="Optional">
                <TextInput id="auth.oauth2Config.audience" {...register('auth.oauth2Config.audience')} />
              </Field>
            </div>
          </>
        );

      case 'OAUTH2_REFRESH_TOKEN':
        return (
          <>
            <Field label="Token URL" htmlFor="auth.oauth2Config.tokenUrl" error={errors.auth?.oauth2Config?.tokenUrl?.message}>
              <TextInput
                id="auth.oauth2Config.tokenUrl"
                placeholder="https://auth.example.com/oauth/token"
                error={errors.auth?.oauth2Config?.tokenUrl}
                {...register('auth.oauth2Config.tokenUrl', {
                  required: authType === 'OAUTH2_REFRESH_TOKEN' ? 'Token URL is required' : false,
                })}
              />
            </Field>
            <Field
              label="Refresh Token"
              htmlFor="auth.oauth2Config.refreshToken"
              hint="Never shown back once saved — leave blank on edit to keep the existing one."
              error={errors.auth?.oauth2Config?.refreshToken?.message}
            >
              <TextInput
                id="auth.oauth2Config.refreshToken"
                type="password"
                error={errors.auth?.oauth2Config?.refreshToken}
                {...register('auth.oauth2Config.refreshToken', {
                  required: authType === 'OAUTH2_REFRESH_TOKEN' && !defaultValues ? 'Refresh token is required' : false,
                })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Client ID" htmlFor="auth.oauth2Config.clientId" hint="Optional — some providers require it">
                <TextInput id="auth.oauth2Config.clientId" {...register('auth.oauth2Config.clientId')} />
              </Field>
              <Field label="Client Secret" htmlFor="auth.oauth2Config.clientSecret" hint="Optional">
                <TextInput id="auth.oauth2Config.clientSecret" type="password" {...register('auth.oauth2Config.clientSecret')} />
              </Field>
            </div>
          </>
        );

      case 'LOGIN_FLOW':
        return (
          <>
            <div className="flex items-center gap-3">
              <input
                id="auth.useMultiStep"
                type="checkbox"
                className="h-4 w-4 rounded border-border-strong bg-surface-container-low text-primary focus-ring"
                {...register('auth.useMultiStep')}
              />
              <label htmlFor="auth.useMultiStep" className="text-sm text-text-secondary">
                Advanced: multi-step login (CSRF token, session cookie, chained requests)
              </label>
            </div>

            {useMultiStep ? (
              <div className="space-y-3 border-t border-border pt-4">
                {stepsArray.fields.map((field, index) => (
                  <LoginStepRow
                    key={field.id}
                    control={control}
                    register={register}
                    stepName={`auth.loginConfig.stepsList.${index}`}
                    index={index}
                    onRemove={() => stepsArray.remove(index)}
                  />
                ))}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon={Plus}
                  onClick={() => stepsArray.append(emptyLoginStep())}
                >
                  Add step
                </Button>

                <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                  <Field
                    label="Token Variable"
                    htmlFor="auth.loginConfig.tokenVariable"
                    hint="Which extracted variable becomes the auth token"
                  >
                    <TextInput
                      id="auth.loginConfig.tokenVariable"
                      placeholder="token"
                      {...register('auth.loginConfig.tokenVariable')}
                    />
                  </Field>
                  <Field label="Send as Bearer" htmlFor="auth.loginConfig.asBearerMulti">
                    <div className="flex h-full items-center gap-3 pt-2">
                      <input
                        id="auth.loginConfig.asBearerMulti"
                        type="checkbox"
                        className="h-4 w-4 rounded border-border-strong bg-surface-container-low text-primary focus-ring"
                        {...register('auth.loginConfig.asBearer')}
                      />
                      <label htmlFor="auth.loginConfig.asBearerMulti" className="text-sm text-text-secondary">
                        Bearer token
                      </label>
                    </div>
                  </Field>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    id="auth.loginConfig.forwardCookies"
                    type="checkbox"
                    className="h-4 w-4 rounded border-border-strong bg-surface-container-low text-primary focus-ring"
                    {...register('auth.loginConfig.forwardCookies')}
                  />
                  <label htmlFor="auth.loginConfig.forwardCookies" className="text-sm text-text-secondary">
                    Also send the session cookie jar on the monitored request (session-cookie APIs)
                  </label>
                </div>
              </div>
            ) : (
              <>
                <Field
                  label="Login URL"
                  htmlFor="auth.loginConfig.loginUrl"
                  error={errors.auth?.loginConfig?.loginUrl?.message}
                  hint="The endpoint that returns an authentication token"
                >
                  <TextInput
                    id="auth.loginConfig.loginUrl"
                    placeholder="https://api.example.com/auth/login"
                    error={errors.auth?.loginConfig?.loginUrl}
                    {...register('auth.loginConfig.loginUrl', {
                      required: authType === 'LOGIN_FLOW' && !useMultiStep ? 'Login URL is required' : false,
                    })}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                  <Field label="Login Method" htmlFor="auth.loginConfig.method">
                    <Select id="auth.loginConfig.method" {...register('auth.loginConfig.method')}>
                      {LOGIN_HTTP_METHODS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Token Path"
                    htmlFor="auth.loginConfig.tokenPath"
                    hint="Dot-notation path to the token in the response"
                  >
                    <TextInput
                      id="auth.loginConfig.tokenPath"
                      placeholder="data.accessToken"
                      {...register('auth.loginConfig.tokenPath')}
                    />
                  </Field>
                </div>

                <Field
                  label="Login Body (JSON)"
                  htmlFor="auth.loginConfig.body"
                  hint='Enter a valid JSON object, e.g. { "email": "user@example.com", "password": "secret" }'
                  error={errors.auth?.loginConfig?.body?.message}
                >
                  <Textarea
                    id="auth.loginConfig.body"
                    rows={4}
                    placeholder='{"email": "user@example.com", "password": "secret"}'
                    error={errors.auth?.loginConfig?.body}
                    {...register('auth.loginConfig.body', {
                      required: authType === 'LOGIN_FLOW' && !useMultiStep ? 'Login body is required' : false,
                      validate: (val) => {
                        if (authType !== 'LOGIN_FLOW' || useMultiStep) return true;
                        if (!val || typeof val !== 'string' || val.trim() === '') return 'Login body is required';
                        try {
                          const parsed = JSON.parse(val.trim());
                          if (typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).length === 0) {
                            return 'Login body must be a non-empty JSON object';
                          }
                          return true;
                        } catch {
                          return 'Invalid JSON format. Please enter a valid JSON object.';
                        }
                      },
                    })}
                  />
                </Field>

                <Field
                  label="Send as Bearer"
                  htmlFor="auth.loginConfig.asBearer"
                  hint="If unchecked, the raw token is sent in the Authorization header without 'Bearer ' prefix"
                >
                  <div className="flex items-center gap-3">
                    <input
                      id="auth.loginConfig.asBearer"
                      type="checkbox"
                      className="h-4 w-4 rounded border-border-strong bg-surface-container-low text-primary focus-ring"
                      {...register('auth.loginConfig.asBearer')}
                    />
                    <label htmlFor="auth.loginConfig.asBearer" className="text-sm text-text-secondary">
                      Send token as Bearer
                    </label>
                  </div>
                </Field>
              </>
            )}
          </>
        );

      default:
        return <p className="text-sm text-text-secondary">No authentication configured for this endpoint.</p>;
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Primary Identification</p>
        <Field
          label="API Name"
          htmlFor="name"
          error={errors.name?.message}
          hint="Internal identifier for this monitoring task."
          required
        >
          <TextInput
            id="name"
            placeholder="Production User Service"
            error={errors.name}
            {...register('name', {
              required: 'Name is required',
              minLength: { value: 3, message: 'Must be at least 3 characters' },
              maxLength: { value: 150, message: 'Must be at most 150 characters' },
            })}
          />
        </Field>

        <Field label="Endpoint URL" htmlFor="url" error={errors.url?.message} required>
          <TextInput
            id="url"
            placeholder="https://api.example.com/v1/health"
            error={errors.url}
            {...register('url', {
              required: 'URL is required',
              pattern: { value: /^https?:\/\/.+/i, message: 'URL must start with http:// or https://' },
            })}
          />
        </Field>
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Request Parameters</p>
        <div className="grid grid-cols-2 gap-4">
          <Field label="HTTP Method" htmlFor="method">
            <Select id="method" {...register('method')}>
              {HTTP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Expected Status" htmlFor="expectedStatus" error={errors.expectedStatus?.message}>
            <Select
              id="expectedStatus"
              error={errors.expectedStatus}
              {...register('expectedStatus', {
                required: true,
                min: { value: 100, message: 'Must be between 100 and 599' },
                max: { value: 599, message: 'Must be between 100 and 599' },
              })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Monitoring Frequency"
          htmlFor="frequency"
          hint={
            allowFrequency
              ? 'How often this endpoint gets checked automatically.'
              : "Set after creation — the backend's create endpoint doesn't accept a custom frequency yet, only update does."
          }
        >
          <div className="grid grid-cols-4 gap-2">
            {FREQUENCY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex items-center justify-center rounded-lg border px-2 py-2 text-sm transition-colors ${
                  allowFrequency
                    ? 'cursor-pointer border-border bg-surface-container-low text-text-primary has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:text-primary'
                    : 'cursor-not-allowed border-border bg-surface-container-low text-text-muted opacity-60'
                }`}
              >
                <input
                  type="radio"
                  value={opt.value}
                  disabled={!allowFrequency}
                  className="sr-only"
                  {...register('frequency', { valueAsNumber: true })}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Custom Headers" hint="Sent with every check. Values may use {{timestamp}}, {{uuid}}, {{isoDate}}, {{environment}}.">
          <KeyValueListEditor
            control={control}
            register={register}
            name="headersList"
            keyPlaceholder="Header name"
            valuePlaceholder="Value"
            addLabel="Add header"
            emptyLabel="No custom headers."
          />
        </Field>

        <Field label="Query Parameters" hint="Same dynamic placeholders as headers are supported here too.">
          <KeyValueListEditor
            control={control}
            register={register}
            name="queryParamsList"
            keyPlaceholder="Param name"
            valuePlaceholder="Value"
            addLabel="Add query param"
            emptyLabel="No custom query parameters."
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Body Type" htmlFor="bodyType">
            <Select id="bodyType" {...register('bodyType')}>
              {BODY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {BODY_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {bodyType !== 'NONE' && (
          <Field
            label="Request Body"
            htmlFor="body"
            hint={
              bodyType === 'JSON' || bodyType === 'MULTIPART'
                ? 'Enter a JSON object.'
                : bodyType === 'XML'
                  ? 'Raw XML, sent exactly as written.'
                  : 'Raw text or key=value pairs, sent exactly as written.'
            }
          >
            <Textarea id="body" rows={4} placeholder={bodyType === 'XML' ? '<root><foo>bar</foo></root>' : '{ }'} {...register('body')} />
          </Field>
        )}
      </div>

      {/* ============================================================
        Authentication Section
        ============================================================ */}
      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Authentication</p>

        <Field label="Authentication Type" htmlFor="auth.type" hint={AUTH_TYPE_DESCRIPTIONS[authType]}>
          <Select id="auth.type" {...register('auth.type')} className="w-full">
            {AUTH_TYPES.map((type) => (
              <option key={type} value={type}>
                {AUTH_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-lg border border-border bg-surface-container-low p-4 space-y-4">{renderAuthFields()}</div>
      </div>

      {/* ============================================================
        Response Validation Rules
        ============================================================ */}
      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Response Validation Rules</p>
        <p className="text-xs text-text-muted">
          Only checked once the status code already matches Expected Status above. The first failing rule marks the check DOWN with a specific reason.
        </p>
        <ValidationRulesEditor control={control} register={register} watch={watch} name="validationRulesList" />
      </div>

      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Documentation</p>
        <Field label="Description" htmlFor="description" error={errors.description?.message}>
          <Textarea
            id="description"
            rows={4}
            placeholder="What does this endpoint do, and why does it matter if it goes down?"
            error={errors.description}
            {...register('description', { maxLength: { value: 1000, message: 'Must be at most 1000 characters' } })}
          />
        </Field>
      </div>

      <div className="flex justify-end gap-3 border-t border-border pt-6">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" icon={Save} isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
