import React, { useEffect } from 'react';
import { useHR } from '../context';
import { Icon } from './Icon';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="hrm-loading" role="status">
      <span className="hrm-spinner" />
      {label && <span>{label}</span>}
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  const { labels } = useHR();
  return (
    <div className="hrm-error" role="alert">
      <span>{error.message}</span>
      {onRetry && (
        <button type="button" className="hrm-btn hrm-btn-sm" onClick={onRetry}>
          {labels.retry}
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="hrm-empty">{message}</div>;
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="hrm-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="hrm-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="hrm-modal-header">
          <h3>{title}</h3>
          <button type="button" className="hrm-icon-btn" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </button>
        </div>
        <div className="hrm-modal-body">{children}</div>
        {footer && <div className="hrm-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="hrm-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`hrm-toast hrm-toast-${t.kind}`} onClick={() => onDismiss(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
