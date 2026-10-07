import React from 'react';
import { getByPath } from '../core/client';
import { useHR } from '../core/context';
import { useRouter } from '../core/router';
import type { ModuleConfig } from '../types';
import { cardClass } from '../ui/Button';
import { cn } from '../ui/cn';
import { ErrorState, Spinner } from '../ui/Feedback';
import { initialFormValues, ResourceForm } from '../ui/Form';
import { Page, PageHeader } from '../ui/Page';
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
    <Page>
      <PageHeader backTo={back} title={`${mode === 'create' ? labels.create : labels.edit} · ${module.label}`} />
      <div className={cn(cardClass, 'hrm:p-5')}>
        <ResourceForm
          fields={fields}
          initialValues={initialFormValues(fields, record)}
          onSubmit={onSubmit}
          onCancel={() => navigate(back)}
        />
      </div>
    </Page>
  );
}

export function CreateView({ module }: { module: ModuleConfig }) {
  return <FormPage module={module} mode="create" />;
}

export function EditView({ module, id }: { module: ModuleConfig; id: string }) {
  const { labels } = useHR();
  const { data, error, loading, reload } = useRecord(module, id);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !data) return <Spinner label={labels.loading} />;
  return <FormPage module={module} mode="edit" record={data} id={id} />;
}
