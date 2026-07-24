// import { useForm } from 'react-hook-form';
// import { Save } from 'lucide-react';
// import { HTTP_METHODS } from '../../utils/constants';
// import { Field, TextInput, Select, Textarea } from '../common/FormField';
// import Button from '../common/Button';

// const FREQUENCY_OPTIONS = [
//   { label: '30s', value: 30 },
//   { label: '1m', value: 60 },
//   { label: '5m', value: 300 },
//   { label: '15m', value: 900 },
// ];

// const STATUS_OPTIONS = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

// export default function EndpointForm({
//   defaultValues,
//   onSubmit,
//   onCancel,
//   isSubmitting,
//   submitLabel = 'Save Endpoint',
//   allowFrequency = false,
// }) {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//   } = useForm({
//     defaultValues: {
//       name: '',
//       url: '',
//       method: 'GET',
//       expectedStatus: 200,
//       frequency: 300,
//       description: '',
//       ...defaultValues,
//     },
//   });

//   function submit(values) {
//     const payload = { ...values, expectedStatus: Number(values.expectedStatus) };
//     if (allowFrequency) {
//       // updateEndpointSchema accepts frequency (seconds, min 10) — real field.
//       payload.frequency = Number(values.frequency);
//     } else {
//       // createEndpointSchema is .strict() and does NOT list frequency —
//       // sending it on create would 400.
//       delete payload.frequency;
//     }
//     onSubmit(payload);
//   }

//   return (
//     <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
//       <div className="space-y-4">
//         <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
//           Primary Identification
//         </p>
//         <Field label="API Name" htmlFor="name" error={errors.name?.message} hint="Internal identifier for this monitoring task." required>
//           <TextInput
//             id="name"
//             placeholder="Production User Service"
//             error={errors.name}
//             {...register('name', {
//               required: 'Name is required',
//               minLength: { value: 3, message: 'Must be at least 3 characters' },
//               maxLength: { value: 150, message: 'Must be at most 150 characters' },
//             })}
//           />
//         </Field>

//         <Field label="Endpoint URL" htmlFor="url" error={errors.url?.message} required>
//           <TextInput
//             id="url"
//             placeholder="https://api.example.com/v1/health"
//             error={errors.url}
//             {...register('url', {
//               required: 'URL is required',
//               pattern: {
//                 value: /^https?:\/\/.+/i,
//                 message: 'URL must start with http:// or https://',
//               },
//             })}
//           />
//         </Field>
//       </div>

//       <div className="space-y-4 border-t border-border pt-6">
//         <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Request Parameters</p>
//         <div className="grid grid-cols-2 gap-4">
//           <Field label="HTTP Method" htmlFor="method">
//             <Select id="method" {...register('method')}>
//               {HTTP_METHODS.map((m) => (
//                 <option key={m} value={m}>
//                   {m}
//                 </option>
//               ))}
//             </Select>
//           </Field>
//           <Field label="Expected Status" htmlFor="expectedStatus" error={errors.expectedStatus?.message}>
//             <Select
//               id="expectedStatus"
//               error={errors.expectedStatus}
//               {...register('expectedStatus', {
//                 required: true,
//                 min: { value: 100, message: 'Must be between 100 and 599' },
//                 max: { value: 599, message: 'Must be between 100 and 599' },
//               })}
//             >
//               {STATUS_OPTIONS.map((s) => (
//                 <option key={s} value={s}>
//                   {s}
//                 </option>
//               ))}
//             </Select>
//           </Field>
//         </div>

//         <Field
//           label="Monitoring Frequency"
//           htmlFor="frequency"
//           hint={
//             allowFrequency
//               ? 'How often this endpoint gets checked automatically.'
//               : "Set after creation — the backend's create endpoint doesn't accept a custom frequency yet, only update does."
//           }
//         >
//           <div className="grid grid-cols-4 gap-2">
//             {FREQUENCY_OPTIONS.map((opt) => (
//               <label
//                 key={opt.value}
//                 className={`flex items-center justify-center rounded-lg border px-2 py-2 text-sm transition-colors ${
//                   allowFrequency
//                     ? 'cursor-pointer border-border bg-surface-container-low text-text-primary has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:text-primary'
//                     : 'cursor-not-allowed border-border bg-surface-container-low text-text-muted opacity-60'
//                 }`}
//               >
//                 <input
//                   type="radio"
//                   value={opt.value}
//                   disabled={!allowFrequency}
//                   className="sr-only"
//                   {...register('frequency', { valueAsNumber: true })}
//                 />
//                 {opt.label}
//               </label>
//             ))}
//           </div>
//         </Field>
//       </div>

