/**
 * In-memory mock backend for every built-in module — build and demo the UI before your API exists.
 *
 * ```ts
 * import { createMockFetcher } from 'hr-management-ui/mock';
 * api: { baseUrl: '/api', fetcher: createMockFetcher() }
 * ```
 *
 * It implements the API contract documented in docs/API.md, so whatever works against the mock
 * will work against a backend that follows the same contract.
 */
type Row = Record<string, any>;

export interface MockOptions {
  /** Simulated network latency in ms. Default 250. */
  delay?: number;
  /** Path prefix stripped before routing. Default `/api`. */
  basePath?: string;
  /** Requests whose path starts with one of these return 403 (e.g. `['/payroll-runs']`). */
  forbidden?: string[];
  /** Requests whose path starts with one of these return 401. */
  unauthorized?: string[];
  /** Replace or extend the seed data. */
  seed?: Partial<MockDb>;
  /** The "current user" for check-in/check-out. Default employee id 1. */
  currentEmployeeId?: number;
}

export type MockDb = Record<string, Row[]>;

const json = (body: unknown, status = 200) =>
  new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const iso = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

export function createMockDb(): MockDb {
  const departments = [
    { id: 1, name: 'Engineering', code: 'ENG', head: 'Asha Rao', description: 'Builds the product.' },
    { id: 2, name: 'People Ops', code: 'HR', head: 'Marco Diaz', description: 'Hiring, culture and payroll.' },
    { id: 3, name: 'Finance', code: 'FIN', head: 'Lena Fischer', description: 'Money in, money out.' },
    { id: 4, name: 'Sales', code: 'SAL', head: 'Omar Haddad', description: 'Revenue.' },
  ];
  const designations = [
    { id: 1, title: 'Engineering Manager', department: 'Engineering', level: 'M2' },
    { id: 2, title: 'Senior Engineer', department: 'Engineering', level: 'L4' },
    { id: 3, title: 'Engineer', department: 'Engineering', level: 'L3' },
    { id: 4, title: 'HR Lead', department: 'People Ops', level: 'M1' },
    { id: 5, title: 'Controller', department: 'Finance', level: 'M1' },
    { id: 6, title: 'Account Executive', department: 'Sales', level: 'L3' },
  ];
  const shifts = [
    { id: 1, name: 'General', startTime: '09:00', endTime: '18:00', graceMinutes: 15, workingDays: 'Mon-Fri' },
    { id: 2, name: 'Early', startTime: '07:00', endTime: '16:00', graceMinutes: 10, workingDays: 'Mon-Fri' },
  ];
  const employees = [
    { id: 1, employeeCode: 'E-1001', name: 'Asha Rao', email: 'asha@acme.test', phone: '+1 555 0101', department: 'Engineering', designation: 'Engineering Manager', manager: null, shift: 'General', joiningDate: '2021-03-15', salary: 145000, status: 'active' },
    { id: 2, employeeCode: 'E-1002', name: 'Marco Diaz', email: 'marco@acme.test', phone: '+1 555 0102', department: 'People Ops', designation: 'HR Lead', manager: null, shift: 'General', joiningDate: '2020-07-01', salary: 98000, status: 'active' },
    { id: 3, employeeCode: 'E-1003', name: 'Lena Fischer', email: 'lena@acme.test', phone: '+1 555 0103', department: 'Finance', designation: 'Controller', manager: null, shift: 'Early', joiningDate: '2019-11-20', salary: 120000, status: 'on_leave' },
    { id: 4, employeeCode: 'E-1004', name: 'Kenji Sato', email: 'kenji@acme.test', phone: '+1 555 0104', department: 'Engineering', designation: 'Senior Engineer', manager: 'Asha Rao', shift: 'General', joiningDate: '2022-01-10', salary: 132000, status: 'active' },
    { id: 5, employeeCode: 'E-1005', name: 'Priya Nair', email: 'priya@acme.test', phone: '+1 555 0105', department: 'Engineering', designation: 'Engineer', manager: 'Asha Rao', shift: 'General', joiningDate: '2023-05-02', salary: 104000, status: 'active' },
    { id: 6, employeeCode: 'E-1006', name: 'Omar Haddad', email: 'omar@acme.test', phone: '+1 555 0106', department: 'Sales', designation: 'Account Executive', manager: null, shift: 'General', joiningDate: '2024-02-12', salary: 88000, status: 'inactive' },
  ];
  const leaveTypes = [
    { id: 1, name: 'Casual', code: 'casual', daysPerYear: 12, maxConsecutiveDays: 3, paid: true, carryForward: false },
    { id: 2, name: 'Sick', code: 'sick', daysPerYear: 10, maxConsecutiveDays: 10, paid: true, carryForward: false },
    { id: 3, name: 'Earned', code: 'earned', daysPerYear: 15, maxConsecutiveDays: 15, paid: true, carryForward: true },
    { id: 4, name: 'Unpaid', code: 'unpaid', daysPerYear: 30, maxConsecutiveDays: 30, paid: false, carryForward: false },
  ];
  const leaves = [
    { id: 1, employeeId: 3, employeeName: 'Lena Fischer', type: 'sick', from: addDays(-3), to: addDays(4), days: 6, reason: 'Surgery recovery', status: 'approved' },
    { id: 2, employeeId: 4, employeeName: 'Kenji Sato', type: 'casual', from: addDays(10), to: addDays(11), days: 2, reason: 'Family event', status: 'pending' },
    { id: 3, employeeId: 1, employeeName: 'Asha Rao', type: 'earned', from: addDays(40), to: addDays(47), days: 6, reason: 'Holidays', status: 'pending' },
    { id: 4, employeeId: 5, employeeName: 'Priya Nair', type: 'casual', from: addDays(-20), to: addDays(-20), days: 1, reason: 'Personal', status: 'rejected', remarks: 'Release week' },
  ];
  const year = new Date().getFullYear();
  const holidays = [
    { id: 1, name: "New Year's Day", date: `${year}-01-01`, type: 'public', location: 'All' },
    { id: 2, name: 'Labour Day', date: `${year}-05-01`, type: 'public', location: 'All' },
    { id: 3, name: 'Company Foundation Day', date: `${year}-08-18`, type: 'company', location: 'All' },
    { id: 4, name: 'Diwali', date: `${year}-11-08`, type: 'optional', location: 'India' },
    { id: 5, name: 'Thanksgiving', date: `${year}-11-26`, type: 'public', location: 'USA' },
    { id: 6, name: 'Christmas Day', date: `${year}-12-25`, type: 'public', location: 'All' },
    { id: 7, name: "New Year's Eve", date: `${year}-12-31`, type: 'optional', location: 'All' },
  ];

  const attendance: Row[] = [];
  let aid = 1;
  for (let back = 2; back >= 0; back--) {
    const date = back === 0 ? 'today' : addDays(-back);
    for (const e of employees) {
      if (e.status === 'inactive') continue;
      const status = e.status === 'on_leave' ? 'on_leave' : e.id === 4 && back === 0 ? 'late' : e.id === 5 && back === 1 ? 'absent' : 'present';
      const off = status === 'on_leave' || status === 'absent';
      attendance.push({
        id: aid++,
        employeeId: e.id,
        employeeName: e.name,
        date: date === 'today' ? iso(new Date()) : date,
        checkIn: off ? null : status === 'late' ? '10:12' : '09:01',
        checkOut: off || back === 0 ? null : '18:04',
        workHours: off || back === 0 ? null : 9,
        status,
      });
    }
  }

  const payrollRuns: Row[] = [];
  const payslips: Row[] = [];
  let pid = 1;
  const periods = [-2, -1].map((m) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + m);
    return d.toISOString().slice(0, 7);
  });
  periods.forEach((period, i) => {
    const runId = i + 1;
    let gross = 0;
    let net = 0;
    for (const e of employees.filter((x) => x.status !== 'inactive')) {
      const basic = Math.round((e.salary / 12) * 0.7);
      const allowances = Math.round((e.salary / 12) * 0.3);
      const grossPay = basic + allowances;
      const tax = Math.round(grossPay * 0.18);
      const deductions = tax + 200;
      payslips.push({ id: pid++, payrollRunId: runId, employeeId: e.id, employeeName: e.name, period, basic, allowances, grossPay, tax, deductions, netPay: grossPay - deductions, status: 'paid' });
      gross += grossPay;
      net += grossPay - deductions;
    }
    payrollRuns.push({ id: runId, period, employeeCount: employees.length - 1, totalGross: gross, totalNet: net, status: 'paid' });
  });

  const expenses = [
    { id: 1, employeeId: 4, employeeName: 'Kenji Sato', title: 'Conference ticket', category: 'training', date: addDays(-12), amount: 499, status: 'submitted' },
    { id: 2, employeeId: 6, employeeName: 'Omar Haddad', title: 'Client dinner', category: 'meals', date: addDays(-30), amount: 182.5, status: 'reimbursed' },
    { id: 3, employeeId: 5, employeeName: 'Priya Nair', title: 'USB-C dock', category: 'equipment', date: addDays(-5), amount: 129, status: 'approved' },
  ];
  const assets = [
    { id: 1, tag: 'LT-0001', name: 'MacBook Pro 14"', type: 'laptop', serialNumber: 'C02XYZ01', purchaseDate: '2023-01-10', cost: 2399, assignedTo: 1, assignedToName: 'Asha Rao', status: 'assigned' },
    { id: 2, tag: 'LT-0002', name: 'ThinkPad X1', type: 'laptop', serialNumber: 'PF3ABC22', purchaseDate: '2023-06-02', cost: 1899, assignedTo: 4, assignedToName: 'Kenji Sato', status: 'assigned' },
    { id: 3, tag: 'MN-0001', name: 'Dell 27" Monitor', type: 'monitor', serialNumber: 'CN0D27M', purchaseDate: '2024-03-15', cost: 349, assignedTo: null, assignedToName: null, status: 'available' },
    { id: 4, tag: 'PH-0001', name: 'iPhone 15', type: 'phone', serialNumber: 'F2LXQ9', purchaseDate: '2024-09-20', cost: 899, assignedTo: null, assignedToName: null, status: 'in_repair' },
  ];
  const documents = [
    { id: 1, name: 'Employee handbook.pdf', category: 'policy', employeeId: null, employeeName: null, uploadedAt: '2026-01-05' },
    { id: 2, name: 'Offer letter - Priya Nair.pdf', category: 'contract', employeeId: 5, employeeName: 'Priya Nair', uploadedAt: '2023-04-20' },
    { id: 3, name: 'Passport - Kenji Sato.pdf', category: 'id_proof', employeeId: 4, employeeName: 'Kenji Sato', uploadedAt: '2022-01-08' },
  ];
  const announcements = [
    { id: 1, title: 'Office closed for Foundation Day', audience: 'everyone', publishedAt: addDays(-2) + 'T09:00', status: 'published', message: 'Enjoy the long weekend!' },
    { id: 2, title: 'Open enrollment for health benefits', audience: 'everyone', publishedAt: addDays(-9) + 'T10:30', status: 'published', message: 'Enrollment closes at month end.' },
    { id: 3, title: 'Q4 manager offsite', audience: 'managers', publishedAt: addDays(5) + 'T09:00', status: 'scheduled', message: 'Agenda to follow.' },
  ];
  const jobs = [
    { id: 1, title: 'Senior Frontend Engineer', department: 'Engineering', location: 'Remote', employmentType: 'full_time', openings: 2, status: 'open' },
    { id: 2, title: 'Payroll Specialist', department: 'People Ops', location: 'Berlin', employmentType: 'full_time', openings: 1, status: 'open' },
    { id: 3, title: 'Sales Intern', department: 'Sales', location: 'New York', employmentType: 'intern', openings: 3, status: 'on_hold' },
  ];
  const candidates = [
    { id: 1, jobId: 1, jobTitle: 'Senior Frontend Engineer', name: 'Ines Moreau', email: 'ines@mail.test', phone: '+33 1 555', appliedAt: addDays(-14), stage: 'interview' },
    { id: 2, jobId: 1, jobTitle: 'Senior Frontend Engineer', name: 'Tom Becker', email: 'tom@mail.test', phone: '+49 30 555', appliedAt: addDays(-6), stage: 'screening' },
    { id: 3, jobId: 2, jobTitle: 'Payroll Specialist', name: 'Ana Silva', email: 'ana@mail.test', phone: '+351 21 555', appliedAt: addDays(-20), stage: 'offer' },
    { id: 4, jobId: 1, jobTitle: 'Senior Frontend Engineer', name: 'Raj Patel', email: 'raj@mail.test', phone: '+91 22 555', appliedAt: addDays(-2), stage: 'applied' },
  ];
  const reviews = [
    { id: 1, employeeId: 4, employeeName: 'Kenji Sato', cycle: '2026-H1', reviewer: 'Asha Rao', rating: 4, status: 'completed', strengths: 'Ownership, mentoring', improvements: 'Estimation' },
    { id: 2, employeeId: 5, employeeName: 'Priya Nair', cycle: '2026-H1', reviewer: 'Asha Rao', rating: 3, status: 'submitted', strengths: 'Fast learner', improvements: 'Code review depth' },
    { id: 3, employeeId: 2, employeeName: 'Marco Diaz', cycle: '2026-H1', reviewer: 'Lena Fischer', rating: null, status: 'draft' },
  ];

  return {
    departments,
    designations,
    shifts,
    employees,
    'leave-types': leaveTypes,
    leaves,
    holidays,
    attendance,
    'payroll-runs': payrollRuns,
    payslips,
    expenses,
    assets,
    documents,
    announcements,
    jobs,
    candidates,
    reviews,
  };
}

