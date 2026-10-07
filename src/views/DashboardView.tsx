import React from 'react';
import { extractList, getByPath } from '../api/client';
import { DataTable } from '../components/DataTable';
import { ErrorBox, Spinner } from '../components/Feedback';
import { Icon } from '../components/Icon';
import { useAsync, useHR } from '../context';
import { Link, useRouter } from '../router/Router';
import { formatNumber } from '../utils/format';
import type { ModuleConfig, WidgetConfig } from '../types';

function StatWidget({ widget }: { widget: Extract<WidgetConfig, { type: 'stat' }> }) {
  const { api, baseVars, labels, locale, currency } = useHR();
  const { navigate } = useRouter();
  const { data, error, loading } = useAsync<unknown>(
    (signal) => api.request(widget.endpoint, { vars: baseVars, signal }),
    [widget.key],
  );

  let value: unknown = data;
  if (widget.valuePath) value = getByPath(data, widget.valuePath);
  else if (Array.isArray(data)) value = data.length;
  else if (data && typeof data === 'object') {
    const { items, total } = extractList(data);
    value = total ?? items.length;
  }

  return (
    <div
      className={`hrm-card hrm-stat hrm-stat-${widget.color ?? 'blue'}${widget.link ? ' hrm-clickable' : ''}`}
      onClick={widget.link ? () => navigate(widget.link!) : undefined}
    >
      <div className="hrm-stat-icon">
        <Icon name={widget.icon ?? 'chart'} size={22} />
      </div>
      <div>
        <div className="hrm-stat-label">{widget.label}</div>
        <div className="hrm-stat-value">
          {error ? (
            <span className="hrm-muted" title={error.message}>—</span>
          ) : loading ? (
            <span className="hrm-spinner hrm-spinner-sm" />
          ) : (
            formatNumber(value, widget.format ?? 'number', { locale, currency, yes: labels.yes, no: labels.no })
          )}
        </div>
      </div>
    </div>
  );
}

function ListWidget({ widget }: { widget: Extract<WidgetConfig, { type: 'list' }> }) {
  const { api, baseVars, labels } = useHR();
  const { data, error, loading, reload } = useAsync(
    (signal) => api.list<Record<string, any>>(widget.endpoint, { vars: baseVars, signal }),
    [widget.key],
  );
  return (
    <div className="hrm-card hrm-widget-list">
      <div className="hrm-widget-header">
        <h3>{widget.label}</h3>
        {widget.link && <Link to={widget.link}>→</Link>}
      </div>
      {error ? (
        <ErrorBox error={error} onRetry={reload} />
      ) : loading ? (
        <Spinner label={labels.loading} />
      ) : (
        <DataTable columns={widget.columns} rows={(data?.items ?? []).slice(0, widget.limit ?? 5)} />
      )}
    </div>
  );
}

export function DashboardView({ module }: { module: ModuleConfig }) {
  const widgets = module.widgets ?? [];
  const stats = widgets.filter((w): w is Extract<WidgetConfig, { type: 'stat' }> => w.type === 'stat');
  const lists = widgets.filter((w): w is Extract<WidgetConfig, { type: 'list' }> => w.type === 'list');
  return (
    <div className="hrm-page">
      <div className="hrm-page-header">
        <div>
          <h2>{module.label}</h2>
          {module.description && <p className="hrm-muted">{module.description}</p>}
        </div>
      </div>
      {stats.length > 0 && (
        <div className="hrm-stats">
          {stats.map((w) => (
            <StatWidget key={w.key} widget={w} />
          ))}
        </div>
      )}
      {lists.length > 0 && (
        <div className="hrm-widget-grid">
          {lists.map((w) => (
            <ListWidget key={w.key} widget={w} />
          ))}
        </div>
      )}
    </div>
  );
}