//       <div className="space-y-4 border-t border-border pt-6">
//         <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Documentation</p>
//         <Field label="Description" htmlFor="description" error={errors.description?.message}>
//           <Textarea
//             id="description"
//             rows={4}
//             placeholder="What does this endpoint do, and why does it matter if it goes down?"
//             error={errors.description}
//             {...register('description', { maxLength: { value: 1000, message: 'Must be at most 1000 characters' } })}
//           />
//         </Field>
//       </div>

//       <div className="flex justify-end gap-3 border-t border-border pt-6">
//         <Button type="button" variant="secondary" onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button type="submit" icon={Save} isLoading={isSubmitting}>
//           {submitLabel}
//         </Button>
//       </div>
//     </form>
//   );
// }
import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { HTTP_METHODS, AUTH_TYPES, AUTH_TYPE_LABELS, AUTH_TYPE_DESCRIPTIONS, LOGIN_HTTP_METHODS } from '../../utils/constants';
import { Field, TextInput, Select, Textarea } from '../common/FormField';
import Button from '../common/Button';

const FREQUENCY_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
];

const STATUS_OPTIONS = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

// Pre-filled demo login body as a STRING (not an object)
const DEMO_LOGIN_BODY = JSON.stringify({
  email: 'demo@pulseops.app',
  password: 'DemoPassword123!',
}, null, 2);

