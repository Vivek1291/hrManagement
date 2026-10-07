/**
 * In-memory REST backend implementing the endpoints used by the built-in presets.
 * Plug it in with `api: { baseUrl: '/api', fetcher: createMockFetcher() }`.
 */
type Row = Record<string, any>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export function createMockDb() {
  const departments: Row[] = [
    { id: 1, name: 'Engineering', head: 'Asha Rao', employeeCount: 3 },
    { id: 2, name: 'People Ops', head: 'Marco Diaz', employeeCount: 1 },
    { id: 3, name: 'Finance', head: 'Lena Fischer', employeeCount: 1 },
  ];
  const employees: Row[] = [
    { id: 1, employeeCode: 'E-1001', name: 'Asha Rao', email: 'asha@acme.test', phone: '+1 555 0101', department: 'Engineering', designation: 'Engineering Manager', joiningDate: '2021-03-15', salary: 145000, status: 'active' },
    { id: 2, employeeCode: 'E-1002', name: 'Marco Diaz', email: 'marco@acme.test', phone: '+1 555 0102', department: 'People Ops', designation: 'HR Lead', joiningDate: '2020-07-01', salary: 98000, status: 'active' },
    { id: 3, employeeCode: 'E-1003', name: 'Lena Fischer', email: 'lena@acme.test', phone: '+1 555 0103', department: 'Finance', designation: 'Controller', joiningDate: '2019-11-20', salary: 120000, status: 'on_leave' },
    { id: 4, employeeCode: 'E-1004', name: 'Kenji Sato', email: 'kenji@acme.test', phone: '+1 555 0104', department: 'Engineering', designation: 'Senior Engineer', joiningDate: '2022-01-10', salary: 132000, status: 'active' },
    { id: 5, employeeCode: 'E-1005', name: 'Priya Nair', email: 'priya@acme.test', phone: '+1 555 0105', department: 'Engineering', designation: 'Engineer', joiningDate: '2023-05-02', salary: 104000, status: 'inactive' },
  ];
  const leaves: Row[] = [
    { id: 1, employeeId: 3, employeeName: 'Lena Fischer', type: 'sick', from: '2026-10-01', to: '2026-10-09', days: 7, reason: 'Surgery recovery', status: 'approved' },
    { id: 2, employeeId: 4, employeeName: 'Kenji Sato', type: 'casual', from: '2026-10-20', to: '2026-10-21', days: 2, reason: 'Family event', status: 'pending' },
    { id: 3, employeeId: 1, employeeName: 'Asha Rao', type: 'earned', from: '2026-12-22', to: '2026-12-31', days: 6, reason: 'Holidays', status: 'pending' },
  ];
  const payslips: Row[] = [];
  let pid = 1;
  for (const period of ['2026-08', '2026-09']) {
    for (const e of employees) {
      const gross = Math.round(e.salary / 12);
      const deductions = Math.round(gross * 0.22);
      payslips.push({ id: pid++, employeeId: e.id, employeeName: e.name, period, grossPay: gross, deductions, netPay: gross - deductions, status: 'paid' });
    }
  }
  const attendance: Row[] = [];
  let aid = 1;
  for (const date of ['2026-10-05', '2026-10-06']) {
    for (const e of employees) {
      const status = e.status === 'on_leave' ? 'on_leave' : e.id === 4 && date === '2026-10-06' ? 'late' : 'present';
      attendance.push({ id: aid++, employeeId: e.id, employeeName: e.name, date, checkIn: status === 'on_leave' ? null : status === 'late' ? '10:12' : '09:01', checkOut: status === 'on_leave' ? null : '18:04', status });
    }
  }
  return { departments, employees, leaves, payslips, attendance };
}

export function createMockFetcher(options: { delay?: number } = {}) {
  const db = createMockDb();
  const delay = options.delay ?? 250;
  const collections: Record<string, Row[]> = db;

  const nextId = (rows: Row[]) => rows.reduce((m, r) => Math.max(m, Number(r.id)), 0) + 1;

  const applyQuery = (rows: Row[], q: URLSearchParams) => {
    let out = rows;
    q.forEach((value, key) => {
      if (['page', 'pageSize', 'q'].includes(key)) return;
      out = out.filter((r) => String(r[key] ?? '') === value || (key === 'month' && String(r.period) === value));
    });
    const search = q.get('q');
    if (search) out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
    return out;
  };

  return async function fetcher(url: string, init: RequestInit = {}): Promise<Response> {
    await new Promise((r) => setTimeout(r, delay));
    const u = new URL(url, 'http://mock.local');
    const parts = u.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
    const method = (init.method ?? 'GET').toUpperCase();
    const body = typeof init.body === 'string' ? JSON.parse(init.body) : {};
    const [resource, id, sub] = parts;

    // Custom endpoints
    if (resource === 'leaves' && id && (sub === 'approve' || sub === 'reject')) {
      const leave = db.leaves.find((l) => String(l.id) === id);
      if (!leave) return json({ message: 'Leave not found' }, 404);
      leave.status = sub === 'approve' ? 'approved' : 'rejected';
      if (body.remarks) leave.remarks = body.remarks;
      return json(leave);
    }
    if (resource === 'payslips' && id && sub === 'download') {
      const p = db.payslips.find((x) => String(x.id) === id);
      if (!p) return json({ message: 'Payslip not found' }, 404);
      const text = `PAYSLIP\n${p.employeeName}\nPeriod: ${p.period}\nGross: ${p.grossPay}\nDeductions: ${p.deductions}\nNet: ${p.netPay}\n`;
      return new Response(new Blob([text], { type: 'application/pdf' }), { status: 200, headers: { 'Content-Type': 'application/pdf' } });
    }
    if (resource === 'payroll' && id === 'run') {
      return json({ message: `Payroll for ${body.month} queued` }, 202);
    }
    if (resource === 'employees' && id && (sub === 'payslips' || sub === 'leaves')) {
      return json({ data: collections[sub].filter((r) => String(r.employeeId) === id) });
    }

    const rows = collections[resource];
    if (!rows) return json({ message: `Unknown endpoint ${u.pathname}` }, 404);

    if (!id) {
      if (method === 'GET') {
        const filtered = applyQuery(rows, u.searchParams);
        const page = Number(u.searchParams.get('page') ?? 0);
        const size = Number(u.searchParams.get('pageSize') ?? 0);
        const items = page && size ? filtered.slice((page - 1) * size, page * size) : filtered;
        return json({ data: items, meta: { total: filtered.length } });
      }
      if (method === 'POST') {
        const row: Row = { ...body, id: nextId(rows) };
        if (resource === 'leaves') {
          const emp = db.employees.find((e) => String(e.id) === String(body.employeeId));
          row.employeeName = emp?.name;
          row.status = 'pending';
          row.days = Math.round((new Date(body.to).getTime() - new Date(body.from).getTime()) / 864e5) + 1;
        }
        rows.push(row);
        return json(row, 201);
      }
    }

    const idx = rows.findIndex((r) => String(r.id) === id);
    if (idx < 0) return json({ message: 'Not found' }, 404);
    if (method === 'GET') return json(rows[idx]);
    if (method === 'PUT' || method === 'PATCH') {
      rows[idx] = { ...rows[idx], ...body, id: rows[idx].id };
      return json(rows[idx]);
    }
    if (method === 'DELETE') {
      rows.splice(idx, 1);
      return new Response(null, { status: 204 });
    }
    return json({ message: 'Method not allowed' }, 405);
  };
}
