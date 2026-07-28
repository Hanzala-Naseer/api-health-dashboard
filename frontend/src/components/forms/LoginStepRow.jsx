import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { Field, TextInput, Select, Textarea } from '../common/FormField';
import Button from '../common/Button';
import { LOGIN_HTTP_METHODS, LOGIN_STEP_EXTRACT_SOURCES } from '../../utils/constants';

/**
 * One row in the multi-step login builder (LOGIN_FLOW with
 * auth.loginConfig.steps — see helpers/multiStepLogin.js on the backend).
 *
 * Each step can extract named variables from its own response (body via
 * JSONPath-lite, a header, or a cookie), which later steps reference as
 * {{var.NAME}} in their own url/headers/body. That per-step extract list
 * is itself a field array, so it lives in its own component — nested
 * useFieldArray calls can't be made conditionally inside a .map(), they
 * need their own stable component to call the hook from.
 */
export default function LoginStepRow({ control, register, stepName, index, onRemove }) {
  const extractArray = useFieldArray({ control, name: `${stepName}.extract` });

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-container-low p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Step {index + 1}</p>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove step"
          className="shrink-0 rounded-lg border border-border p-2 text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Field label="Step Name" hint="Optional, shown in error messages if this step fails">
        <TextInput placeholder="e.g. get-csrf-token" {...register(`${stepName}.name`)} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Method">
          <Select {...register(`${stepName}.method`)}>
            {LOGIN_HTTP_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="URL">
          <TextInput placeholder="https://api.example.com/login" {...register(`${stepName}.url`)} />
        </Field>
      </div>

      <Field
        label="Headers (JSON)"
        hint={'Optional. Reference earlier steps\u2019 extracted variables as {{var.NAME}}, e.g. { "X-CSRF-Token": "{{var.csrf}}" }'}
      >
        <Textarea rows={2} placeholder="{}" {...register(`${stepName}.headersJson`)} />
      </Field>

      <Field label="Body (JSON, optional)" hint="Leave blank for GET/steps with no body">
        <Textarea rows={2} placeholder='{ "username": "...", "password": "..." }' {...register(`${stepName}.bodyJson`)} />
      </Field>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-semibold text-text-secondary">Extract variables from this step's response</p>
        {extractArray.fields.length === 0 && (
          <p className="text-xs text-text-muted">No extraction rules — this step runs but doesn't capture anything.</p>
        )}
        {extractArray.fields.map((field, extractIndex) => (
          <div key={field.id} className="flex items-center gap-2">
            <TextInput
              placeholder="Variable name"
              className="flex-1"
              {...register(`${stepName}.extract.${extractIndex}.name`)}
            />
            <Select className="w-28 shrink-0" {...register(`${stepName}.extract.${extractIndex}.from`)}>
              {LOGIN_STEP_EXTRACT_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {source}
                </option>
              ))}
            </Select>
            <TextInput
              placeholder="Path / header / cookie name"
              className="flex-1"
              {...register(`${stepName}.extract.${extractIndex}.path`)}
            />
            <button
              type="button"
              onClick={() => extractArray.remove(extractIndex)}
              aria-label="Remove extraction rule"
              className="shrink-0 rounded-lg border border-border p-2 text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          icon={Plus}
          onClick={() => extractArray.append({ name: '', from: 'body', path: '' })}
        >
          Add extraction rule
        </Button>
      </div>
    </div>
  );
}
