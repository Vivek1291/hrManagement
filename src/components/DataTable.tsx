import React, { useMemo, useState } from 'react';
import { getByPath } from '../api/client';
import { useHR } from '../context';
import { compareValues, renderCell } from '../utils/format';
import type { ColumnConfig } from '../types';

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
    <div className="hrm-table-wrap">
      <table className="hrm-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ width: col.width }}>
                {col.sortable ? (
                  <button type="button" className="hrm-sort" onClick={() => toggleSort(col.key)}>
                    {col.label}
                    <span aria-hidden="true">{sort?.key === col.key ? (sort.dir === 1 ? ' ▲' : ' ▼') : ' ↕'}</span>
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
            {rowActions && <th className="hrm-actions-col">{labels.actions}</th>}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (rowActions ? 1 : 0)} className="hrm-empty">
                {emptyMessage ?? labels.empty}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => (
              <tr
                key={String(getByPath(row, primaryKey) ?? i)}
                className={onRowClick ? 'hrm-clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} data-label={col.label}>
                    {renderCell(col, row, fmt)}
                  </td>
                ))}
                {rowActions && (
                  <td className="hrm-actions-col" onClick={(e) => e.stopPropagation()}>
                    <div className="hrm-row-actions">{rowActions(row)}</div>
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
    <div className="hrm-pagination">
      <span className="hrm-muted">
        {labels.page} {page} {labels.of} {pages} · {total}
      </span>
      <div>
        <button type="button" className="hrm-btn hrm-btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          {labels.previous}
        </button>
        <button type="button" className="hrm-btn hrm-btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          {labels.next}
        </button>
      </div>
    </div>
  );
}
