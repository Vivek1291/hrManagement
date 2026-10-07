import React, { useEffect, useState } from 'react';
import { useHR } from '../core/context';
import { Link, useRouter } from '../core/router';
import type { ModuleConfig } from '../types';
import { Button } from '../ui/Button';
import { cn } from '../ui/cn';
import { Icon } from '../ui/Icon';
import { canViewModule, Routes } from '../views/Routes';

function Sidebar({ modules, open }: { modules: ModuleConfig[]; open: boolean }) {
  const { config, can } = useHR();
  const { path } = useRouter();
  const branding = config.branding ?? {};
  const showLocked = !!config.access?.showLockedModules;

  const visible = modules.filter((m) => !m.hidden && (showLocked || canViewModule(m, can)));
  const groups: { name?: string; items: ModuleConfig[] }[] = [];
  visible.forEach((m) => {
    const g = groups.find((x) => x.name === m.group);
    if (g) g.items.push(m);
    else groups.push({ name: m.group, items: [m] });
  });

  return (
    <aside
      className={cn(
        'hrm:fixed hrm:inset-y-0 hrm:left-0 hrm:z-40 hrm:flex hrm:w-64 hrm:shrink-0 hrm:flex-col hrm:overflow-y-auto hrm:bg-sidebar hrm:text-sidebar-fg hrm:transition-transform',
        'hrm:lg:sticky hrm:lg:top-0 hrm:lg:h-screen hrm:lg:translate-x-0',
        open ? 'hrm:translate-x-0' : 'hrm:-translate-x-full',
      )}
    >
      <div className="hrm:flex hrm:items-center hrm:gap-2.5 hrm:px-5 hrm:py-5 hrm:text-base hrm:font-bold hrm:text-white">
        {typeof branding.logo === 'string' ? <img src={branding.logo} alt="" className="hrm:h-7 hrm:w-auto" /> : branding.logo}
        <span>{branding.title ?? 'HR Management'}</span>
      </div>
      <nav aria-label="HR navigation" className="hrm:flex hrm:flex-col hrm:gap-1 hrm:px-3 hrm:pb-6">
        {groups.map((g, i) => (
          <div key={g.name ?? i} className="hrm:flex hrm:flex-col hrm:gap-0.5 hrm:pb-2">
            {g.name && (
              <div className="hrm:px-2.5 hrm:pt-3 hrm:pb-1 hrm:text-[11px] hrm:font-semibold hrm:tracking-wider hrm:uppercase hrm:opacity-50">
                {g.name}
              </div>
            )}
            {g.items.map((m) => {
              const active = path === m.path || path.startsWith(m.path + '/');
              const locked = !canViewModule(m, can);
              return (
                <Link
                  key={m.key}
                  to={m.path}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'hrm:flex hrm:items-center hrm:gap-2.5 hrm:rounded-lg hrm:px-2.5 hrm:py-2 hrm:font-medium hrm:transition-colors',
                    active ? 'hrm:bg-primary hrm:text-primary-fg' : 'hrm:hover:bg-white/10',
                    locked && 'hrm:opacity-50',
                  )}
                >
                  <Icon name={m.icon} />
                  <span className="hrm:flex-1 hrm:truncate">{m.label}</span>
                  {locked && <Icon name="lock" size={14} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}

function Header({ onMenu }: { onMenu: () => void }) {
  const { config, labels } = useHR();
  const user = config.user;
  const initials = (user?.name ?? '')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="hrm:sticky hrm:top-0 hrm:z-20 hrm:flex hrm:items-center hrm:gap-3 hrm:border-b hrm:border-border hrm:bg-surface hrm:px-4 hrm:py-3 hrm:lg:px-6">
      <Button variant="ghost" size="icon" className="hrm:lg:hidden" aria-label="Menu" onClick={onMenu}>
        <Icon name="menu" />
      </Button>
      <div className="hrm:flex-1" />
      {config.headerExtra}
      {user?.name && (
        <div className="hrm:flex hrm:items-center hrm:gap-2.5">
          {user.avatarUrl ? (
            <img className="hrm:size-8 hrm:rounded-full hrm:object-cover" src={user.avatarUrl} alt="" />
          ) : (
            <span className="hrm:flex hrm:size-8 hrm:items-center hrm:justify-center hrm:rounded-full hrm:bg-primary hrm:text-xs hrm:font-semibold hrm:text-primary-fg">
              {initials}
            </span>
          )}
          <div className="hrm:hidden hrm:flex-col hrm:leading-tight hrm:sm:flex">
            <span className="hrm:font-medium">{user.name}</span>
            {user.email && <small className="hrm:text-muted">{user.email}</small>}
          </div>
        </div>
      )}
      {config.onLogout && (
        <Button variant="ghost" size="icon" aria-label={labels.logout} title={labels.logout} onClick={config.onLogout}>
          <Icon name="logout" />
        </Button>
      )}
    </header>
  );
}

export function Layout({ modules }: { modules: ModuleConfig[] }) {
  const { config } = useHR();
  const { path } = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);

  return (
    <div className="hrm:flex hrm:min-h-screen">
      <Sidebar modules={modules} open={open} />
      {open && <div className="hrm:fixed hrm:inset-0 hrm:z-30 hrm:bg-black/40 hrm:lg:hidden" onClick={() => setOpen(false)} />}
      <div className="hrm:flex hrm:min-w-0 hrm:flex-1 hrm:flex-col">
        <Header onMenu={() => setOpen((o) => !o)} />
        <main className="hrm:flex-1 hrm:p-4 hrm:lg:p-6">
          <Routes modules={modules} initialPath={config.routing?.initialPath} />
        </main>
      </div>
    </div>
  );
}
