# hr-management-ui

A complete HR management UI for React, styled with Tailwind CSS. You configure everything, either from JavaScript or from a JSON document your API serves: which modules (tabs) exist, their routes, the API endpoints they call, table columns, forms, actions and who can access what.

It ships **18 ready-made modules**: dashboard, employees, documents, departments, designations, assets, announcements, attendance, shifts, leave requests, leave types, holidays, payroll runs, payslips, expenses, job openings, candidates and performance reviews. You can also add your own.

- **Works with any backend.** You set the paths, methods, query params, response shape and auth headers for each endpoint.
- **No backend yet?** Use the built-in mock API (`hr-management-ui/mock`). It implements the documented [API contract](docs/API.md), so you can build the frontend first.
- **Access control without a login screen.** Sign-in is handled by your app. Users without access see a **401/403 screen**. This happens when they lack a role or permission, or when your API returns 401/403.
- **Tailwind CSS v4.** You get one precompiled stylesheet, and your app doesn't need Tailwind. Every class is prefixed with `hrm:`, and the reset only applies inside the component, so it won't clash with your app's styles.
- **CRUD from config.** It builds lists, detail pages with related tabs, forms, search, filters, pagination, sorting, custom actions (approve, reject, download PDF, check-in, run payroll …) and dashboards.
- **TypeScript**, a responsive layout, theming and i18n labels. The only dependencies are `react` and `react-dom` (17+).

## Install

```bash
npm install hr-management-ui
```

## Quick start

```tsx
import { HRManagement, allModules } from 'hr-management-ui';
import 'hr-management-ui/styles.css';

const config = {
  api: {
    baseUrl: 'https://api.acme.com/v1',
    headers: async () => ({ Authorization: `Bearer ${await getToken()}` }),
    onError: (err) => err.status === 401 && redirectToYourLogin(),
  },
  user: { id: 42, name: 'Jane Doe', roles: ['hr'], permissions: ['*'] },
  modules: allModules(), // every built-in module
};

export default function App() {
  return <HRManagement config={config} />;
}
```

> Define the config **outside** your component, or wrap it in `useMemo`, so it isn't recreated on every render.

### Without a backend (frontend-first)

```tsx
import { createMockFetcher } from 'hr-management-ui/mock';

const config = {
  api: { baseUrl: '/api', fetcher: createMockFetcher() },
  modules: allModules(),
};
```

`createMockFetcher` accepts `{ delay, forbidden: ['/payroll-runs'], unauthorized: [...], seed }`, so you can also preview the 401/403 screens. When your real API is ready, remove `fetcher`.

### Pick and customise modules

```tsx
import { allModules, preset } from 'hr-management-ui';

modules: [
  preset('dashboard'),
  preset('employees', { path: '/staff', endpoints: { list: '/v2/staff' } }),
  preset('attendance'),
  preset('leaves', { roles: ['hr', 'manager'] }),
  preset('holidays'),
  preset('payslips', { pagination: { mode: 'server', pageSize: 25 } }),
]
// or: allModules(['dashboard', 'employees', 'attendance', 'leaves', 'holidays'])
```

`preset()` merges `endpoints` key by key, so you only restate what's different.

### Configuration served by your API

```tsx
<HRManagement configUrl="/api/hr-ui-config" configRequestInit={{ credentials: 'include' }} />
```

```json
{
  "api": { "baseUrl": "https://api.acme.com/v1" },
  "routing": { "mode": "browser", "basePath": "/hr" },
  "user": { "id": 42, "name": "Jane Doe", "roles": ["manager"] },
  "modules": [
    { "preset": "dashboard" },
    { "preset": "employees", "path": "/staff", "endpoints": { "list": "/hr/staff" } },
    { "preset": "holidays" },
    { "preset": "payroll", "roles": ["hr"] }
  ]
}
```

Your server can return a different config for each user, tenant or plan. Use `overrides` to attach things JSON can't hold (functions, components, auth headers). Modules are matched by `key`. See [`examples/hr-config.example.json`](examples/hr-config.example.json).

## Modules

