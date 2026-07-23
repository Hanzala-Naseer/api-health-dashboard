import { useForm } from 'react-hook-form';
import { Save } from 'lucide-react';
import { HTTP_METHODS } from '../../utils/constants';
import { Field, TextInput, Select, Textarea } from '../common/FormField';
import Button from '../common/Button';

const FREQUENCY_OPTIONS = [
  { label: '30s', value: 30 },
  { label: '1m', value: 60 },
  { label: '5m', value: 300 },
  { label: '15m', value: 900 },
];

const STATUS_OPTIONS = [200, 201, 204, 301, 302, 400, 401, 403, 404, 500, 502, 503];

export default function EndpointForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  submitLabel = 'Save Endpoint',
  allowFrequency = false,
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: '',
      url: '',
      method: 'GET',
      expectedStatus: 200,
      frequency: 300,
      description: '',
      ...defaultValues,
    },
  });

  function submit(values) {
    const payload = { ...values, expectedStatus: Number(values.expectedStatus) };
    if (allowFrequency) {
      // updateEndpointSchema accepts frequency (seconds, min 10) — real field.
      payload.frequency = Number(values.frequency);
    } else {
      // createEndpointSchema is .strict() and does NOT list frequency —
      // sending it on create would 400.
      delete payload.frequency;
    }
    onSubmit(payload);
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
