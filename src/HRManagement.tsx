import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient } from './core/client';
import { mergeConfig, resolveModules, themeVars } from './core/config';
import { DEFAULT_LABELS, HRContextProvider, type HRContextValue, type ToastKind } from './core/context';
import { can as canAccess, errorStatus, type AccessRule } from './core/permissions';
import { RouterProvider } from './core/router';
import { Layout } from './layout/Layout';
import type { HRConfig } from './types';
import { Button } from './ui/Button';
import { cn } from './ui/cn';
import { Modal, Spinner, Toasts, type ToastItem } from './ui/Feedback';

export interface HRManagementProps {
  /** The full configuration. Either this or `configUrl` is required. */
  config?: HRConfig;
  /** Load the configuration (modules, routes, endpoints…) from your API as JSON. */
  configUrl?: string;
  /** Request options for loading `configUrl` (e.g. auth headers). */
  configRequestInit?: RequestInit;
  /**
   * Merged over the loaded/passed config. Modules are merged by `key`, so you can attach
   * JS-only things (custom renderers, components, auth headers) to a JSON config.
   */
  overrides?: Partial<HRConfig>;
  className?: string;
  style?: React.CSSProperties;
}

function HRApp({ config, className, style }: { config: HRConfig; className?: string; style?: React.CSSProperties }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; resolve: (v: boolean) => void } | null>(null);
  const idRef = useRef(0);

  const toast = useCallback((message: string, kind: ToastKind = 'info') => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback(
    (message: string) => new Promise<boolean>((resolve) => setConfirmState({ message, resolve })),
    [],
  );

  const api = useMemo(() => createApiClient(config.api), [config.api]);
  const modules = useMemo(() => resolveModules(config.modules), [config.modules]);
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...config.labels }), [config.labels]);

  const value = useMemo<HRContextValue>(() => {
    const can = (rule?: AccessRule) => canAccess(config.user, rule);
    const notifyError = (error: unknown) => {
      const status = errorStatus(error);
      const message =
        status === 403 ? labels.forbiddenAction : status === 401 ? labels.unauthorizedMessage : error instanceof Error ? error.message : String(error);
      toast(message, 'error');
    };
    return {
      config,
      api,
      labels,
      locale: config.locale,
      currency: config.currency ?? 'USD',
      baseVars: { user: config.user ?? {} },
      toast,
      confirm,
      can,
      notifyError,
    };
  }, [config, api, labels, toast, confirm]);

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <HRContextProvider value={value}>
      <RouterProvider config={config.routing} onNavigate={config.onNavigate}>
        <div className={cn('hrm-root', className)} style={{ ...themeVars(config.branding?.theme), ...style }}>
          <Layout modules={modules} />
          <Toasts items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
          {confirmState && (
            <Modal
              title={labels.confirm}
              onClose={() => closeConfirm(false)}
              footer={
                <>
                  <Button onClick={() => closeConfirm(false)}>{labels.cancel}</Button>
                  <Button variant="primary" onClick={() => closeConfirm(true)}>
                    {labels.confirm}
                  </Button>
                </>
              }
            >
              <p>{confirmState.message}</p>
            </Modal>
          )}
        </div>
      </RouterProvider>
    </HRContextProvider>
  );
}

/**
 * The HR management app. Pass a `config` object, or a `configUrl` your backend serves.
 *
 * ```tsx
 * <HRManagement config={{ api: { baseUrl: '/api' }, modules: [preset('employees')] }} />
 * ```
 */
export function HRManagement({ config, configUrl, configRequestInit, overrides, className, style }: HRManagementProps) {
  const [remote, setRemote] = useState<{ config?: HRConfig; error?: Error }>({});
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!configUrl) return;
    let cancelled = false;
    setRemote({});
    fetch(configUrl, { headers: { Accept: 'application/json' }, ...configRequestInit })
      .then(async (res) => {
        if (!res.ok) throw Object.assign(new Error(`Failed to load HR config (${res.status})`), { status: res.status });
        return res.json();
      })
      .then((json) => !cancelled && setRemote({ config: json }))
      .catch((error) => !cancelled && setRemote({ error }));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configUrl, attempt]);

  const base = configUrl ? remote.config : config;
  const finalConfig = useMemo(() => (base ? mergeConfig(base, overrides) : undefined), [base, overrides]);

  if (configUrl && remote.error) {
    const status = errorStatus(remote.error);
    const denied = status === 401 || status === 403;
    return (
      <div className="hrm-root">
        <div role="alert" className="hrm:flex hrm:flex-col hrm:items-center hrm:gap-3 hrm:px-6 hrm:py-16 hrm:text-center">
          {denied && <div className="hrm:text-5xl hrm:font-extrabold">{status}</div>}
          <p className="hrm:text-muted">
            {status === 403 ? DEFAULT_LABELS.forbiddenMessage : status === 401 ? DEFAULT_LABELS.unauthorizedMessage : remote.error.message}
          </p>
          {!denied && <Button onClick={() => setAttempt((a) => a + 1)}>{DEFAULT_LABELS.retry}</Button>}
        </div>
      </div>
    );
  }
  if (!finalConfig) {
    if (!configUrl) throw new Error('<HRManagement> needs either `config` or `configUrl`');
    return (
      <div className="hrm-root">
        <Spinner label={DEFAULT_LABELS.loading} />
      </div>
    );
  }
  return <HRApp config={finalConfig} className={className} style={style} />;
}
