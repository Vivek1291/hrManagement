import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createApiClient } from './api/client';
import { Modal, Spinner, Toasts, type ToastItem } from './components/Feedback';
import { Icon } from './components/Icon';
import { DEFAULT_LABELS, HRContextProvider, useHR, type HRContextValue, type ToastKind } from './context';
import { preset, presets, type PresetName } from './presets';
import { Link, matchPath, RouterProvider, useRouter } from './router/Router';
import type { HRConfig, ModuleConfig, ModuleInput, ThemeConfig } from './types';
import { DashboardView } from './views/DashboardView';
import { DetailView } from './views/DetailView';
import { CreateView, EditView } from './views/FormView';
import { ListView } from './views/ListView';

export interface HRManagementProps {
  /** The full configuration. Either this or `configUrl` is required. */
  config?: HRConfig;
  /**
   * Load the configuration (modules, routes, endpoints…) from your API as JSON.
   * Fetched with plain `fetch` unless `configFetcher` is given.
   */
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

/** Resolve presets and normalise module paths. */
export function resolveModules(inputs: ModuleInput[]): ModuleConfig[] {
  return inputs.map((input) => {
    const m = 'preset' in input && input.preset
      ? (() => {
          const { preset: name, ...rest } = input as ModuleInput & { preset: string };
          if (!(name in presets)) throw new Error(`Unknown HR preset "${name}"`);
          return preset(name as PresetName, rest);
        })()
      : (input as ModuleConfig);
    const path = '/' + m.path.replace(/^\/+|\/+$/g, '');
    return { ...m, path };
  });
}

export function mergeConfig(base: HRConfig, overrides?: Partial<HRConfig>): HRConfig {
  if (!overrides) return base;
  const modules = overrides.modules
    ? (() => {
        const byKey = new Map(overrides.modules!.map((m) => [m.key, m]));
        const merged = base.modules.map((m) => {
          const o = m.key ? byKey.get(m.key) : undefined;
          if (!o) return m;
          byKey.delete(m.key);
          return { ...m, ...o, endpoints: { ...m.endpoints, ...o.endpoints } } as ModuleInput;
        });
        return [...merged, ...byKey.values()];
      })()
    : base.modules;
  return {
    ...base,
    ...overrides,
    api: { ...base.api, ...overrides.api },
    routing: { ...base.routing, ...overrides.routing },
    branding: { ...base.branding, ...overrides.branding, theme: { ...base.branding?.theme, ...overrides.branding?.theme } },
    labels: { ...base.labels, ...overrides.labels },
    modules,
  };
}

function themeVars(theme: ThemeConfig = {}): React.CSSProperties {
  const map: Record<keyof ThemeConfig, string> = {
    primary: '--hrm-primary',
    primaryContrast: '--hrm-primary-contrast',
    background: '--hrm-bg',
    surface: '--hrm-surface',
    text: '--hrm-text',
    muted: '--hrm-muted',
    border: '--hrm-border',
    sidebar: '--hrm-sidebar',
    sidebarText: '--hrm-sidebar-text',
    radius: '--hrm-radius',
    font: '--hrm-font',
  };
  const style: Record<string, string> = {};
  (Object.keys(theme) as (keyof ThemeConfig)[]).forEach((k) => {
    if (theme[k] && map[k]) style[map[k]] = theme[k]!;
  });
  return style as React.CSSProperties;
}

function canSee(module: ModuleConfig, roles: string[] | undefined) {
  if (!module.roles?.length) return true;
  return !!roles?.some((r) => module.roles!.includes(r));
}

function Routes({ modules, initialPath }: { modules: ModuleConfig[]; initialPath?: string }) {
  const { path, navigate } = useRouter();
  const ctx = useHR();
  const home = initialPath ?? modules.find((m) => !m.hidden)?.path ?? modules[0]?.path;

  useEffect(() => {
    if ((path === '/' || path === '') && home && home !== '/') navigate(home, { replace: true });
  }, [path, home, navigate]);

  for (const module of modules) {
    const type = module.type ?? 'resource';
    if (type === 'custom') {
      const params = matchPath(module.path, path) ?? (path.startsWith(module.path + '/') ? { '*': path.slice(module.path.length + 1) } : null);
      if (params && module.component) {
        const C = module.component;
        return <C module={module} params={params} navigate={navigate} api={ctx.api} />;
      }
      continue;
    }
    if (type === 'dashboard') {
      if (matchPath(module.path, path)) return <DashboardView key={module.key} module={module} />;
      continue;
    }
    if (matchPath(module.path, path)) return <ListView key={module.key} module={module} />;
    if (module.endpoints?.create && matchPath(`${module.path}/new`, path)) return <CreateView key={module.key} module={module} />;
    const edit = matchPath(`${module.path}/:id/edit`, path);
    if (edit && module.endpoints?.update) return <EditView key={`${module.key}-${edit.id}`} module={module} id={edit.id} />;
    const detail = matchPath(`${module.path}/:id`, path);
    if (detail && !module.disableDetail) return <DetailView key={`${module.key}-${detail.id}`} module={module} id={detail.id} />;
  }
  if (path === '/' || path === '') return null;
  return <div className="hrm-empty">{ctx.labels.notFound}</div>;
}

function Layout({ config, modules }: { config: HRConfig; modules: ModuleConfig[] }) {
  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const labels = { ...DEFAULT_LABELS, ...config.labels };
  const branding = config.branding ?? {};
  const visible = modules.filter((m) => !m.hidden);

  useEffect(() => setOpen(false), [path]);

  const groups: { name?: string; items: ModuleConfig[] }[] = [];
  visible.forEach((m) => {
    const g = groups.find((x) => x.name === m.group);
    if (g) g.items.push(m);
    else groups.push({ name: m.group, items: [m] });
  });

  const user = config.user;
  const initials = (user?.name ?? '')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`hrm-layout${open ? ' hrm-nav-open' : ''}`}>
      <aside className="hrm-sidebar">
        <div className="hrm-brand">
          {typeof branding.logo === 'string' ? <img src={branding.logo} alt="" /> : branding.logo}
          <span>{branding.title ?? 'HR Management'}</span>
        </div>
        <nav aria-label="HR navigation">
          {groups.map((g, i) => (
            <div key={g.name ?? i} className="hrm-nav-group">
              {g.name && <div className="hrm-nav-heading">{g.name}</div>}
              {g.items.map((m) => {
                const active = path === m.path || path.startsWith(m.path + '/');
                return (
                  <Link key={m.key} to={m.path} className={`hrm-nav-link${active ? ' hrm-active' : ''}`} aria-current={active ? 'page' : undefined}>
                    <Icon name={m.icon} />
                    <span>{m.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <div className="hrm-overlay" onClick={() => setOpen(false)} />
      <div className="hrm-main">
        <header className="hrm-header">
          <button type="button" className="hrm-icon-btn hrm-menu-btn" aria-label="Menu" onClick={() => setOpen((o) => !o)}>
            <Icon name="menu" />
          </button>
          <div className="hrm-header-spacer" />
          {config.headerExtra}
          {user?.name && (
            <div className="hrm-user">
              {user.avatarUrl ? <img className="hrm-avatar" src={user.avatarUrl} alt="" /> : <span className="hrm-avatar hrm-initials">{initials}</span>}
              <div className="hrm-user-text">
                <span>{user.name}</span>
                {user.email && <small className="hrm-muted">{user.email}</small>}
              </div>
            </div>
          )}
          {config.onLogout && (
            <button type="button" className="hrm-icon-btn" aria-label={labels.logout} title={labels.logout} onClick={config.onLogout}>
              <Icon name="logout" />
            </button>
          )}
        </header>
        <main className="hrm-content">
          <Routes modules={modules} initialPath={config.routing?.initialPath} />
        </main>
      </div>
    </div>
  );
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
  const modules = useMemo(
    () => resolveModules(config.modules).filter((m) => canSee(m, config.user?.roles)),
    [config.modules, config.user?.roles],
  );
  const labels = useMemo(() => ({ ...DEFAULT_LABELS, ...config.labels }), [config.labels]);

  const value = useMemo<HRContextValue>(
    () => ({
      config,
      api,
      labels,
      locale: config.locale,
      currency: config.currency ?? 'USD',
      baseVars: { user: config.user ?? {} },
      toast,
      confirm,
    }),
    [config, api, labels, toast, confirm],
  );

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  return (
    <HRContextProvider value={value}>
      <RouterProvider config={config.routing} onNavigate={config.onNavigate}>
        <div className={`hrm-root${className ? ` ${className}` : ''}`} style={{ ...themeVars(config.branding?.theme), ...style }}>
          <Layout config={config} modules={modules} />
          <Toasts items={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
          {confirmState && (
            <Modal
              title={labels.confirm}
              onClose={() => closeConfirm(false)}
              footer={
                <>
                  <button type="button" className="hrm-btn" onClick={() => closeConfirm(false)}>
                    {labels.cancel}
                  </button>
                  <button type="button" className="hrm-btn hrm-btn-primary" onClick={() => closeConfirm(true)}>
                    {labels.confirm}
                  </button>
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
        if (!res.ok) throw new Error(`Failed to load HR config (${res.status})`);
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
    return (
      <div className="hrm-root">
        <div className="hrm-error" role="alert">
          <span>{remote.error.message}</span>
          <button type="button" className="hrm-btn hrm-btn-sm" onClick={() => setAttempt((a) => a + 1)}>
            {DEFAULT_LABELS.retry}
          </button>
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
