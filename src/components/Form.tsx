import React, { useState } from 'react';
import { getByPath, setByPath } from '../api/client';
import { useAsync, useHR } from '../context';
import type { FieldConfig, FieldOption } from '../types';

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
  };

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
      <label className="hrm-checkbox" htmlFor={id}>
        <input {...common} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
        <span>{field.label}</span>
        {error && <span className="hrm-field-error">{error}</span>}
      </label>
    );
  } else if (type === 'file') {
    input = <input {...common} type="file" onChange={(e) => onChange(e.target.files?.[0])} />;
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
    <div className="hrm-field-inner">
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="hrm-required"> *</span>}
      </label>
      {input}
      {field.helpText && !error && <small className="hrm-muted">{field.helpText}</small>}
      {error && <span className="hrm-field-error">{error}</span>}
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
}: {
  fields: FieldConfig[];
  initialValues: Record<string, any>;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
  formId?: string;
  hideButtons?: boolean;
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
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form id={formId} className="hrm-form" onSubmit={handleSubmit} noValidate>
      {submitError && <div className="hrm-error" role="alert">{submitError}</div>}
      <div className="hrm-form-grid">
        {fields.map((field) => (
          <div
            key={field.name}
            className={`hrm-field${field.fullWidth || field.type === 'textarea' ? ' hrm-field-full' : ''}`}
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
        <div className="hrm-form-actions">
          {onCancel && (
            <button type="button" className="hrm-btn" onClick={onCancel} disabled={submitting}>
              {labels.cancel}
            </button>
          )}
          <button type="submit" className="hrm-btn hrm-btn-primary" disabled={submitting}>
            {submitting ? labels.loading : submitLabel ?? labels.save}
          </button>
        </div>
      )}
    </form>
  );
}
