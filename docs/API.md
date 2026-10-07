# API contract

This is the REST API that the built-in modules call **by default**. You don't need a backend to start:
`createMockFetcher()` from `hr-management-ui/mock` implements this whole contract in memory.

When you build a backend, you can either follow this contract or point each module at your own paths
with `endpoints`, `dataPath` and `totalPath` (see the README). Nothing here is hard-coded.

## Conventions

| Topic | Default behaviour |
| --- | --- |
| Base URL | Every path is appended to `api.baseUrl`, e.g. `https://api.acme.com/v1`. |
| Auth | Whatever you put in `api.headers` (e.g. `Authorization: Bearer …`) or cookies via `api.credentials: 'include'`. |
| List responses | `{ "data": [...], "meta": { "total": 42 } }`. A bare array works too, as do `items`, `results`, `content`/`totalElements`, `total` and `count`. |
| Single record | The record object itself (or set `dataPath`, e.g. `data`). |
| Pagination | Client-side by default. With `pagination: { mode: 'server' }` the UI sends `?page=1&pageSize=10` (names are configurable). |
| Search | Client-side by default. With `search: { param: 'q' }` the UI sends `?q=…`. |
| Filters | Sent as query params with the filter's `name`, e.g. `?status=pending`. |
| Create / update | JSON body with the form's field names. If a form contains a file, it is sent as `multipart/form-data`. |
| Errors | Non-2xx status. The UI shows `message` (or `error`, `detail`, `title`) from the JSON body. |
| **401** | The user isn't signed in or the session expired. The UI shows the 401 screen. Use `api.onError` to redirect to your login page. |
| **403** | The user is signed in but not allowed. The UI shows the 403 "Access denied" screen for pages, or a toast for actions. |
| Downloads | Respond with the file (e.g. `application/pdf`), or with JSON `{ "url": "https://signed-url" }`. |

## Endpoints by module

`{id}` is the record's id. `{user.id}` and other `{placeholders}` come from the record, the route and `config.user`.

### Dashboard (`dashboard`)
| Method | Path | Used for |
| --- | --- | --- |
| GET | `/employees` | Employees count (from `meta.total` or the array length) |
| GET | `/attendance?date=today&status=present` | Present today. `today` is a literal the server resolves. |
| GET | `/leaves?status=pending` | Pending leave requests count + recent list (`/leaves`) |
| GET | `/jobs?status=open` | Open positions count |
| GET | `/holidays?upcoming=true` | Upcoming holidays list |
| GET | `/announcements` | Latest announcements |

### Employees (`employees`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/employees` | `[{ id, employeeCode, name, email, phone, department, designation, manager, shift, joiningDate, salary, status }]` |
| GET | `/employees/{id}` | One employee |
| POST | `/employees` | Same fields. Returns the created record with its `id`. |
| PUT | `/employees/{id}` | Same fields |
| DELETE | `/employees/{id}` | |
| GET | `/employees/{id}/attendance` | Tab: attendance rows |
| GET | `/employees/{id}/leave-balances` | Tab: `[{ leaveType, allotted, used, remaining }]` |
| GET | `/employees/{id}/leaves` | Tab: leave requests |
| GET | `/employees/{id}/payslips` | Tab: payslips |
| GET | `/employees/{id}/documents` | Tab: documents |
| GET | `/employees/{id}/assets` | Tab: assigned assets |

`status`: `active` · `on_leave` · `inactive`

### Departments (`departments`) and Designations (`designations`)
Standard CRUD: `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}`. Same for `/designations`.
- Department: `{ id, name, code, head, description, employeeCount }`
- `GET /departments/{id}/employees` returns the members tab.
- Designation: `{ id, title, department, level, description }`

### Attendance (`attendance`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/attendance?date=&status=` | `[{ id, employeeId, employeeName, date, checkIn, checkOut, workHours, status }]` |
| POST | `/attendance/check-in` | Checks in the **current user** (from your auth). |
| POST | `/attendance/check-out` | Checks out the current user. |
| POST | `/attendance/{id}/regularize` | `{ checkIn, checkOut, reason }` |

