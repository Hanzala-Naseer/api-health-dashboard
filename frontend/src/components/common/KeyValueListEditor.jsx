import { useFieldArray } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { TextInput } from './FormField';
import Button from './Button';

/**
 * KeyValueListEditor — used for headers and queryParams on the endpoint
 * form. The backend stores these as a plain { key: value } object, but
 * react-hook-form's useFieldArray needs an array of objects to manage
 * add/remove rows properly — so the form holds an array of {key, value}
 * pairs under `name` (e.g. "headersList"), and the parent form converts
 * to/from the plain-object shape at load/submit time via the two helpers
 * exported below.
 */
export default function KeyValueListEditor({
  control,
  register,
  name,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
  addLabel = 'Add row',
  emptyLabel = 'None configured.',
}) {
  const { fields, append, remove } = useFieldArray({ control, name });

  return (
    <div className="space-y-2">
      {fields.length === 0 && <p className="text-xs text-text-muted">{emptyLabel}</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="flex items-center gap-2">
          <TextInput placeholder={keyPlaceholder} {...register(`${name}.${index}.key`)} />
          <TextInput placeholder={valuePlaceholder} {...register(`${name}.${index}.value`)} />
          <button
            type="button"
            onClick={() => remove(index)}
            aria-label="Remove row"
            className="shrink-0 rounded-lg border border-border p-2.5 text-text-secondary transition-colors hover:border-danger/40 hover:text-danger"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <Button type="button" variant="ghost" size="sm" icon={Plus} onClick={() => append({ key: '', value: '' })}>
        {addLabel}
      </Button>
    </div>
  );
}

/** Converts the form's {key,value}[] array into the plain object the backend expects. */
export function keyValueListToObject(list) {
  if (!Array.isArray(list)) return {};
  return list.reduce((acc, row) => {
    const key = row?.key?.trim();
    if (key) acc[key] = row.value ?? '';
    return acc;
  }, {});
}

/** Converts a plain object (from the backend) into the form's {key,value}[] array shape. */
export function objectToKeyValueList(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.entries(obj).map(([key, value]) => ({ key, value: value == null ? '' : String(value) }));
}
