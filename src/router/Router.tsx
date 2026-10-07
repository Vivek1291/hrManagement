import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { RoutingConfig } from '../types';

interface RouterValue {
  path: string;
  query: URLSearchParams;
  navigate: (to: string, opts?: { replace?: boolean }) => void;
  href: (to: string) => string;
}

const RouterContext = createContext<RouterValue | null>(null);

function stripBase(pathname: string, basePath: string): string {
  if (basePath && pathname.startsWith(basePath)) return pathname.slice(basePath.length) || '/';
  return pathname || '/';
}

function normalizeBase(base?: string): string {
  if (!base || base === '/') return '';
  return '/' + base.replace(/^\/+|\/+$/g, '');
}

function readLocation(mode: RoutingConfig['mode'], basePath: string): string {
  if (typeof window === 'undefined') return '/';
  if (mode === 'browser') return stripBase(window.location.pathname, basePath) + window.location.search;
  const hash = window.location.hash.replace(/^#/, '');
  return hash || '/';
}

export function RouterProvider({
  config = {},
  onNavigate,
  children,
}: {
  config?: RoutingConfig;
  onNavigate?: (path: string) => void;
  children: React.ReactNode;
}) {
  const mode = config.mode ?? 'hash';
  const basePath = normalizeBase(config.basePath);
  const [location, setLocation] = useState<string>(() =>
    mode === 'memory' ? config.initialPath ?? '/' : readLocation(mode, basePath),
  );

  useEffect(() => {
    if (mode === 'memory') return;
    const sync = () => setLocation(readLocation(mode, basePath));
    const event = mode === 'browser' ? 'popstate' : 'hashchange';
    window.addEventListener(event, sync);
    return () => window.removeEventListener(event, sync);
  }, [mode, basePath]);

  const href = useCallback(
    (to: string) => {
      if (mode === 'browser') return basePath + to;
      if (mode === 'hash') return '#' + to;
      return to;
    },
    [mode, basePath],
  );

  const navigate = useCallback<RouterValue['navigate']>(
    (to, opts) => {
      if (mode === 'browser') {
        window.history[opts?.replace ? 'replaceState' : 'pushState'](null, '', basePath + to);
      } else if (mode === 'hash') {
        if (opts?.replace) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search + '#' + to);
        } else {
          window.location.hash = to;
        }
      }
      setLocation(to);
      onNavigate?.(to);
    },
    [mode, basePath, onNavigate],
  );

  const value = useMemo<RouterValue>(() => {
    const [p, q = ''] = location.split('?');
    return { path: p || '/', query: new URLSearchParams(q), navigate, href };
  }, [location, navigate, href]);

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside <HRManagement>');
  return ctx;
}

/** Match `/employees/:id` against `/employees/42` → `{ id: '42' }`. */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const clean = (s: string) => s.replace(/\/+$/, '') || '/';
  const pp = clean(pattern).split('/');
  const ap = clean(path).split('/');
  if (pp.length !== ap.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(':')) {
      if (!ap[i]) return null;
      params[pp[i].slice(1)] = decodeURIComponent(ap[i]);
    } else if (pp[i] !== ap[i]) {
      return null;
    }
  }
  return params;
}

export function Link({
  to,
  children,
  className,
  ...rest
}: { to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>) {
  const { navigate, href } = useRouter();
  return (
    <a
      {...rest}
      className={className}
      href={href(to)}
      onClick={(e) => {
        rest.onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