`status`: `present` · `absent` · `late` · `half_day` · `on_leave`

### Shifts (`shifts`)
Standard CRUD on `/shifts`: `{ id, name, startTime, endTime, graceMinutes, workingDays }`.

### Leave requests (`leaves`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/leaves?status=` | `[{ id, employeeId, employeeName, type, from, to, days, reason, status, remarks }]` |
| GET | `/leaves/{id}` | |
| POST | `/leaves` | `{ employeeId, type, from, to, reason }`. The server sets `status: "pending"`. |
| POST | `/leaves/{id}/approve` | Approve |
| POST | `/leaves/{id}/reject` | `{ remarks }` |

`status`: `pending` · `approved` · `rejected` · `cancelled`

### Leave types (`leaveTypes`)
Standard CRUD on `/leave-types`: `{ id, name, code, daysPerYear, maxConsecutiveDays, paid, carryForward }`.
The leave request form loads its options from here (label `name`, value `code`).

### Holidays (`holidays`)
Standard CRUD on `/holidays`: `{ id, name, date, type, location, description }`.
- Filters: `?year=2026`, `?type=public|optional|company`
- `?upcoming=true` returns holidays from today onwards, sorted by date (used by the dashboard).

### Payroll runs (`payroll`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/payroll-runs` | `[{ id, period, employeeCount, totalGross, totalNet, status }]` |
| GET | `/payroll-runs/{id}` | |
| POST | `/payroll-runs` | `{ period: "2026-10" }`. Creates a `draft` run and its payslips. |
| POST | `/payroll-runs/{id}/finalize` | `draft` → `processed` |
| POST | `/payroll-runs/{id}/mark-paid` | `processed` → `paid` |
| GET | `/payroll-runs/{id}/payslips` | Tab: payslips of the run |

### Payslips (`payslips`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/payslips?period=` | `[{ id, employeeId, employeeName, period, basic, allowances, grossPay, tax, deductions, netPay, status }]` |
| GET | `/payslips/{id}` | |
| GET | `/payslips/{id}/download` | The PDF file, or `{ url }` |

### Expenses (`expenses`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/expenses?status=` | `[{ id, employeeId, employeeName, title, category, date, amount, status }]` |
| GET | `/expenses/{id}` | |
| POST | `/expenses` | Multipart: `employeeId, title, category, date, amount, notes, receipt (file)` |
| POST | `/expenses/{id}/approve` · `/reject` (`{ remarks }`) · `/reimburse` | |

`status`: `submitted` · `approved` · `rejected` · `reimbursed`

### Assets (`assets`)
Standard CRUD on `/assets`: `{ id, tag, name, type, serialNumber, purchaseDate, cost, assignedTo, assignedToName, status }`.
- `POST /assets/{id}/assign` with `{ employeeId }`
- `POST /assets/{id}/return`

### Documents (`documents`)
| Method | Path | Body / notes |
| --- | --- | --- |
| GET | `/documents?category=` | `[{ id, name, category, employeeId, employeeName, uploadedAt }]` |
| POST | `/documents` | Multipart: `name, category, employeeId, file` |
| DELETE | `/documents/{id}` | |
| GET | `/documents/{id}/download` | The file, or `{ url }` |

### Announcements (`announcements`)
Standard CRUD on `/announcements`: `{ id, title, message, audience, status, publishedAt }`.

### Job openings (`recruitment`) and Candidates (`candidates`)
- Standard CRUD on `/jobs`: `{ id, title, department, location, employmentType, openings, status, candidateCount }`
- `GET /jobs/{id}/candidates` returns the candidates tab.
- Standard CRUD on `/candidates`: `{ id, name, email, phone, jobId, jobTitle, appliedAt, stage }`. Create is multipart (`resume` file).
- `POST /candidates/{id}/stage` with `{ stage }`

### Performance reviews (`performance`)
Standard CRUD on `/reviews`: `{ id, employeeId, employeeName, cycle, reviewer, rating, status, strengths, improvements }`.
