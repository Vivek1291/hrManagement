import React, { useEffect } from 'react';
import { useHR } from '../core/context';
import { matchPath, useRouter } from '../core/router';
import type { ModuleConfig } from '../types';
import { AccessDenied, EmptyState } from '../ui/Feedback';
import { DashboardView } from './DashboardView';
import { DetailView } from './DetailView';
import { CreateView, EditView } from './FormView';
import { ListView } from './ListView';

export function canViewModule(module: ModuleConfig, can: ReturnType<typeof useHR>['can']) {
  return can({ roles: module.roles, permission: module.permissions?.view });
}

type Match = { module: ModuleConfig; view: 'list' | 'create' | 'edit' | 'detail' | 'dashboard' | 'custom'; params: Record<string, string> };

function matchRoute(modules: ModuleConfig[], path: string): Match | null {
  for (const module of modules) {
    const type = module.type ?? 'resource';
    if (type === 'custom') {
      const params = matchPath(module.path, path) ?? (path.startsWith(module.path + '/') ? { '*': path.slice(module.path.length + 1) } : null);
      if (params) return { module, view: 'custom', params };
      continue;
    }
    if (type === 'dashboard') {
      if (matchPath(module.path, path)) return { module, view: 'dashboard', params: {} };
      continue;
    }
    if (matchPath(module.path, path)) return { module, view: 'list', params: {} };
    if (module.endpoints?.create && matchPath(`${module.path}/new`, path)) return { module, view: 'create', params: {} };
    const edit = matchPath(`${module.path}/:id/edit`, path);
    if (edit && module.endpoints?.update) return { module, view: 'edit', params: edit };
    const detail = matchPath(`${module.path}/:id`, path);
    if (detail && !module.disableDetail) return { module, view: 'detail', params: detail };
  }
  return null;
}

export function Routes({ modules, initialPath }: { modules: ModuleConfig[]; initialPath?: string }) {
  const { path, navigate } = useRouter();
  const { api, labels, can } = useHR();
  const home =
    initialPath ?? modules.find((m) => !m.hidden && canViewModule(m, can))?.path ?? modules[0]?.path;

  useEffect(() => {
    if ((path === '/' || path === '') && home && home !== '/') navigate(home, { replace: true });
  }, [path, home, navigate]);

  const match = matchRoute(modules, path);
  if (!match) {
    if (path === '/' || path === '') return null;
    return <EmptyState message={labels.notFound} />;
  }

  const { module, view, params } = match;
  const perms = module.permissions ?? {};
  const allowed =
    canViewModule(module, can) &&
    (view !== 'create' || can({ permission: perms.create })) &&
    (view !== 'edit' || can({ permission: perms.update }));
  if (!allowed) return <AccessDenied status={403} module={module} />;

  switch (view) {
    case 'custom': {
      const C = module.component;
      return C ? <C module={module} params={params} navigate={navigate} api={api} /> : null;
    }
    case 'dashboard':
      return <DashboardView key={module.key} module={module} />;
    case 'list':
      return <ListView key={module.key} module={module} />;
    case 'create':
      return <CreateView key={module.key} module={module} />;
    case 'edit':
      return <EditView key={`${module.key}-${params.id}`} module={module} id={params.id} />;
    case 'detail':
      return <DetailView key={`${module.key}-${params.id}`} module={module} id={params.id} />;
  }
}
