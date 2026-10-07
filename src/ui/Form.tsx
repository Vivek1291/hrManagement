import React, { useState } from 'react';
import { getByPath, setByPath } from '../core/client';
import { useAsync, useHR } from '../core/context';
import { errorStatus } from '../core/permissions';
import type { FieldConfig, FieldOption } from '../types';
import { Button, controlHeight, inputClass } from './Button';
import { cn } from './cn';

function SelectOptions({ field }: { field: FieldConfig }) {
  const { api, baseVars } = useHR();
  const { data, loading, error } = useAsync<FieldOption[]>(async (signal) => {
    if (!field.optionsEndpoint) return field.options ?? [];
    const { items } = await api.list<Record<string, any>>(field.optionsEndpoint, { vars: baseVars, signal });
    const labelKey = field.optionLabelKey ?? 'name';
    const valueKey = field.optionValueKey ?? 'id';
    return items.map((item) =>
      typeof item === 'object'
        ? { label: String(getByPath(item, labelKey) ?? getByPath(item, valueKey)), value: getByPath(item, valueKey) }
        : { label: String(item), value: item as any },
    );
  }, [JSON.stringify(field.optionsEndpoint ?? field.options ?? null)]);

  if (loading) return <option disabled>Loading…</option>;
  if (error) return <option disabled>{error.message}</option>;
  return (
    <>
      {(data ?? []).map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </>
  );
}

export function FieldInput({
  field,
  value,
  onChange,
  error,
}: {
  field: FieldConfig;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
}) {
  const id = `hrm-field-${field.name.replace(/\W/g, '-')}`;
  const type = field.type ?? 'text';
  if (type === 'hidden') return null;

  const common = {
    id,
    name: field.name,
    required: field.required,
    readOnly: field.readOnly,
    disabled: field.readOnly && (type === 'select' || type === 'checkbox'),
    placeholder: field.placeholder,
    'aria-invalid': !!error || undefined,
    className: cn(inputClass, type !== 'textarea' && controlHeight, field.readOnly && 'hrm:bg-bg'),
  };
  const errorEl = error && <span className="hrm:text-xs hrm:text-danger">{error}</span>;

  let input: React.ReactNode;
  if (type === 'textarea') {
    input = <textarea {...common} rows={4} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  } else if (type === 'select') {
    const isNumeric = (field.options ?? []).some((o) => typeof o.value === 'number');
    input = (
      <select
        {...common}
        value={value === undefined || value === null ? '' : String(value)}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? undefined : isNumeric && !isNaN(Number(v)) ? Number(v) : v);
        }}
      >
        <option value="">{field.placeholder ?? '—'}</option>
        <SelectOptions field={field} />
      </select>
    );
  } else if (type === 'checkbox') {
    return (
      <label className="hrm:flex hrm:cursor-pointer hrm:items-center hrm:gap-2 hrm:pt-6" htmlFor={id}>
        <input
          {...common}
          className="hrm:size-4 hrm:accent-primary"
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="hrm:font-medium">{field.label}</span>
        {errorEl}
      </label>
    );
  } else if (type === 'file') {
    input = <input {...common} className={cn(inputClass, controlHeight, 'hrm:py-1.5 hrm:file:mr-3 hrm:file:rounded-md hrm:file:bg-bg hrm:file:px-2 hrm:file:py-1 hrm:file:font-medium')} type="file" onChange={(e) => onChange(e.target.files?.[0])} />;
  } else {
    input = (
      <input
        {...common}
        type={type}
        min={field.min}
        max={field.max}
        pattern={field.pattern}
        value={value === undefined || value === null ? '' : String(value).slice(0, type === 'date' ? 10 : undefined)}
        onChange={(e) => onChange(type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
      />
    );
  }

  return (
    <div className="hrm:flex hrm:flex-col hrm:gap-1.5">
      <label htmlFor={id} className="hrm:text-[13px] hrm:font-medium">
        {field.label}
        {field.required && <span className="hrm:text-danger"> *</span>}
      </label>
      {input}
      {field.helpText && !error && <small className="hrm:text-xs hrm:text-muted">{field.helpText}</small>}
      {errorEl}
    </div>
  );
}

export function initialFormValues(fields: FieldConfig[], record?: Record<string, any>): Record<string, any> {
  let values: Record<string, any> = {};
  fields.forEach((f) => {
    const v = record ? getByPath(record, f.name) : undefined;
    const value = v !== undefined ? v : f.defaultValue;
    if (value !== undefined) values = setByPath(values, f.name, value);
  });
  return values;
}

export function validateForm(fields: FieldConfig[], values: Record<string, any>, requiredMsg: string) {
  const errors: Record<string, string> = {};
  fields.forEach((f) => {
    const v = getByPath(values, f.name);
    if (f.required && (v === undefined || v === null || v === '' || (f.type === 'checkbox' && !v))) {
      errors[f.name] = requiredMsg;
      return;
    }
    const custom = f.validate?.(v, values);
    if (custom) errors[f.name] = custom;
  });
  return errors;
}

export function ResourceForm({
  fields,
  initialValues,
  onSubmit,
  onCancel,
  submitLabel,
  formId,
  hideButtons,
  singleColumn,
}: {
  fields: FieldConfig[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  formId?: string;
  hideButtons?: boolean;
  singleColumn?: boolean;
}) {
  const { labels } = useHR();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateForm(fields, values, labels.required);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    setSubmitError(undefined);
    try {
      await onSubmit(values);
    } catch (err) {
      setSubmitError(errorStatus(err) === 403 ? labels.forbiddenAction : err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} className="hrm:flex hrm:flex-col hrm:gap-4" onSubmit={handleSubmit} noValidate>
      {submitError && (
        <div role="alert" className="hrm:rounded-lg hrm:border hrm:border-red-200 hrm:bg-red-50 hrm:px-4 hrm:py-3 hrm:text-red-800">
          {submitError}
        </div>
      )}
      <div className={cn('hrm:grid hrm:grid-cols-1 hrm:gap-4', !singleColumn && 'hrm:md:grid-cols-2')}>
        {fields.map((field) => (
          <div
            key={field.name}
            className={cn((field.fullWidth || field.type === 'textarea') && 'hrm:md:col-span-2')}
            hidden={field.type === 'hidden'}
          >
            <FieldInput
              field={field}
              value={getByPath(values, field.name)}
              error={errors[field.name]}
              onChange={(v) => setValues((prev) => setByPath(prev, field.name, v))}
            />
          </div>
        ))}
      </div>
      {!hideButtons && (
        <div className="hrm:flex hrm:justify-end hrm:gap-2">
          {onCancel && (
            <Button onClick={onCancel} disabled={submitting}>
              {labels.cancel}
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? labels.loading : submitLabel ?? labels.save}
          </Button>
        </div>
      )}
    </form>
  );
}