| Preset | Route | What it does |
| --- | --- | --- |
| `dashboard` | `/dashboard` | Stat cards and lists: headcount, present today, pending leaves, open jobs, upcoming holidays, announcements |
| `employees` | `/employees` | Directory with CRUD. Detail tabs: attendance, leave balance, leaves, payslips, documents, assets |
| `documents` | `/documents` | Upload (file), list and download policies, contracts and ID proofs |
| `departments` | `/departments` | CRUD + members tab |
| `designations` | `/designations` | Job titles and levels |
| `assets` | `/assets` | Inventory with assign/return actions |
| `announcements` | `/announcements` | Company announcements |
| `attendance` | `/attendance` | Daily attendance, date/status filters, check-in/check-out, regularization |
| `shifts` | `/shifts` | Shift timings and grace periods |
| `leaves` | `/leaves` | Leave requests: apply, approve, reject with reason |
| `leaveTypes` | `/leave-types` | Leave policy: days per year, paid, carry forward |
| `holidays` | `/holidays` | Holiday calendar with weekday and year/type filters |
| `payroll` | `/payroll` | Payroll runs: run → finalize → mark paid, payslips tab |
| `payslips` | `/payslips` | Payslips with PDF download |
| `expenses` | `/expenses` | Reimbursement claims with receipt upload, approve/reject/reimburse |
| `recruitment` | `/recruitment` | Job openings + candidates tab |
| `candidates` | `/candidates` | Candidate pipeline with stage changes |
| `performance` | `/performance` | Performance review cycles and ratings |

The endpoints each module calls are listed in **[docs/API.md](docs/API.md)**.

## Access control (401 / 403)

There's no login screen. Your app signs users in and passes who they are:

```ts
user: { id: 7, name: 'Sam', roles: ['manager'], permissions: ['leaves.view', 'leaves.approve'] }
```

Access is checked in three places:

1. **Roles on modules and actions.** A user without one of the `roles` doesn't see the tab. Opening its URL shows **403 Access denied**.
   ```ts
   preset('payroll', { roles: ['hr', 'admin'] })
   ```
2. **Permissions.** `view` guards the module, and `create`/`update`/`delete` guard the matching buttons and routes. Actions and widgets accept a `permission` too. `'*'` grants everything.
   ```ts
   import { crudPermissions, preset, presets } from 'hr-management-ui';
   preset('employees', { permissions: crudPermissions('employees') }) // employees.view / .create / .update / .delete
   // require leaves.approve / leaves.reject for the built-in leave actions
   preset('leaves', { actions: presets.leaves.actions!.map((a) => ({ ...a, permission: `leaves.${a.key}` })) })
   ```
3. **Your API has the final say.** If an endpoint returns **401** or **403**, the page shows the matching screen, along with the server's `message`. If an action gets a 403, the user sees a toast.

Options:

```ts
access: {
  showLockedModules: true,           // show forbidden tabs with a lock icon instead of hiding them
  component: MyAccessDeniedScreen,   // replace the built-in 401/403 screen ({ status, module, message })
},
labels: { forbiddenTitle: 'No access', forbiddenMessage: '…', unauthorizedTitle: '…', unauthorizedMessage: '…' },
```

## Adding your own module

Every module is plain config. The built-in ones live in [`src/modules/`](src/modules) (one file each) and make good templates:

```ts
import { defineModule, crudEndpoints, options } from 'hr-management-ui';

export const trainings = defineModule({
  key: 'trainings',
  label: 'Trainings',
  path: '/trainings',
  icon: 'award',
  group: 'Talent',
  search: true,
  endpoints: crudEndpoints('/trainings'),           // GET/POST /trainings, GET/PUT/DELETE /trainings/{id}
  columns: [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'date', label: 'Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'badge' },
  ],
  fields: [
    { name: 'title', label: 'Title', required: true },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'status', label: 'Status', type: 'select', options: options('planned', 'done') },
  ],
  tabs: [{ key: 'attendees', label: 'Attendees', endpoint: '/trainings/{id}/attendees', columns: [{ key: 'name', label: 'Name' }] }],
  actions: [{ key: 'enroll', label: 'Enroll', endpoint: { path: '/trainings/{id}/enroll', method: 'POST' }, when: { status: 'planned' } }],
});

// config.modules: [...allModules(), trainings]
```

For a fully custom screen, use `type: 'custom'` with a `component`. It receives `{ module, params, navigate, api }`. You can build it from the exported pieces (`Page`, `PageHeader`, `DataTable`, `ResourceForm`, `Button`, `Badge`, `Icon`, `useHR`, `Link`), so it matches the rest of the app.

