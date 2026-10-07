import React from 'react';
import { createRoot } from 'react-dom/client';
import { HRManagement, allModules, defineHRConfig } from '../../src';
import { createMockFetcher } from '../../src/mock';
import '../../src/styles/tailwind.css';

const config = defineHRConfig({
  api: {
    baseUrl: '/api',
    // No backend yet: an in-memory mock implements the whole API contract (docs/API.md).
    // Payroll runs answer 403 to show the access-denied screen.
    fetcher: createMockFetcher({ forbidden: ['/payroll-runs'] }),
    headers: async () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? 'demo'}` }),
  },
  branding: { title: 'Acme HR' },
  user: { id: 2, name: 'Marco Diaz', email: 'marco@acme.test', roles: ['hr'] },
  currency: 'USD',
  access: { showLockedModules: true },
  onLogout: () => alert('Logged out'),
  modules: allModules().map((m) =>
    m.key === 'performance' ? { ...m, roles: ['admin'] } : m.key === 'employees' ? { ...m, pagination: { mode: 'server', pageSize: 5 }, search: { param: 'q' } } : m,
  ),
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HRManagement config={config} />
  </React.StrictMode>,
);
