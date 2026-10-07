import React, { useEffect, useMemo, useState } from 'react';
import { getByPath } from '../api/client';
import { ActionButton, isActionVisible, useActionRunner } from '../components/Actions';
import { DataTable, Pagination } from '../components/DataTable';
import { ErrorBox, Spinner } from '../components/Feedback';
import { FieldInput } from '../components/Form';
import { Icon } from '../components/Icon';
import { useAsync, useHR } from '../context';
import { useRouter } from '../router/Router';
import type { ListResult, ModuleConfig } from '../types';

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function ListView({ module }: { module: ModuleConfig }) {
  const { api, baseVars, labels, toast, confirm } = useHR();
  const { navigate } = useRouter();
  const primaryKey = module.primaryKey ?? 'id';
  const endpoints = module.endpoints ?? {};
  const pagination = module.pagination ?? {};
  const mode = pagination.mode ?? 'client';
  const pageSize = pagination.pageSize ?? 10;
  const searchCfg = module.search === true ? {} : module.search || null;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const debouncedSearch = useDebounced(search, searchCfg?.param ? 300 : 0);

  useEffect(() => setPage(1), [debouncedSearch, filters]);

  const serverQuery = useMemo(() => {
    const q: Record<string, unknown> = { ...filters };
    if (mode === 'server') {
      q[pagination.pageParam ?? 'page'] = pagination.zeroBased ? page - 1 : page;
      q[pagination.pageSizeParam ?? 'pageSize'] = pageSize;
    }
    if (searchCfg?.param && debouncedSearch) q[searchCfg.param] = debouncedSearch;
    return q;
  }, [filters, mode, page, pageSize, debouncedSearch, searchCfg?.param, pagination.pageParam, pagination.pageSizeParam, pagination.zeroBased]);

  const { data, error, loading, reload } = useAsync<ListResult<Record<string, any>>>(
    (signal) =>
      endpoints.list
        ? api.list(endpoints.list, { vars: baseVars, query: serverQuery, signal })
        : Promise.resolve({ items: [] }),
    [module.key, JSON.stringify(serverQuery)],
  );

  const runner = useActionRunner(reload);
  const columns = module.columns ?? [];

  // Client-side search & pagination
  const { rows, total } = useMemo(() => {
    let items = data?.items ?? [];
    if (searchCfg && !searchCfg.param && debouncedSearch) {
      const needle = debouncedSearch.toLowerCase();
      items = items.filter((row) =>
        columns.some((c) => String(getByPath(row, c.key) ?? '').toLowerCase().includes(needle)),
      );
    }
    if (mode === 'server') return { rows: items, total: data?.total ?? items.length };
    if (mode === 'none') return { rows: items, total: items.length };
    return { rows: items.slice((page - 1) * pageSize, page * pageSize), total: items.length };
  }, [data, debouncedSearch, mode, page, pageSize, columns, searchCfg]);

  const rowActions = (module.actions ?? []).filter((a) => (a.scope ?? 'row') === 'row');
  const toolbarActions = (module.actions ?? []).filter((a) => a.scope === 'toolbar');
  const canCreate = !!endpoints.create && !!module.fields?.length;
  const canEdit = !!endpoints.update && !!module.fields?.length;
  const canDelete = !!endpoints.delete;
  const hasRowActions = rowActions.length > 0 || canEdit || canDelete;

  const handleDelete = async (row: Record<string, any>) => {
    if (!(await confirm(labels.deleteConfirm))) return;
    try {
      await api.request(endpoints.delete!, { vars: { ...baseVars, ...row }, method: 'DELETE' });
      toast(labels.deleted, 'success');
      reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
    }
  };

  const id = (row: Record<string, any>) => encodeURIComponent(String(getByPath(row, primaryKey)));

  return (
    <div className="hrm-page">
      <div className="hrm-page-header">
        <div>
          <h2>{module.label}</h2>
          {module.description && <p className="hrm-muted">{module.description}</p>}
        </div>
        <div className="hrm-toolbar-actions">
          {toolbarActions.map((a) => (
            <ActionButton key={a.key} action={a} busy={runner.busy === a.key} onClick={() => runner.run(a)} />
          ))}
          {canCreate && (
            <button type="button" className="hrm-btn hrm-btn-primary" onClick={() => navigate(`${module.path}/new`)}>
              <Icon name="plus" size={14} />
              <span>{labels.create}</span>
            </button>
          )}
        </div>
      </div>

      {(searchCfg || module.filters?.length) && (
        <div className="hrm-filters">
          {searchCfg && (
            <div className="hrm-search">
              <Icon name="search" size={16} />
              <input
                type="search"
                aria-label={labels.search}
                placeholder={searchCfg.placeholder ?? labels.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}
          {module.filters?.map((f) => (
            <div key={f.name} className="hrm-filter">
              <FieldInput
                field={{ ...f, required: false }}
                value={filters[f.name]}
                onChange={(v) => setFilters((prev) => ({ ...prev, [f.name]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="hrm-card">
        {error ? (
          <ErrorBox error={error} onRetry={reload} />
        ) : loading && !data ? (
          <Spinner label={labels.loading} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              primaryKey={primaryKey}
              onRowClick={module.disableDetail ? undefined : (row) => navigate(`${module.path}/${id(row)}`)}
              rowActions={
                hasRowActions
                  ? (row) => (
                      <>
                        {rowActions
                          .filter((a) => isActionVisible(a, row))
                          .map((a) => (
                            <ActionButton
                              key={a.key}
                              compact
                              action={a}
                              busy={runner.busy === a.key}
                              onClick={() => runner.run(a, row)}
                            />
                          ))}
                        {canEdit && (
                          <button
                            type="button"
                            className="hrm-icon-btn"
                            aria-label={labels.edit}
                            title={labels.edit}
                            onClick={() => navigate(`${module.path}/${id(row)}/edit`)}
                          >
                            <Icon name="edit" size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            className="hrm-icon-btn hrm-danger"
                            aria-label={labels.delete}
                            title={labels.delete}
                            onClick={() => handleDelete(row)}
                          >
                            <Icon name="trash" size={16} />
                          </button>
                        )}
                      </>
                    )
                  : undefined
              }
            />
            {mode !== 'none' && <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />}
          </>
        )}
      </div>
      {runner.modal}
    </div>
  );
}
