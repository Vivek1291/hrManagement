import React, { useState } from 'react';
import { getByPath } from '../core/client';
import { useAsync, useHR } from '../core/context';
import { renderCell } from '../core/format';
import { useRouter } from '../core/router';
import type { ListResult, ModuleConfig, RelatedTabConfig } from '../types';
import { ActionButton, isActionVisible, useActionRunner } from '../ui/Actions';
import { Button, cardClass } from '../ui/Button';
import { cn } from '../ui/cn';
import { DataTable } from '../ui/DataTable';
import { ErrorState, Spinner } from '../ui/Feedback';
import { Icon } from '../ui/Icon';
import { Page, PageHeader } from '../ui/Page';
import { useRecord } from './useRecord';

function RelatedTab({ tab, record }: { tab: RelatedTabConfig; record: Record<string, any> }) {
  const { api, baseVars, labels, can } = useHR();
  const { data, error, loading, reload } = useAsync<ListResult<Record<string, any>>>(
    (signal) => api.list(tab.endpoint, { vars: { ...baseVars, ...record }, signal }),
    [tab.key, JSON.stringify(record)],
  );
  const runner = useActionRunner(reload);
  const actions = tab.actions ?? [];

  if (error) return <ErrorState error={error} onRetry={reload} compact />;
  if (loading && !data) return <Spinner label={labels.loading} />;
  return (
    <>
      <DataTable
        columns={tab.columns}
        rows={data?.items ?? []}
        primaryKey={tab.primaryKey}
        rowActions={
          actions.length
            ? (row) =>
                actions
                  .filter((a) => isActionVisible(a, row, can))
                  .map((a) => (
                    <ActionButton
                      key={a.key}
                      compact
                      action={a}
                      busy={runner.busy === a.key}
                      onClick={() => runner.run(a, { ...record, ...row, parent: record })}
                    />
                  ))
            : undefined
        }
      />
      {runner.modal}
    </>
  );
}

export function DetailView({ module, id }: { module: ModuleConfig; id: string }) {
  const { api, baseVars, labels, locale, currency, toast, confirm, can, notifyError } = useHR();
  const { navigate } = useRouter();
  const { data: record, error, loading, reload } = useRecord(module, id);
  const runner = useActionRunner(reload);
  const [tab, setTab] = useState<string>('__details');

  const endpoints = module.endpoints ?? {};
  const perms = module.permissions ?? {};
  const fields = module.detailFields ?? module.columns ?? [];
  const fmt = { locale, currency, yes: labels.yes, no: labels.no };
  const actions = (module.actions ?? []).filter((a) => (a.scope ?? 'row') === 'row');

  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (loading || !record) return <Spinner label={labels.loading} />;

  const title = getByPath(record, module.titleField ?? 'name') ?? `${module.label} #${id}`;
  const canEdit = !!endpoints.update && !!module.fields?.length && can({ permission: perms.update });
  const canDelete = !!endpoints.delete && can({ permission: perms.delete });

  const handleDelete = async () => {
    if (!(await confirm(labels.deleteConfirm))) return;
    try {
      await api.request(endpoints.delete!, { vars: { ...baseVars, ...record, id }, method: 'DELETE' });
      toast(labels.deleted, 'success');
      navigate(module.path);
    } catch (err) {
      notifyError(err);
    }
  };

  return (
    <Page>
      <PageHeader
        backTo={module.path}
        title={String(title)}
        actions={
          <>
            {actions
              .filter((a) => isActionVisible(a, record, can))
              .map((a) => (
                <ActionButton key={a.key} action={a} busy={runner.busy === a.key} onClick={() => runner.run(a, record)} />
              ))}
            {canEdit && (
              <Button onClick={() => navigate(`${module.path}/${encodeURIComponent(id)}/edit`)}>
                <Icon name="edit" size={14} />
                <span>{labels.edit}</span>
              </Button>
            )}
            {canDelete && (
              <Button variant="danger" onClick={handleDelete}>
                <Icon name="trash" size={14} />
                <span>{labels.delete}</span>
              </Button>
            )}
          </>
        }
      />

      {module.tabs?.length ? (
        <div role="tablist" className="hrm:flex hrm:gap-1 hrm:overflow-x-auto hrm:border-b hrm:border-border">
          {[{ key: '__details', label: labels.details }, ...module.tabs].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'hrm:-mb-px hrm:border-b-2 hrm:px-4 hrm:py-2.5 hrm:font-medium hrm:whitespace-nowrap',
                tab === t.key ? 'hrm:border-primary hrm:text-primary' : 'hrm:border-transparent hrm:text-muted hrm:hover:text-fg',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className={cardClass}>
        {tab === '__details' ? (
          <dl className="hrm:grid hrm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] hrm:gap-5 hrm:p-5">
            {fields.map((f, i) => (
              <div key={`${f.key}-${i}`}>
                <dt className="hrm:mb-1 hrm:text-xs hrm:tracking-wide hrm:text-muted hrm:uppercase">{f.label}</dt>
                <dd className="hrm:font-medium">{renderCell(f, record, fmt)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <RelatedTab key={tab} tab={module.tabs!.find((t) => t.key === tab)!} record={record} />
        )}
      </div>
      {runner.modal}
    </Page>
  );
}
