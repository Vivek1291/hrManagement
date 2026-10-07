import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HRManagement, allModules, preset, type HRConfig } from '../src';
import { createMockFetcher, type MockOptions } from '../src/mock';

function setup(overrides: Partial<HRConfig> = {}, initialPath = '/employees', mock: MockOptions = {}) {
  const fetcher = vi.fn(createMockFetcher({ delay: 0, ...mock }));
  const config: HRConfig = {
    api: { baseUrl: '/api', fetcher },
    routing: { mode: 'memory', initialPath },
    user: { id: 1, name: 'Test User', roles: ['hr'] },
    modules: allModules(),
    ...overrides,
  };
  render(<HRManagement config={config} />);
  return { fetcher, user: userEvent.setup() };
}

const nav = () => screen.getByRole('navigation');

describe('<HRManagement />', () => {
  it('renders every built-in module as a tab and loads the employee list', async () => {
    setup();
    for (const label of ['Employees', 'Attendance', 'Leave requests', 'Holidays', 'Payroll runs', 'Payslips', 'Expenses', 'Assets', 'Job openings']) {
      expect(within(nav()).getByText(label)).toBeInTheDocument();
    }
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
  });

  it('opens a detail page with related tabs', async () => {
    const { user } = setup();
    await user.click(await screen.findByText('Kenji Sato'));
    expect(await screen.findByRole('heading', { name: 'Kenji Sato' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Leave balance' }));
    expect(await screen.findByText('Casual')).toBeInTheDocument();
  });

  it('creates a record through the configured create endpoint', async () => {
    const { user, fetcher } = setup({ modules: [preset('departments')] }, '/departments');
    await user.click(await screen.findByRole('button', { name: /add new/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getAllByText('This field is required').length).toBeGreaterThan(0);
    await user.type(screen.getByLabelText(/^Name/), 'Legal');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith('/api/departments', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Legal' }) })),
    );
    expect(await screen.findByRole('heading', { name: 'Legal' })).toBeInTheDocument();
  });

  it('runs a row action with extra input (reject leave)', async () => {
    const { user, fetcher } = setup({}, '/leaves');
    await screen.findByText('Kenji Sato');
    const row = () => screen.getByText('Kenji Sato').closest('tr')!;
    await user.click(within(row()).getByRole('button', { name: /reject/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Reason/), 'Busy sprint');
    await user.click(within(dialog).getByRole('button', { name: /reject/i }));
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith('/api/leaves/2/reject', expect.objectContaining({ method: 'POST', body: JSON.stringify({ remarks: 'Busy sprint' }) })),
    );
    await waitFor(() => expect(within(row()).getByText('rejected')).toBeInTheDocument());
  });

  it('lists holidays with weekday and type filters', async () => {
    const { user, fetcher } = setup({}, '/holidays');
    expect(await screen.findByText('Christmas Day')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Type'), 'optional');
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/holidays?type=optional', expect.anything()));
    await waitFor(() => expect(screen.queryByText('Christmas Day')).not.toBeInTheDocument());
    expect(screen.getByText("New Year's Eve")).toBeInTheDocument();
  });

  it('sends server pagination and search params', async () => {
    const { fetcher, user } = setup({
      modules: [{ ...preset('employees'), pagination: { mode: 'server', pageSize: 2 }, search: { param: 'q' } }],
    });
    await screen.findByText('Asha Rao');
    expect(fetcher).toHaveBeenCalledWith('/api/employees?page=1&pageSize=2', expect.anything());
    expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Lena Fischer')).toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'kenji');
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/employees?page=1&pageSize=2&q=kenji', expect.anything()));
  });

  it('renders dashboard widgets', async () => {
    setup({}, '/dashboard');
    expect(await screen.findByText('6')).toBeInTheDocument(); // employees
    expect(await screen.findByText('Upcoming holidays')).toBeInTheDocument();
  });

  describe('access control', () => {
    it('hides modules the user cannot open and shows 403 when visited directly', async () => {
      setup({ modules: [preset('employees'), { ...preset('payroll'), roles: ['admin'] }] }, '/payroll');
      expect(within(nav()).queryByText('Payroll runs')).not.toBeInTheDocument();
      expect(screen.getByText('403')).toBeInTheDocument();
      expect(screen.getByText('Access denied')).toBeInTheDocument();
    });

    it('can show locked modules in the sidebar', () => {
      setup({ access: { showLockedModules: true }, modules: [preset('employees'), { ...preset('payroll'), roles: ['admin'] }] });
      expect(within(nav()).getByText('Payroll runs')).toBeInTheDocument();
    });

    it('shows the 403 screen when the API answers 403', async () => {
      setup({}, '/payroll', { forbidden: ['/payroll-runs'] });
      expect(await screen.findByText('403')).toBeInTheDocument();
      expect(screen.getByText('You do not have access to this resource')).toBeInTheDocument();
    });

    it('shows the 401 screen when the API answers 401', async () => {
      setup({}, '/employees', { unauthorized: ['/employees'] });
      expect(await screen.findByText('401')).toBeInTheDocument();
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });

    it('hides create/edit/delete without the matching permission', async () => {
      setup({
        user: { name: 'Viewer', permissions: ['departments.view'] },
        modules: [{ ...preset('departments'), permissions: { view: 'departments.view', create: 'departments.create', update: 'departments.update', delete: 'departments.delete' } }],
      }, '/departments');
      await screen.findByText('Engineering');
      expect(screen.queryByRole('button', { name: /add new/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('blocks the create route without the create permission', () => {
      setup({
        user: { name: 'Viewer', permissions: ['departments.view'] },
        modules: [{ ...preset('departments'), permissions: { view: 'departments.view', create: 'departments.create' } }],
      }, '/departments/new');
      expect(screen.getByText('403')).toBeInTheDocument();
    });

    it('uses a custom access-denied component', () => {
      setup(
        { access: { component: ({ status }) => <p>Custom {status}</p> }, modules: [{ ...preset('payroll'), roles: ['admin'] }] },
        '/payroll',
      );
      expect(screen.getByText('Custom 403')).toBeInTheDocument();
    });
  });

  it('loads its config from configUrl and accepts preset modules in JSON', async () => {
    const mock = createMockFetcher({ delay: 0 });
    const remoteConfig = {
      api: { baseUrl: '/api' },
      routing: { mode: 'memory' },
      modules: [{ preset: 'employees', label: 'Staff' }, { preset: 'holidays' }],
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) =>
      url === '/hr-config.json'
        ? new Response(JSON.stringify(remoteConfig), { headers: { 'Content-Type': 'application/json' } })
        : mock(url, init),
    ));
    render(<HRManagement configUrl="/hr-config.json" />);
    expect(await screen.findByText('Staff')).toBeInTheDocument();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
