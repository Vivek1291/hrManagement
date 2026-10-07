import React, { useMemo, useState } from 'react';
import { getByPath } from '../core/client';
import { useHR } from '../core/context';
import { compareValues, renderCell } from '../core/format';
import type { ColumnConfig } from '../types';
import { Button } from './Button';
import { cn } from './cn';

const TH = 'hrm:bg-bg hrm:px-4 hrm:py-3 hrm:text-left hrm:text-xs hrm:font-semibold hrm:tracking-wide hrm:whitespace-nowrap hrm:text-muted hrm:uppercase';
const TD = 'hrm:border-t hrm:border-border hrm:px-4 hrm:py-3 hrm:align-middle';

export function DataTable({
  columns,
  rows,
  primaryKey = 'id',
  onRowClick,
  rowActions,
  emptyMessage,
}: {
  columns: ColumnConfig[];
  rows: Record<string, any>[];
  primaryKey?: string;
  onRowClick?: (row: Record<string, any>) => void;
  rowActions?: (row: Record<string, any>) => React.ReactNode;
  emptyMessage?: string;
}) {
  const { labels, locale, currency } = useHR();
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const fmt = { locale, currency, yes: labels.yes, no: labels.no };

  const sorted = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => compareValues(getByPath(a, sort.key), getByPath(b, sort.key)) * sort.dir);
  }, [rows, sort]);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key !== key ? { key, dir: 1 } : s.dir === 1 ? { key, dir: -1 } : null));

  return (
    <div className="hrm:overflow-x-auto">
      <table className="hrm:w-full">
        <thead>
          <tr>
            {columns.map((col, ci) => (
              <th key={`${col.key}-${ci}`} className={TH} style={{ width: col.width }}>
                {col.sortable ? (
                  <button type="button" className="hrm:inline-flex hrm:items-center hrm:gap-1 hrm:uppercase" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    <span aria-hidden="true" className="hrm:text-[10px]">
                      {sort?.key === col.key ? (sort.dir === 1 ? '▲' : '▼') : '↕'}
                    </span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {rowActions && <th className={cn(TH, 'hrm:w-px hrm:text-right')}>{labels.actions}</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)} className={cn(TD, 'hrm:p-10 hrm:text-center hrm:text-muted')}>
                {emptyMessage ?? labels.empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={String(getByPath(row, primaryKey) ?? i)}
                className={cn(onRowClick && 'hrm:cursor-pointer hrm:hover:bg-primary/[0.04]')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col, ci) => (
                  <td key={`${col.key}-${ci}`} className={TD} data-label={col.label}>
                    {renderCell(col, row, fmt)}
                  </td>
                ))}
                {rowActions && (
                  <td className={cn(TD, 'hrm:text-right hrm:whitespace-nowrap')} onClick={(e) => e.stopPropagation()}>
                    <div className="hrm:inline-flex hrm:items-center hrm:justify-end hrm:gap-1">{rowActions(row)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const { labels } = useHR();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total <= pageSize && page === 1) return null;
  return (
    <div className="hrm:flex hrm:items-center hrm:justify-between hrm:gap-2 hrm:border-t hrm:border-border hrm:px-4 hrm:py-3">
      <span className="hrm:text-muted">
        {labels.page} {page} {labels.of} {pages} · {total}
      </span>
      <div className="hrm:flex hrm:gap-2">
        <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {labels.previous}
        </Button>
        <Button size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          {labels.next}
        </Button>
      </div>
    </div>
  );
}
