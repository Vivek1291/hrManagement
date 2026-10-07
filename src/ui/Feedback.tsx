import React, { useEffect } from 'react';
import { useHR } from '../core/context';
import { errorStatus } from '../core/permissions';
import { useRouter } from '../core/router';
import type { AccessDeniedProps } from '../types';
import { Button } from './Button';
import { cn } from './cn';
import { Icon } from './Icon';

export function Spinner({ label, small }: { label?: string; small?: boolean }) {
  const ring = (
    <span
      className={cn(
        'hrm:inline-block hrm:animate-spin hrm:rounded-full hrm:border-2 hrm:border-border hrm:border-t-primary',
        small ? 'hrm:size-4' : 'hrm:size-5',
      )}
    />
  );
  if (small) return ring;
  return (
    <div role="status" className="hrm:flex hrm:items-center hrm:justify-center hrm:gap-2.5 hrm:p-10 hrm:text-muted">
      {ring}
      {label && <span>{label}</span>}
    </div>
  );
}

/** The 401 / 403 screen. Replaceable through `config.access.component`. */
export function AccessDenied(props: AccessDeniedProps) {
  const { labels, config } = useHR();
  const { navigate } = useRouter();
  const Custom = config.access?.component;
  if (Custom) return <Custom {...props} />;

  const forbidden = props.status === 403;
  return (
    <div
      role="alert"
      className="hrm:mx-auto hrm:flex hrm:max-w-md hrm:flex-col hrm:items-center hrm:gap-3 hrm:px-6 hrm:py-16 hrm:text-center"
    >
      <div className="hrm:flex hrm:size-16 hrm:items-center hrm:justify-center hrm:rounded-full hrm:bg-red-50 hrm:text-danger">
        <Icon name="lock" size={28} />
      </div>
      <div className="hrm:text-5xl hrm:font-extrabold hrm:tracking-tight hrm:text-fg">{props.status}</div>
      <h2 className="hrm:text-lg hrm:font-semibold">{forbidden ? labels.forbiddenTitle : labels.unauthorizedTitle}</h2>
      <p className="hrm:text-muted">{forbidden ? labels.forbiddenMessage : labels.unauthorizedMessage}</p>
      {props.message && (
        <p className="hrm:rounded-lg hrm:bg-bg hrm:px-3 hrm:py-2 hrm:text-xs hrm:text-muted">{props.message}</p>
      )}
      <Button className="hrm:mt-2" onClick={() => navigate('/')}>
        {labels.goHome}
      </Button>
    </div>
  );
}

/** Shows an API error: the 401/403 screen for auth errors, otherwise an inline message with retry. */
export function ErrorState({ error, onRetry, compact }: { error: Error; onRetry?: () => void; compact?: boolean }) {
  const { labels } = useHR();
  const status = errorStatus(error);
  if ((status === 401 || status === 403) && !compact) {
    return <AccessDenied status={status} message={error.message} />;
  }
  return (
    <div
      role="alert"
      className="hrm:m-3 hrm:flex hrm:items-center hrm:justify-between hrm:gap-3 hrm:rounded-lg hrm:border hrm:border-red-200 hrm:bg-red-50 hrm:px-4 hrm:py-3 hrm:text-red-800"
    >
      <span>{status === 403 ? labels.forbiddenAction : error.message}</span>
      {onRetry && status !== 403 && (
        <Button size="sm" onClick={onRetry}>
          {labels.retry}
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <div className="hrm:p-10 hrm:text-center hrm:text-muted">{message}</div>;
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
    <div
      className="hrm:fixed hrm:inset-0 hrm:z-50 hrm:flex hrm:items-center hrm:justify-center hrm:bg-gray-900/50 hrm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="hrm:max-h-[90vh] hrm:w-full hrm:max-w-lg hrm:overflow-y-auto hrm:rounded-card hrm:bg-surface hrm:shadow-2xl"
      >
        <div className="hrm:flex hrm:items-center hrm:justify-between hrm:border-b hrm:border-border hrm:px-5 hrm:py-4">
          <h3 className="hrm:text-base hrm:font-semibold">{title}</h3>
          <Button variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <Icon name="x" />
          </Button>
        </div>
        <div className="hrm:p-5">{children}</div>
        {footer && (
          <div className="hrm:flex hrm:justify-end hrm:gap-2 hrm:border-t hrm:border-border hrm:px-5 hrm:py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

export interface ToastItem {
  id: number;
  message: string;
  kind: 'success' | 'error' | 'info';
}

const TOAST_COLORS = {
  success: 'hrm:bg-emerald-700',
  error: 'hrm:bg-red-700',
  info: 'hrm:bg-gray-700',
};

export function Toasts({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div aria-live="polite" className="hrm:fixed hrm:right-5 hrm:bottom-5 hrm:z-[60] hrm:flex hrm:flex-col hrm:gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          onClick={() => onDismiss(t.id)}
          className={cn(
            'hrm:max-w-sm hrm:cursor-pointer hrm:rounded-lg hrm:px-4 hrm:py-3 hrm:text-white hrm:shadow-lg',
            TOAST_COLORS[t.kind],
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