export default function EndpointForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save Endpoint',
  allowFrequency = false,
}) {
  // Build default values with proper auth merging
  const buildDefaultValues = () => {
    const baseDefaults = {
      name: '',
      url: '',
      method: 'GET',
      expectedStatus: 200,
      frequency: 300,
      description: '',
      auth: {
        type: 'NONE',
        staticToken: '',
        apiKeyHeader: '',
        apiKeyValue: '',
        basicUsername: '',
        basicPassword: '',
        loginConfig: {
          loginUrl: 'http://localhost:5001/api/health-demo/items/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: DEMO_LOGIN_BODY,
          tokenPath: 'data.accessToken',
          asBearer: true,
        },
      },
    };

    // If we have defaultValues from the parent (edit mode), merge them
    if (defaultValues) {
      // ⭐ FIX: defaultValues.auth should take precedence over baseDefaults.auth
      const mergedAuth = {
        ...baseDefaults.auth,        // Start with defaults
        ...defaultValues.auth,       // Override with actual data (this has LOGIN_FLOW)
      };

      // If auth has loginConfig, merge it properly
      if (defaultValues.auth?.loginConfig || baseDefaults.auth.loginConfig) {
        mergedAuth.loginConfig = {
          ...baseDefaults.auth.loginConfig,        // Start with defaults
          ...(defaultValues.auth?.loginConfig || {}), // Override with actual data
        };
        
        // Convert body to string if it's an object
        if (mergedAuth.loginConfig.body && typeof mergedAuth.loginConfig.body === 'object') {
          mergedAuth.loginConfig.body = JSON.stringify(mergedAuth.loginConfig.body, null, 2);
        }
      }

      return {
        ...baseDefaults,
        ...defaultValues,
        auth: mergedAuth,
      };
    }

    return baseDefaults;
  };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: buildDefaultValues(),
  });

  const authType = watch('auth.type') || 'NONE';

  function submit(values) {
    const payload = { ...values, expectedStatus: Number(values.expectedStatus) };
    if (allowFrequency) {
      payload.frequency = Number(values.frequency);
    } else {
      delete payload.frequency;
    }

    // Clean auth payload based on type
    if (payload.auth) {
      const { type } = payload.auth;

      if (type === 'NONE') {
        payload.auth = { type: 'NONE' };
      } else if (type === 'STATIC_BEARER') {
        payload.auth = {
          type,
          staticToken: payload.auth.staticToken,
        };
      } else if (type === 'API_KEY') {
        payload.auth = {
          type,
          apiKeyHeader: payload.auth.apiKeyHeader,
          apiKeyValue: payload.auth.apiKeyValue,
        };
      } else if (type === 'BASIC') {
        payload.auth = {
          type,
          basicUsername: payload.auth.basicUsername,
          basicPassword: payload.auth.basicPassword,
        };
      } else if (type === 'LOGIN_FLOW') {
        // For LOGIN_FLOW, parse the body string to an object
        let loginBody = payload.auth.loginConfig?.body;
        
        // If body is a string, try to parse it
        if (typeof loginBody === 'string') {
          try {
            loginBody = JSON.parse(loginBody);
          } catch (e) {
            // If parsing fails, keep the original string
            // Validation should catch this
          }
        }
        
        payload.auth = {
          type,
          loginConfig: {
            loginUrl: payload.auth.loginConfig?.loginUrl,
            method: payload.auth.loginConfig?.method || 'POST',
            headers: payload.auth.loginConfig?.headers || { 'Content-Type': 'application/json' },
            body: loginBody,
            tokenPath: payload.auth.loginConfig?.tokenPath || 'data.accessToken',
            asBearer: payload.auth.loginConfig?.asBearer !== false,
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
          <Field label="Static Bearer Token" htmlFor="auth.staticToken" error={errors.auth?.staticToken?.message} hint="The token will be sent as: Authorization: Bearer <token>">
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
            <Field label="API Key Header Name" htmlFor="auth.apiKeyHeader" error={errors.auth?.apiKeyHeader?.message} hint="The header where the API key will be sent (e.g., X-API-Key)">
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

      case 'LOGIN_FLOW':
        return (
          <>
            <Field label="Login URL" htmlFor="auth.loginConfig.loginUrl" error={errors.auth?.loginConfig?.loginUrl?.message} hint="The endpoint that returns an authentication token">
              <TextInput
                id="auth.loginConfig.loginUrl"
                placeholder="https://api.example.com/auth/login"
                error={errors.auth?.loginConfig?.loginUrl}
                {...register('auth.loginConfig.loginUrl', {
                  required: authType === 'LOGIN_FLOW' ? 'Login URL is required' : false,
                })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Login Method" htmlFor="auth.loginConfig.method">
                <Select
                  id="auth.loginConfig.method"
                  {...register('auth.loginConfig.method')}
                >
                  {LOGIN_HTTP_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Token Path" htmlFor="auth.loginConfig.tokenPath" hint="Dot-notation path to the token in the response">
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
                placeholder='{\n  "email": "user@example.com",\n  "password": "secret"\n}'
                error={errors.auth?.loginConfig?.body}
                {...register('auth.loginConfig.body', {
                  required: authType === 'LOGIN_FLOW' ? 'Login body is required' : false,
                  validate: (val) => {
                    if (authType !== 'LOGIN_FLOW') return true;
                    
                    if (!val || typeof val !== 'string') {
                      return 'Login body is required';
                    }
                    
                    const trimmed = val.trim();
                    if (trimmed === '') {
                      return 'Login body is required';
                    }
                    
                    try {
                      const parsed = JSON.parse(trimmed);
                      if (typeof parsed !== 'object' || Array.isArray(parsed) || Object.keys(parsed).length === 0) {
                        return 'Login body must be a non-empty JSON object';
                      }
                      return true;
                    } catch (e) {
                      return 'Invalid JSON format. Please enter a valid JSON object.';
                    }
                  },
                })}
              />
            </Field>

            <Field label="Send as Bearer" htmlFor="auth.loginConfig.asBearer" hint="If unchecked, the raw token is sent in the Authorization header without 'Bearer ' prefix">
              <div className="flex items-center gap-3">
                <input
                  id="auth.loginConfig.asBearer"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-strong bg-surface-container-low text-primary focus-ring"
                  {...register('auth.loginConfig.asBearer')}
                />
                <label htmlFor="auth.loginConfig.asBearer" className="text-sm text-text-secondary">Send token as Bearer</label>
              </div>
            </Field>
          </>
        );

      default:
        return (
          <p className="text-sm text-text-secondary">No authentication configured for this endpoint.</p>
        );
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Primary Identification
        </p>
        <Field label="API Name" htmlFor="name" error={errors.name?.message} hint="Internal identifier for this monitoring task." required>
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
              pattern: {
                value: /^https?:\/\/.+/i,
                message: 'URL must start with http:// or https://',
              },
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
      </div>

      {/* ============================================================
        V1.5 — Authentication Section
        ============================================================ */}
      <div className="space-y-4 border-t border-border pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
          Authentication <span className="font-normal text-text-muted">(V1.5)</span>
        </p>

        <Field label="Authentication Type" htmlFor="auth.type" hint={AUTH_TYPE_DESCRIPTIONS[authType]}>
          <Select
            id="auth.type"
            {...register('auth.type')}
            className="w-full"
          >
            {AUTH_TYPES.map((type) => (
              <option key={type} value={type}>
                {AUTH_TYPE_LABELS[type]}
              </option>
            ))}
          </Select>
        </Field>

        <div className="rounded-lg border border-border bg-surface-container-low p-4">
          {renderAuthFields()}
        </div>
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