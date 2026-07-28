import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { TextInput, Select } from './FormField';
import Button from './Button';
import { VALIDATION_RULE_TYPES, VALIDATION_RULE_LABELS, VALIDATION_RULE_FIELDS } from '../../utils/constants';

/**
 * ValidationRulesEditor — builds the `validationRules` array the backend's
 * responseValidator.service.js evaluates after a check's status code
 * already matches expectedStatus. Each rule stores every possible field
 * (header/value/pattern/path/bytes/ms) so switching a row's type doesn't
 * lose data entered for a different type, but only the fields relevant to
 * the currently selected type (see VALIDATION_RULE_FIELDS) are shown and
 * ultimately sent to the backend — see cleanValidationRules() below.
 */
export default function ValidationRulesEditor({ control, register, watch, name }) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-3">
      {fields.length === 0 && (
        <p className="text-xs text-text-muted">
          No validation rules configured — only the expected status code is checked.
        </p>
      )}

      {fields.map((field, index) => {
        const currentType = watch(`${name}.${index}.type`) || VALIDATION_RULE_TYPES[0];
        const ruleFields = VALIDATION_RULE_FIELDS[currentType] || [];

        return (
          <div key={field.id} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center gap-2">
              <Select className="flex-1" {...register(`${name}.${index}.type`)}>
                {VALIDATION_RULE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {VALIDATION_RULE_LABELS[type]}
                  </option>
                ))}
              </Select>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label="Remove rule"
                className="shrink-0 rounded-lg border border-border p-2.5 text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {ruleFields.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {ruleFields.map((f) => (
                  <TextInput
                    key={f.name}
                    type={f.type}
                    placeholder={`${f.label} — e.g. ${f.placeholder}`}
                    {...register(
                      `${name}.${index}.${f.name}`,
                      f.type === 'number' ? { valueAsNumber: true } : {}
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        icon={Plus}
        onClick={() => append({ type: VALIDATION_RULE_TYPES[0] })}
      >
        Add validation rule
      </Button>
    </div>
  );
}

/**
 * Strips each rule down to just { type, ...fields the type actually uses }
 * and drops any rule left incomplete (matches the backend's discriminated
 * Zod union, which rejects extra/missing fields per type).
 */
export function cleanValidationRules(list) {
  if (!Array.isArray(list)) return [];

  return list
    .filter((rule) => rule && rule.type)
    .map((rule) => {
      const fieldsForType = VALIDATION_RULE_FIELDS[rule.type] || [];
      const cleaned = { type: rule.type };
      for (const f of fieldsForType) {
        cleaned[f.name] = f.type === 'number' ? Number(rule[f.name]) : rule[f.name];
      }
      return cleaned;
    })
    .filter((rule) => {
      const fieldsForType = VALIDATION_RULE_FIELDS[rule.type] || [];
      return fieldsForType.every((f) => {
        const value = rule[f.name];
        if (f.type === 'number') return typeof value === 'number' && !Number.isNaN(value);
        return value !== undefined && value !== null && String(value).trim() !== '';
      });
    });
}