## Configuration reference

### `HRConfig`

| Key | Description |
| --- | --- |
| `api` | `{ baseUrl, headers, credentials, fetcher, dataPath, totalPath, onError }` |
| `modules` | Modules or `{ preset, ...overrides }`, in sidebar order |
| `routing` | `{ mode: 'hash' \| 'browser' \| 'memory', basePath, initialPath }`. Hash mode is the default and needs no server setup. |
| `user` | `{ id, name, email, avatarUrl, roles, permissions }`. Shown in the header. Available as `{user.*}` in endpoint paths. |
| `access` | `{ showLockedModules, component }` |
| `branding` | `{ title, logo, theme }` |
| `locale`, `currency` | Formatting defaults (`Intl`) |
| `labels` | Override any UI text (i18n) |
| `onLogout`, `headerExtra`, `onNavigate` | Hooks into the shell |

### Endpoints

A string path, or an object:

```ts
{
  path: '/employees/{id}',          // {placeholders} from the record, route and {user.*}
  method: 'PUT',
  query: { orgId: '{user.orgId}' },
  headers: { 'X-Tenant': 'acme' },
  dataPath: 'result', totalPath: 'paging.total',
  responseType: 'blob',
  transformRequest: (body) => ({ employee: body }),
  transformResponse: (res) => res.payload,
}
```

### Module options

| Key | Description |
| --- | --- |
| `key`, `label`, `path`, `icon`, `group`, `description` | Identity and placement in the sidebar |
| `type` | `resource` (default), `dashboard` or `custom` |
| `roles`, `permissions`, `hidden` | Access control / hide from the sidebar |
| `endpoints` | `{ list, get, create, update, delete }`. Only the ones you provide are enabled. |
| `columns`, `detailFields` | `{ key, label, type, sortable, badgeColors, currency, render }`. `type` can be `text`, `number`, `currency`, `date`, `datetime`, `weekday`, `boolean`, `badge`, `email`, `image` or `link`. |
| `fields` | Form fields. `type` can be `text`, `email`, `tel`, `number`, `password`, `date`, `datetime-local`, `time`, `textarea`, `select`, `checkbox`, `file` or `hidden`. Fields also take `required`, `options`/`optionsEndpoint`, `defaultValue`, `showIn` and `validate`. |
| `filters`, `search`, `pagination` | List controls (client- or server-side) |
| `actions` | `{ key, label, endpoint, scope: 'row' \| 'toolbar', when, confirm, fields, download, openInNewTab, roles, permission, variant, icon }` |
| `tabs` | Related lists on the detail page |
| `widgets` | Dashboard `stat` / `list` widgets |
| `component` | Your component for `type: 'custom'` |

### Theming

```ts
branding: { title: 'Acme HR', logo: '/logo.svg', theme: { primary: '#0f766e', sidebar: '#0b1220', radius: '0.5rem' } }
```

The theme keys are `primary`, `primaryContrast`, `background`, `surface`, `text`, `muted`, `border`, `sidebar`, `sidebarText`, `radius` and `font`. You can also override the `--hrm-*` CSS variables on `.hrm-root`.

## Project structure

```
src/
  HRManagement.tsx      app shell: loads config, providers, toasts, confirm dialog
  types.ts              every public config type
  core/                 API client, router, context, permissions, formatting, config merging
  layout/               sidebar + header
  views/                list, detail, form, dashboard, routes (+ 403 handling)
  ui/                   Tailwind components: Button, Badge, DataTable, Form, Modal, AccessDenied…
  modules/              one file per HR module (employees.ts, holidays.ts, attendance.ts…)
  mock/                 in-memory backend (published as hr-management-ui/mock)
  styles/               Tailwind entry (compiled to dist/styles.css)
docs/API.md             the REST contract the modules use by default
examples/               demo app + JSON config example
```

## Development

```bash
npm install
npm run dev        # demo with every module on the mock API (examples/demo)
npm test           # vitest
npm run typecheck
npm run build      # dist/: ESM + CJS + .d.ts for "." and "./mock", plus styles.css
npm publish        # runs typecheck, tests and build first
```

## License

MIT
