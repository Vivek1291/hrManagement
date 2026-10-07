import React from 'react';
import { getByPath } from '../api/client';
import { ErrorBox, Spinner } from '../components/Feedback';
import { initialFormValues, ResourceForm } from '../components/Form';
import { Icon } from '../components/Icon';
import { useHR } from '../context';
import { Link, useRouter } from '../router/Router';
import type { ModuleConfig } from '../types';
import { useRecord } from './useRecord';

function FormPage({
  module,
  mode,
  record,
  id,
}: {
  module: ModuleConfig;
  mode: 'create' | 'edit';
  record?: Record<string, any>;
  id?: string;
}) {
  const { api, baseVars, labels, toast } = useHR();
  const { navigate } = useRouter();
  const endpoints = module.endpoints ?? {};
  const primaryKey = module.primaryKey ?? 'id';
  const fields = (module.fields ?? []).filter((f) => !f.showIn || f.showIn.includes(mode));
  const back = mode === 'edit' && !module.disableDetail ? `${module.path}/${encodeURIComponent(id!)}` : module.path;

  const onSubmit = async (values: Record<string, any>) => {
    if (mode === 'create') {
      const created = await api.request<Record<string, any>>(endpoints.create!, {
        vars: baseVars,
        method: 'POST',
        body: values,
      });
      toast(labels.saved, 'success');
      const newId = created && typeof created === 'object' ? getByPath(created, primaryKey) : undefined;
      navigate(newId !== undefined && !module.disableDetail ? `${module.path}/${encodeURIComponent(String(newId))}` : module.path);
    } else {
      await api.request(endpoints.update!, {
        vars: { ...baseVars, ...record, id, [primaryKey]: id },
        method: 'PUT',
        body: values,
      });
      toast(labels.saved, 'success');
      navigate(back);
    }
  };

  return (
    <div className="hrm-page">
      <Link to={back} className="hrm-back">
        <Icon name="chevron-left" size={16} /> {labels.back}
      </Link>
      <div className="hrm-page-header">
        <h2>
          {mode === 'create' ? labels.create : labels.edit} · {module.label}
        </h2>
      </div>
      <div className="hrm-card hrm-card-padded">
        <ResourceForm
          fields={fields}
          initialValues={initialFormValues(fields, record)}
          onSubmit={onSubmit}
          onCancel={() => navigate(back)}
        />
      </div>
    </div>
  );
}

export function CreateView({ module }: { module: ModuleConfig }) {
  return <FormPage module={module} mode="create" />;
}

export function EditView({ module, id }: { module: ModuleConfig; id: string }) {
  const { labels } = useHR();
  const { data, error, loading, reload } = useRecord(module, id);
  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading || !data) return <Spinner label={labels.loading} />;
  return <FormPage module={module} mode="edit" record={data} id={id} />;
}