/** Child collections reachable as `/{parent}/{id}/{child}`, keyed by the foreign key on the child. */
const RELATIONS: Record<string, { collection: string; foreignKey: string; parentField?: string }> = {
  'employees/attendance': { collection: 'attendance', foreignKey: 'employeeId' },
  'employees/leaves': { collection: 'leaves', foreignKey: 'employeeId' },
  'employees/payslips': { collection: 'payslips', foreignKey: 'employeeId' },
  'employees/documents': { collection: 'documents', foreignKey: 'employeeId' },
  'employees/assets': { collection: 'assets', foreignKey: 'assignedTo' },
  'departments/employees': { collection: 'employees', foreignKey: 'department', parentField: 'name' },
  'payroll-runs/payslips': { collection: 'payslips', foreignKey: 'payrollRunId' },
  'jobs/candidates': { collection: 'candidates', foreignKey: 'jobId' },
};

const PAGING_KEYS = ['page', 'pageSize', 'limit', 'offset', 'q', 'search', 'upcoming', 'year'];

export function createMockFetcher(options: MockOptions = {}) {
  const db: MockDb = { ...createMockDb(), ...(options.seed as MockDb) };
  const delay = options.delay ?? 250;
  const basePath = options.basePath ?? '/api';
  const me = options.currentEmployeeId ?? 1;

  const employeeName = (id: unknown) => db.employees.find((e) => String(e.id) === String(id))?.name ?? null;
  const nextId = (rows: Row[]) => rows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
  const today = () => iso(new Date());

  const withComputed = (resource: string, row: Row): Row => {
    if (resource === 'departments') return { ...row, employeeCount: db.employees.filter((e) => e.department === row.name).length };
    if (resource === 'jobs') return { ...row, candidateCount: db.candidates.filter((c) => c.jobId === row.id).length };
    return row;
  };

  const filterRows = (resource: string, rows: Row[], q: URLSearchParams) => {
    let out = rows.map((r) => withComputed(resource, r));
    q.forEach((raw, key) => {
      if (PAGING_KEYS.includes(key) || raw === '') return;
      const value = key === 'date' && raw === 'today' ? today() : raw;
      out = out.filter((r) => !(key in r) || String(r[key] ?? '') === value);
    });
    const search = q.get('q') ?? q.get('search');
    if (search) out = out.filter((r) => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
    if (q.get('upcoming') === 'true') out = out.filter((r) => String(r.date) >= today()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const year = q.get('year');
    if (year) out = out.filter((r) => String(r.date ?? '').startsWith(year));
    return out;
  };

  /** `/x/{id}/{action}` handlers that change state. */
  const ACTIONS: Record<string, (row: Row, body: Row) => Row | Response> = {
    'leaves/approve': (r) => Object.assign(r, { status: 'approved' }),
    'leaves/reject': (r, b) => Object.assign(r, { status: 'rejected', remarks: b.remarks }),
    'expenses/approve': (r) => Object.assign(r, { status: 'approved' }),
    'expenses/reject': (r, b) => Object.assign(r, { status: 'rejected', remarks: b.remarks }),
    'expenses/reimburse': (r) => Object.assign(r, { status: 'reimbursed' }),
    'assets/assign': (r, b) => Object.assign(r, { status: 'assigned', assignedTo: Number(b.employeeId), assignedToName: employeeName(b.employeeId) }),
    'assets/return': (r) => Object.assign(r, { status: 'available', assignedTo: null, assignedToName: null }),
    'candidates/stage': (r, b) => Object.assign(r, { stage: b.stage }),
    'attendance/regularize': (r, b) => Object.assign(r, { checkIn: b.checkIn, checkOut: b.checkOut, status: 'present' }),
    'payroll-runs/finalize': (r) => {
      Object.assign(r, { status: 'processed' });
      db.payslips.filter((p) => p.payrollRunId === r.id).forEach((p) => (p.status = 'processed'));
      return r;
    },
    'payroll-runs/mark-paid': (r) => {
      Object.assign(r, { status: 'paid' });
      db.payslips.filter((p) => p.payrollRunId === r.id).forEach((p) => (p.status = 'paid'));
      return r;
    },
  };

  const DOWNLOADS: Record<string, (row: Row) => [string, string]> = {
    payslips: (p) => [
      `PAYSLIP\n${p.employeeName}\nPeriod: ${p.period}\nGross: ${p.grossPay}\nDeductions: ${p.deductions}\nNet: ${p.netPay}\n`,
      'application/pdf',
    ],
    documents: (d) => [`Mock contents of ${d.name}\n`, 'application/octet-stream'],
  };

  const create = (resource: string, rows: Row[], body: Row): Row => {
    const row: Row = { ...body, id: nextId(rows) };
    for (const [k, v] of Object.entries(row)) if (typeof File !== 'undefined' && v instanceof File) row[k] = v.name;
    if ('employeeId' in row) row.employeeName = employeeName(row.employeeId);
    if (resource === 'leaves') {
      row.status = 'pending';
      row.days = Math.round((new Date(row.to).getTime() - new Date(row.from).getTime()) / 864e5) + 1;
    }
    if (resource === 'expenses') row.status = 'submitted';
    if (resource === 'documents') {
      row.uploadedAt = today();
      if (row.file && !row.name) row.name = row.file;
    }
    if (resource === 'candidates') {
      row.jobTitle = db.jobs.find((j) => String(j.id) === String(row.jobId))?.title;
      row.appliedAt = today();
    }
    if (resource === 'payroll-runs') {
      const staff = db.employees.filter((e) => e.status !== 'inactive');
      let gross = 0;
      let net = 0;
      for (const e of staff) {
        const grossPay = Math.round(e.salary / 12);
        const deductions = Math.round(grossPay * 0.18) + 200;
        db.payslips.push({ id: nextId(db.payslips), payrollRunId: row.id, employeeId: e.id, employeeName: e.name, period: row.period, basic: Math.round(grossPay * 0.7), allowances: Math.round(grossPay * 0.3), grossPay, tax: deductions - 200, deductions, netPay: grossPay - deductions, status: 'draft' });
        gross += grossPay;
        net += grossPay - deductions;
      }
      Object.assign(row, { employeeCount: staff.length, totalGross: gross, totalNet: net, status: 'draft' });
    }
    rows.push(row);
    return row;
  };

  const readBody = async (init: RequestInit): Promise<Row> => {
    if (typeof init.body === 'string') return JSON.parse(init.body);
    if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
      const out: Row = {};
      init.body.forEach((v, k) => (out[k] = v));
      return out;
    }
    return {};
  };

  return async function fetcher(url: string, init: RequestInit = {}): Promise<Response> {
    await new Promise((r) => setTimeout(r, delay));
    const u = new URL(url, 'http://mock.local');
    const path = u.pathname.startsWith(basePath) ? u.pathname.slice(basePath.length) || '/' : u.pathname;
    if (options.unauthorized?.some((p) => path.startsWith(p))) return json({ message: 'Authentication required' }, 401);
    if (options.forbidden?.some((p) => path.startsWith(p))) return json({ message: 'You do not have access to this resource' }, 403);

    const method = (init.method ?? 'GET').toUpperCase();
    const body = await readBody(init);
    const [resource, id, sub] = path.split('/').filter(Boolean);

    // Self-service attendance
    if (resource === 'attendance' && (id === 'check-in' || id === 'check-out')) {
      const existing = db.attendance.find((a) => a.employeeId === me && a.date === today());
      const time = new Date().toTimeString().slice(0, 5);
      if (id === 'check-in') {
        if (existing?.checkIn) return json({ message: 'Already checked in today' }, 409);
        const row = existing ?? create('attendance', db.attendance, { employeeId: me, date: today() });
        Object.assign(row, { checkIn: time, status: 'present' });
        return json(row, 201);
      }
      if (!existing?.checkIn) return json({ message: 'You have not checked in today' }, 409);
      return json(Object.assign(existing, { checkOut: time }));
    }

    const rows = db[resource];
    if (!rows) return json({ message: `Unknown endpoint ${path}` }, 404);

    if (!id) {
      if (method === 'GET') {
        const filtered = filterRows(resource, rows, u.searchParams);
        const page = Number(u.searchParams.get('page') ?? 0);
        const size = Number(u.searchParams.get('pageSize') ?? u.searchParams.get('limit') ?? 0);
        const items = page && size ? filtered.slice((page - 1) * size, page * size) : filtered;
        return json({ data: items, meta: { total: filtered.length } });
      }
      if (method === 'POST') return json(create(resource, rows, body), 201);
      return json({ message: 'Method not allowed' }, 405);
    }

    const row = rows.find((r) => String(r.id) === id);
    if (!row) return json({ message: 'Not found' }, 404);

    if (sub) {
      if (sub === 'leave-balances' && resource === 'employees') {
        return json({
          data: db['leave-types'].map((t) => {
            const used = db.leaves.filter((l) => l.employeeId === row.id && l.type === t.code && l.status === 'approved').reduce((s, l) => s + (l.days ?? 0), 0);
            return { id: t.id, leaveType: t.name, allotted: t.daysPerYear, used, remaining: t.daysPerYear - used };
          }),
        });
      }
      if (sub === 'download' && DOWNLOADS[resource]) {
        const [text, type] = DOWNLOADS[resource](row);
        return new Response(new Blob([text], { type }), { status: 200, headers: { 'Content-Type': type } });
      }
      const relation = RELATIONS[`${resource}/${sub}`];
      if (relation && method === 'GET') {
        const key = relation.parentField ? row[relation.parentField] : row.id;
        return json({ data: db[relation.collection].filter((r) => String(r[relation.foreignKey]) === String(key)) });
      }
      const action = ACTIONS[`${resource}/${sub}`];
      if (action && method === 'POST') {
        const result = action(row, body);
        return result instanceof Response ? result : json(result);
      }
      return json({ message: `Unknown endpoint ${path}` }, 404);
    }

    if (method === 'GET') return json(withComputed(resource, row));
    if (method === 'PUT' || method === 'PATCH') {
      Object.assign(row, body, { id: row.id });
      if ('employeeId' in body) row.employeeName = employeeName(body.employeeId);
      return json(row);
    }
    if (method === 'DELETE') {
      rows.splice(rows.indexOf(row), 1);
      return json(null, 204);
    }
    return json({ message: 'Method not allowed' }, 405);
  };
}
