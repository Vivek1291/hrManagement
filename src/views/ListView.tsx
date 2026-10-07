import React, { useEffect, useMemo, useState } from 'react';
import { getByPath } from '../core/client';
import { useAsync, useHR } from '../core/context';
import { useRouter } from '../core/router';
import { errorStatus } from '../core/permissions';
import type { ListResult, ModuleConfig } from '../types';
import { ActionButton, isActionVisible, useActionRunner } from '../ui/Actions';
import { Button, cardClass, controlHeight, inputClass } from '../ui/Button';
import { cn } from '../ui/cn';
import { DataTable, Pagination } from '../ui/DataTable';
import { AccessDenied, ErrorState, Spinner } from '../ui/Feedback';
import { FieldInput } from '../ui/Form';
import { Icon } from '../ui/Icon';
import { Page, PageHeader } from '../ui/Page';

function useDebounced<T>(value: T, delay: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function ListView({ module }: { module: ModuleConfig }) {
  const { api, baseVars, labels, toast, confirm, can, notifyError } = useHR();
  const { navigate } = useRouter();
  const primaryKey = module.primaryKey ?? 'id';
  const endpoints = module.endpoints ?? {};
  const perms = module.permissions ?? {};
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
  const toolbarActions = (module.actions ?? []).filter((a) => a.scope === 'toolbar' && isActionVisible(a, {}, can));
  const canCreate = !!endpoints.create && !!module.fields?.length && can({ permission: perms.create });
  const canEdit = !!endpoints.update && !!module.fields?.length && can({ permission: perms.update });
  const canDelete = !!endpoints.delete && can({ permission: perms.delete });
  const hasRowActions = rowActions.length > 0 || canEdit || canDelete;

  const handleDelete = async (row: Record<string, any>) => {
    if (!(await confirm(labels.deleteConfirm))) return;
    try {
      await api.request(endpoints.delete!, { vars: { ...baseVars, ...row }, method: 'DELETE' });
      toast(labels.deleted, 'success');
      reload();
    } catch (err) {
      notifyError(err);
    }
  };

  const id = (row: Record<string, any>) => encodeURIComponent(String(getByPath(row, primaryKey)));

  // The API refused the list: show the 401/403 screen instead of the page (and its buttons).
  const status = errorStatus(error);
  if (status === 401 || status === 403) return <AccessDenied status={status} module={module} message={error!.message} />;

  return (
    <Page>
      <PageHeader
        title={module.label}
        description={module.description}
        actions={
          <>
            {toolbarActions.map((a) => (
              <ActionButton key={a.key} action={a} busy={runner.busy === a.key} onClick={() => runner.run(a)} />
            ))}
            {canCreate && (
              <Button variant="primary" onClick={() => navigate(`${module.path}/new`)}>
                <Icon name="plus" size={14} />
                <span>{labels.create}</span>
              </Button>
            )}
          </>
        }
      />

      {(searchCfg || module.filters?.length) && (
        <div className="hrm:flex hrm:flex-wrap hrm:items-end hrm:gap-3">
          {searchCfg && (
            <div className="hrm:relative hrm:min-w-0 hrm:flex-1 hrm:sm:max-w-xs">
              <Icon name="search" size={16} className="hrm:pointer-events-none hrm:absolute hrm:top-1/2 hrm:left-3 hrm:-translate-y-1/2 hrm:text-muted" />
              <input
                type="search"
                aria-label={labels.search}
                placeholder={searchCfg.placeholder ?? labels.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={cn(inputClass, controlHeight, 'hrm:pl-9')}
              />
            </div>
          )}
          {module.filters?.map((f) => (
            <div key={f.name} className="hrm:min-w-40">
              <FieldInput
                field={{ ...f, required: false }}
                value={filters[f.name]}
                onChange={(v) => setFilters((prev) => ({ ...prev, [f.name]: v }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className={cardClass}>
        {error ? (
          <ErrorState error={error} onRetry={reload} />
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
                          .filter((a) => isActionVisible(a, row, can))
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
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={labels.edit}
                            title={labels.edit}
                            onClick={() => navigate(`${module.path}/${id(row)}/edit`)}
                          >
                            <Icon name="edit" size={16} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost-danger"
                            size="icon"
                            aria-label={labels.delete}
                            title={labels.delete}
                            onClick={() => handleDelete(row)}
                          >
                            <Icon name="trash" size={16} />
                          </Button>
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
    </Page>
  );
}
