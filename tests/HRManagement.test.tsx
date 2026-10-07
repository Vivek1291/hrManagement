import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HRManagement, preset, type HRConfig } from '../src';
import { createMockFetcher } from '../examples/demo/mockApi';

function setup(overrides: Partial<HRConfig> = {}, initialPath = '/employees') {
  const fetcher = vi.fn(createMockFetcher({ delay: 0 }));
  const config: HRConfig = {
    api: { baseUrl: '/api', fetcher },
    routing: { mode: 'memory', initialPath },
    user: { id: 1, name: 'Test User', roles: ['hr'] },
    modules: [preset('dashboard'), preset('employees'), preset('leaves'), preset('payslips')],
    ...overrides,
  };
  render(<HRManagement config={config} />);
  return { fetcher, user: userEvent.setup() };
}

describe('<HRManagement />', () => {
  it('renders the configured tabs and the employee list from the API', async () => {
    setup();
    const nav = screen.getByRole('navigation');
    expect(within(nav).getByText('Employees')).toBeInTheDocument();
    expect(within(nav).getByText('Payslips')).toBeInTheDocument();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('Kenji Sato')).toBeInTheDocument();
  });

  it('hides modules the user has no role for', () => {
    setup({ modules: [preset('employees'), { ...preset('payslips'), roles: ['admin'] }] });
    expect(within(screen.getByRole('navigation')).queryByText('Payslips')).not.toBeInTheDocument();
  });

  it('opens a detail page with related tabs', async () => {
    const { user } = setup();
    await user.click(await screen.findByText('Asha Rao'));
    expect(await screen.findByRole('heading', { name: 'Asha Rao' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Payslips' }));
    expect(await screen.findAllByText('2026-09')).not.toHaveLength(0);
  });

  it('creates a record through the configured create endpoint', async () => {
    const { user, fetcher } = setup({ modules: [preset('departments')] }, '/departments');
    await user.click(await screen.findByRole('button', { name: /add new/i }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Name/), 'Legal');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith('/api/departments', expect.objectContaining({ method: 'POST', body: JSON.stringify({ name: 'Legal' }) })),
    );
    expect(await screen.findByRole('heading', { name: 'Legal' })).toBeInTheDocument();
  });

  it('runs a row action with extra input (reject leave)', async () => {
    const { user, fetcher } = setup({}, '/leaves');
    await screen.findByText('Kenji Sato');
    const row = screen.getByText('Kenji Sato').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /reject/i }));
    const dialog = screen.getByRole('dialog');
    await user.type(within(dialog).getByLabelText(/Reason/), 'Busy sprint');
    await user.click(within(dialog).getByRole('button', { name: /reject/i }));
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith('/api/leaves/2/reject', expect.objectContaining({ method: 'POST', body: JSON.stringify({ remarks: 'Busy sprint' }) })),
    );
    await waitFor(() => expect(within(screen.getByText('Kenji Sato').closest('tr')!).getByText('rejected')).toBeInTheDocument());
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

  it('renders dashboard stats', async () => {
    setup({}, '/dashboard');
    expect(await screen.findByText('5')).toBeInTheDocument(); // employees
  });

  it('loads its config from configUrl and accepts preset modules in JSON', async () => {
    const mock = createMockFetcher({ delay: 0 });
    const remoteConfig = {
      api: { baseUrl: '/api' },
      routing: { mode: 'memory' },
      modules: [{ preset: 'employees', label: 'Staff' }],
    };
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) =>
      url === '/hr-config.json'
        ? new Response(JSON.stringify(remoteConfig), { headers: { 'Content-Type': 'application/json' } })
        : mock(url, init),
    ));
    render(<HRManagement configUrl="/hr-config.json" />);
    expect(await screen.findByText('Staff', { selector: '.hrm-nav-link span' })).toBeInTheDocument();
    expect(await screen.findByText('Asha Rao')).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
