import React from 'react';
import { createRoot } from 'react-dom/client';
import { HRManagement, defineHRConfig, preset } from '../../src';
import '../../src/styles.css';
import { createMockFetcher } from './mockApi';

const config = defineHRConfig({
  api: {
    baseUrl: '/api',
    // Remove `fetcher` to hit a real backend at `baseUrl`.
    fetcher: createMockFetcher(),
    headers: async () => ({ Authorization: `Bearer ${localStorage.getItem('token') ?? 'demo'}` }),
  },
  branding: { title: 'Acme HR' },
  user: { id: 2, name: 'Marco Diaz', email: 'marco@acme.test', roles: ['hr'] },
  currency: 'USD',
  onLogout: () => alert('Logged out'),
  modules: [
    preset('dashboard'),
    { ...preset('employees'), group: 'People', pagination: { mode: 'server', pageSize: 3 }, search: { param: 'q' } },
    { ...preset('departments'), group: 'People' },
    { ...preset('attendance'), group: 'Time' },
    { ...preset('leaves'), group: 'Time' },
    { ...preset('payslips'), group: 'Payroll', roles: ['hr', 'admin'] },
  ],
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HRManagement config={config} />
  </React.StrictMode>,
);
