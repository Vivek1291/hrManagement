import React from 'react';
import { extractList, getByPath } from '../core/client';
import { useAsync, useHR } from '../core/context';
import { formatNumber } from '../core/format';
import { Link, useRouter } from '../core/router';
import type { BadgeColor, ModuleConfig, WidgetConfig } from '../types';
import { cardClass } from '../ui/Button';
import { cn } from '../ui/cn';
import { DataTable } from '../ui/DataTable';
import { ErrorState, Spinner } from '../ui/Feedback';
import { Icon } from '../ui/Icon';
import { Page, PageHeader } from '../ui/Page';

type StatWidget = Extract<WidgetConfig, { type: 'stat' }>;
type ListWidget = Extract<WidgetConfig, { type: 'list' }>;

const ICON_COLORS: Record<BadgeColor, string> = {
  blue: 'hrm:bg-blue-100 hrm:text-blue-700',
  green: 'hrm:bg-emerald-100 hrm:text-emerald-700',
  red: 'hrm:bg-red-100 hrm:text-red-700',
  yellow: 'hrm:bg-amber-100 hrm:text-amber-700',
  purple: 'hrm:bg-violet-100 hrm:text-violet-700',
  gray: 'hrm:bg-gray-100 hrm:text-gray-700',
};

function Stat({ widget }: { widget: StatWidget }) {
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
      className={cn(
        cardClass,
        'hrm:flex hrm:items-center hrm:gap-4 hrm:p-5',
        widget.link && 'hrm:cursor-pointer hrm:transition-colors hrm:hover:border-primary',
      )}
      onClick={widget.link ? () => navigate(widget.link!) : undefined}
    >
      <div className={cn('hrm:flex hrm:size-11 hrm:items-center hrm:justify-center hrm:rounded-xl', ICON_COLORS[widget.color ?? 'blue'])}>
        <Icon name={widget.icon ?? 'chart'} size={22} />
      </div>
      <div>
        <div className="hrm:text-[13px] hrm:text-muted">{widget.label}</div>
        <div className="hrm:text-2xl hrm:font-bold">
          {error ? (
            <span className="hrm:text-muted" title={error.message}>
              —
            </span>
          ) : loading ? (
            <Spinner small />
          ) : (
            formatNumber(value, widget.format ?? 'number', { locale, currency, yes: labels.yes, no: labels.no })
          )}
        </div>
      </div>
    </div>
  );
}

function List({ widget }: { widget: ListWidget }) {
  const { api, baseVars, labels } = useHR();
  const { data, error, loading, reload } = useAsync(
    (signal) => api.list<Record<string, any>>(widget.endpoint, { vars: baseVars, signal }),
    [widget.key],
  );
  return (
    <div className={cardClass}>
      <div className="hrm:flex hrm:items-center hrm:justify-between hrm:border-b hrm:border-border hrm:p-4">
        <h3 className="hrm:text-base hrm:font-semibold">{widget.label}</h3>
        {widget.link && (
          <Link to={widget.link} className="hrm:text-primary" aria-label={widget.label}>
            <Icon name="chevron-right" size={16} />
          </Link>
        )}
      </div>
      {error ? (
        <ErrorState error={error} onRetry={reload} compact />
      ) : loading ? (
        <Spinner label={labels.loading} />
      ) : (
        <DataTable columns={widget.columns} rows={(data?.items ?? []).slice(0, widget.limit ?? 5)} />
      )}
    </div>
  );
}

export function DashboardView({ module }: { module: ModuleConfig }) {
  const { can } = useHR();
  const widgets = (module.widgets ?? []).filter((w) => can({ roles: w.roles, permission: w.permission }));
  const stats = widgets.filter((w): w is StatWidget => w.type === 'stat');
  const lists = widgets.filter((w): w is ListWidget => w.type === 'list');
  return (
    <Page>
      <PageHeader title={module.label} description={module.description} />
      {stats.length > 0 && (
        <div className="hrm:grid hrm:grid-cols-1 hrm:gap-4 hrm:sm:grid-cols-2 hrm:xl:grid-cols-4">
          {stats.map((w) => (
            <Stat key={w.key} widget={w} />
          ))}
        </div>
      )}
      {lists.length > 0 && (
        <div className="hrm:grid hrm:grid-cols-1 hrm:gap-4 hrm:lg:grid-cols-2">
          {lists.map((w) => (
            <List key={w.key} widget={w} />
          ))}
        </div>
      )}
    </Page>
  );
}
