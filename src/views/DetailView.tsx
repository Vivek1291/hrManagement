import React, { useState } from 'react';
import { getByPath } from '../api/client';
import { ActionButton, isActionVisible, useActionRunner } from '../components/Actions';
import { DataTable } from '../components/DataTable';
import { ErrorBox, Spinner } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { useAsync, useHR } from '../context';
import { Link, useRouter } from '../router/Router';
import { renderCell } from '../utils/format';
import type { ListResult, ModuleConfig, RelatedTabConfig } from '../types';
import { useRecord } from './useRecord';

function RelatedTab({ tab, record }: { tab: RelatedTabConfig; record: Record<string, any> }) {
  const { api, baseVars, labels } = useHR();
  const { data, error, loading, reload } = useAsync<ListResult<Record<string, any>>>(
    (signal) => api.list(tab.endpoint, { vars: { ...baseVars, ...record }, signal }),
    [tab.key, JSON.stringify(record)],
  );
  const runner = useActionRunner(reload);
  const actions = tab.actions ?? [];

  if (error) return <ErrorBox error={error} onRetry={reload} />;
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
                  .filter((a) => isActionVisible(a, row))
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
  const { api, baseVars, labels, locale, currency, toast, confirm } = useHR();
  const { navigate } = useRouter();
  const { data: record, error, loading, reload } = useRecord(module, id);
  const runner = useActionRunner(reload);
  const [tab, setTab] = useState<string>('__details');

  const endpoints = module.endpoints ?? {};
  const fields = module.detailFields ?? module.columns ?? [];
  const fmt = { locale, currency, yes: labels.yes, no: labels.no };
  const actions = (module.actions ?? []).filter((a) => (a.scope ?? 'row') === 'row');

  if (error) return <ErrorBox error={error} onRetry={reload} />;
  if (loading || !record) return <Spinner label={labels.loading} />;

  const title = getByPath(record, module.titleField ?? 'name') ?? `${module.label} #${id}`;

  const handleDelete = async () => {
    if (!(await confirm(labels.deleteConfirm))) return;
    try {
      await api.request(endpoints.delete!, { vars: { ...baseVars, ...record, id }, method: 'DELETE' });
      toast(labels.deleted, 'success');
      navigate(module.path);
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  return (
    <div className="hrm-page">
      <Link to={module.path} className="hrm-back">
        <Icon name="chevron-left" size={16} /> {labels.back}
      </Link>
      <div className="hrm-page-header">
        <h2>{String(title)}</h2>
        <div className="hrm-toolbar-actions">
          {actions
            .filter((a) => isActionVisible(a, record))
            .map((a) => (
              <ActionButton key={a.key} action={a} busy={runner.busy === a.key} onClick={() => runner.run(a, record)} />
            ))}
          {endpoints.update && module.fields?.length ? (
            <button type="button" className="hrm-btn" onClick={() => navigate(`${module.path}/${encodeURIComponent(id)}/edit`)}>
              <Icon name="edit" size={14} />
              <span>{labels.edit}</span>
            </button>
          ) : null}
          {endpoints.delete && (
            <button type="button" className="hrm-btn hrm-btn-danger" onClick={handleDelete}>
              <Icon name="trash" size={14} />
              <span>{labels.delete}</span>
            </button>
          )}
        </div>
      </div>

      {module.tabs?.length ? (
        <div className="hrm-tabs" role="tablist">
          {[{ key: '__details', label: labels.details }, ...module.tabs].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              className={`hrm-tab${tab === t.key ? ' hrm-tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="hrm-card">
        {tab === '__details' ? (
          <dl className="hrm-detail-grid">
            {fields.map((f) => (
              <div key={f.key} className="hrm-detail-item">
                <dt>{f.label}</dt>
                <dd>{renderCell(f, record, fmt)}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <RelatedTab key={tab} tab={module.tabs!.find((t) => t.key === tab)!} record={record} />
        )}
      </div>
      {runner.modal}
    </div>
  );
}
