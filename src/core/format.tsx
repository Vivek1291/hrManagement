import React from 'react';
import { getByPath } from './client';
import type { BadgeColor, ColumnConfig } from '../types';
import { Badge } from '../ui/Button';

interface FormatCtx {
  locale?: string;
  currency: string;
  yes: string;
  no: string;
}

const AUTO_BADGE: Record<string, BadgeColor> = {
  active: 'green',
  approved: 'green',
  paid: 'green',
  present: 'green',
  completed: 'green',
  pending: 'yellow',
  open: 'green',
  closed: 'gray',
  published: 'green',
  scheduled: 'blue',
  public: 'blue',
  optional: 'purple',
  company: 'green',
  assigned: 'blue',
  available: 'green',
  in_repair: 'yellow',
  retired: 'gray',
  applied: 'gray',
  screening: 'blue',
  interview: 'purple',
  offer: 'yellow',
  hired: 'green',
  submitted: 'blue',
  reimbursed: 'green',
  draft: 'gray',
  processing: 'blue',
  late: 'yellow',
  'on leave': 'blue',
  on_leave: 'blue',
  inactive: 'gray',
  rejected: 'red',
  absent: 'red',
  terminated: 'red',
  cancelled: 'gray',
};

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function formatNumber(value: unknown, kind: 'number' | 'currency' | 'percent', ctx: FormatCtx, currency?: string) {
  const n = Number(value);
  if (value === null || value === undefined || value === '' || isNaN(n)) return '—';
  try {
    if (kind === 'currency') {
      return new Intl.NumberFormat(ctx.locale, { style: 'currency', currency: currency || ctx.currency }).format(n);
    }
    if (kind === 'percent') return new Intl.NumberFormat(ctx.locale, { style: 'percent', maximumFractionDigits: 1 }).format(n);
    return new Intl.NumberFormat(ctx.locale).format(n);
  } catch {
    return String(n);
  }
}

export function renderCell(column: ColumnConfig, record: Record<string, any>, ctx: FormatCtx): React.ReactNode {
  const value = getByPath(record, column.key);
  if (column.render) return column.render(value, record);
  if (value === null || value === undefined || value === '') return <span className="hrm:text-muted">—</span>;

  switch (column.type) {
    case 'number':
      return formatNumber(value, 'number', ctx);
    case 'currency':
      return formatNumber(value, 'currency', ctx, column.currency);
    case 'date': {
      const d = toDate(value);
      return d ? d.toLocaleDateString(ctx.locale, { year: 'numeric', month: 'short', day: 'numeric' }) : String(value);
    }
    case 'datetime': {
      const d = toDate(value);
      return d ? d.toLocaleString(ctx.locale, { dateStyle: 'medium', timeStyle: 'short' }) : String(value);
    }
    case 'boolean':
      return value ? ctx.yes : ctx.no;
    case 'badge': {
      const key = String(value);
      const color = column.badgeColors?.[key] ?? AUTO_BADGE[key.toLowerCase()] ?? 'gray';
      return <Badge color={color}>{key.replace(/_/g, ' ')}</Badge>;
    }
    case 'weekday': {
      const d = toDate(value);
      return d ? d.toLocaleDateString(ctx.locale, { weekday: 'long' }) : String(value);
    }
    case 'email':
      return (
        <a className="hrm:text-primary hrm:hover:underline" href={`mailto:${value}`} onClick={(e) => e.stopPropagation()}>
          {String(value)}
        </a>
      );
    case 'link':
      return (
        <a className="hrm:text-primary hrm:hover:underline" href={String(value)} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
          {String(value)}
        </a>
      );
    case 'image':
      return <img className="hrm:size-8 hrm:rounded-full hrm:object-cover" src={String(value)} alt="" />;
    default:
      if (typeof value === 'object') return Array.isArray(value) ? value.join(', ') : JSON.stringify(value);
      return String(value);
  }
}

/** Compare for client-side sorting. */
export function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/** Whether a record matches an action's `when` condition. */
export function matchesWhen(record: Record<string, any>, when?: Record<string, unknown | unknown[]>): boolean {
  if (!when) return true;
  return Object.entries(when).every(([key, expected]) => {
    const actual = getByPath(record, key);
    return Array.isArray(expected) ? expected.includes(actual) : actual === expected;
  });
}
