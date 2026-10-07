import React, { useState } from 'react';
import { getByPath, interpolate, normalizeEndpoint } from '../api/client';
import { useHR } from '../context';
import { matchesWhen } from '../utils/format';
import type { ActionConfig } from '../types';
import { Modal } from './Feedback';
import { Icon } from './Icon';
import { initialFormValues, ResourceForm } from './Form';

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function isActionVisible(action: ActionConfig, record: Record<string, any>) {
  if (!matchesWhen(record, action.when)) return false;
  if (action.visible && !action.visible(record)) return false;
  return true;
}

/** Hook that executes a configured action against a record. */
export function useActionRunner(onDone?: () => void) {
  const { api, baseVars, toast, confirm } = useHR();
  const [pending, setPending] = useState<{ action: ActionConfig; record: Record<string, any> } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const execute = async (action: ActionConfig, record: Record<string, any>, body?: Record<string, any>) => {
    const vars = { ...baseVars, ...record };
    const ep = normalizeEndpoint(action.endpoint);

    if (action.openInNewTab) {
      window.open(api.url(ep, { vars }), '_blank', 'noopener');
      return;
    }

    const isDownload = !!action.download;
    const method = ep.method ?? action.method ?? (isDownload ? 'GET' : 'POST');
    setBusy(action.key);
    try {
      const result = await api.request<unknown>(
        { ...ep, responseType: ep.responseType ?? (isDownload ? 'blob' : undefined) },
        { vars, method, body: body ?? (method === 'GET' ? undefined : {}) },
      );
      if (isDownload) {
        const configured = typeof action.download === 'object' ? action.download.filename : undefined;
        const filename = configured ? interpolate(configured, vars, false) : `${action.key}-${record.id ?? 'file'}`;
        if (typeof Blob !== 'undefined' && result instanceof Blob) {
          // Some APIs return JSON `{ url }` pointing at a signed URL instead of the file itself.
          if (result.type.includes('json')) {
            const json = JSON.parse(await result.text());
            const link = getByPath(json, 'url') ?? getByPath(json, 'data.url');
            if (link) window.open(link, '_blank', 'noopener');
          } else {
            saveBlob(result, filename);
          }
        } else if (result && typeof result === 'object' && (result as any).url) {
          window.open((result as any).url, '_blank', 'noopener');
        }
      }
      if (action.successMessage) toast(action.successMessage, 'success');
      if (action.reload ?? !isDownload) onDone?.();
    } catch (err) {
      toast(err instanceof Error ? err.message : String(err), 'error');
      throw err;
    } finally {
      setBusy(null);
    }
  };

  const run = async (action: ActionConfig, record: Record<string, any> = {}) => {
    if (action.fields?.length) {
      setPending({ action, record });
      return;
    }
    if (action.confirm && !(await confirm(interpolate(action.confirm, { ...baseVars, ...record }, false)))) return;
    await execute(action, record).catch(() => undefined);
  };

  const modal = pending ? (
    <Modal title={pending.action.label} onClose={() => setPending(null)}>
      {pending.action.confirm && <p>{pending.action.confirm}</p>}
      <ResourceForm
        fields={pending.action.fields!}
        initialValues={initialFormValues(pending.action.fields!)}
        submitLabel={pending.action.label}
        onCancel={() => setPending(null)}
        onSubmit={async (values) => {
          await execute(pending.action, pending.record, values);
          setPending(null);
        }}
      />
    </Modal>
  ) : null;

  return { run, busy, modal };
}

export function ActionButton({
  action,
  busy,
  onClick,
  compact,
}: {
  action: ActionConfig;
  busy?: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const variant = action.variant && action.variant !== 'default' ? ` hrm-btn-${action.variant}` : '';
  return (
    <button
      type="button"
      className={`hrm-btn${compact ? ' hrm-btn-sm' : ''}${variant}`}
      disabled={busy}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <Icon name={action.icon ?? (action.download ? 'download' : undefined)} size={14} />
      <span>{action.label}</span>
    </button>
  );
}
