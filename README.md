# react-hr-management-ui

A complete HR management UI for React that you configure entirely, either from JavaScript or from a JSON document served by your API. It includes **employees, departments, attendance, leave requests, payslips, payroll and a dashboard**. You decide which tabs exist, which routes they live on, and which API endpoints each tab calls.

- **Any backend.** It works with any REST API. You set paths, methods, query params, the response shape (`dataPath`/`totalPath`) and auth headers per endpoint.
- **Configure from your API.** Point `configUrl` at your server and it can switch modules on or off per tenant or user without a redeploy.
- **Built-in presets.** Start from `preset('employees')` and override only what differs.
- **CRUD with no extra code.** It builds lists, detail pages, create and edit forms, deletes, search, filters, pagination and sorting from config.
- **Actions.** Approve or reject leave, download payslip PDFs, run payroll, or call any custom endpoint, with optional confirm prompts and input forms.
- **Related tabs** on detail pages, e.g. `/employees/{id}/payslips`.
- **Role-based tabs**, theming with CSS variables, i18n labels, a responsive layout, and TypeScript types.
- **No runtime dependencies.** It only needs `react` and `react-dom` (17+).

## Install

```bash
npm install react-hr-management-ui
```

## Quick start

```tsx
import { HRManagement, preset } from 'react-hr-management-ui';
import 'react-hr-management-ui/styles.css';

export default function App() {
  return (
    <HRManagement
      config={{
        api: {
          baseUrl: 'https://api.acme.com/v1',
          headers: async () => ({ Authorization: `Bearer ${await getToken()}` }),
          onError: (err) => err.status === 401 && redirectToLogin(),
        },
        user: { id: 42, name: 'Jane Doe', roles: ['hr'] },
        modules: [
          preset('dashboard'),
          preset('employees'),
          preset('departments'),
          preset('attendance'),
          preset('leaves'),
          preset('payslips'),
        ],
      }}
    />
  );
}
```

> Define the config **outside** your component, or wrap it in `useMemo`, so it isn't recreated on every render.

## Loading the configuration from your API

```tsx
<HRManagement
  configUrl="/api/hr-ui-config"
  configRequestInit={{ credentials: 'include' }}
  // JS-only bits (functions, components) merged over the JSON, matched by module `key`
  overrides={{ api: { headers: () => ({ Authorization: `Bearer ${token}` }) } }}
/>
```

The endpoint returns JSON shaped like `HRConfig`. Modules can reference presets:

```json
{
  "api": { "baseUrl": "https://api.acme.com/v1", "dataPath": "data", "totalPath": "meta.total" },
  "routing": { "mode": "browser", "basePath": "/hr" },
  "branding": { "title": "Acme HR", "theme": { "primary": "#0f766e" } },
  "modules": [
    { "preset": "dashboard" },
    { "preset": "employees", "path": "/staff", "endpoints": { "list": "/hr/staff", "get": "/hr/staff/{id}" } },
    { "preset": "leaves", "roles": ["hr", "manager"] }
  ]
}
```

See [`examples/hr-config.example.json`](examples/hr-config.example.json) for a full example, including a fully custom module.

## Configuration reference

### `HRConfig`

| Key | Type | Description |
| --- | --- | --- |
| `api` | `ApiConfig` | How to reach your backend (required). |
| `modules` | `ModuleConfig[]` | The tabs/pages, in sidebar order (required). |
| `routing` | `{ mode, basePath, initialPath }` | `hash` (default), `browser` or `memory`. `initialPath` is where `/` redirects. |
| `branding` | `{ title, logo, theme }` | Name, logo URL/element, and theme colors. |
| `user` | `{ id, name, email, avatarUrl, roles }` | Shown in the header. `roles` filter modules, and the user is available as `{user.*}` in endpoint paths. |
| `currency` / `locale` | `string` | Defaults for currency/date formatting. |
| `labels` | `Partial<Labels>` | Override any UI text (i18n). |
| `onLogout`, `headerExtra`, `onNavigate` | | Hooks into the shell. |

### `ApiConfig`

| Key | Description |
| --- | --- |
| `baseUrl` | Prepended to every endpoint path (absolute `https://` paths are left alone). |
| `headers` | An object, or a sync/async function returning one (for tokens). |
| `credentials` | Passed to `fetch`, e.g. `'include'` for cookie auth. |
| `fetcher` | A custom transport with the `fetch` signature (axios adapter, mocks, tests). |
| `dataPath` / `totalPath` | Default location of the payload and the total count in responses, e.g. `data` and `meta.total`. If omitted, common shapes (`data`, `items`, `results`, `content`, `total`, `totalElements`, `meta.total`, …) are detected automatically. |
| `onError` | Called for every failed request. |

### Endpoints

An endpoint is a string path or an object:

```ts
{
  path: '/employees/{id}',        // {placeholders} come from the record, route params and {user.*}
  method: 'PUT',
  query: { orgId: '{user.orgId}' },
  headers: { 'X-Tenant': 'acme' },
  dataPath: 'result',
  totalPath: 'paging.total',
  responseType: 'blob',           // 'json' | 'text' | 'blob'
  transformRequest: (body) => ({ employee: body }),
  transformResponse: (res) => res.payload,
}
```

Bodies are sent as JSON, or as `multipart/form-data` when a field is a file.

### `ModuleConfig`

Each module is one tab or route. Its `type` is `resource` (default), `dashboard` or `custom`.

| Key | Description |
| --- | --- |
| `key`, `label`, `path`, `icon`, `group` | Identity, sidebar label, route, icon name, and sidebar group heading. |
| `roles`, `hidden` | Show only for these roles / hide from the sidebar but keep the route. |
| `endpoints` | `{ list, get, create, update, delete }`. Only the ones you provide are enabled: no `create` means no "Add new" button. Without `get`, the detail page finds the record in the list response. |
| `columns` | List columns: `{ key, label, type, sortable, badgeColors, currency, render }`. `type` can be `text`, `number`, `currency`, `date`, `datetime`, `boolean`, `badge`, `email`, `image` or `link`. `key` supports dot paths (`department.name`). |
| `detailFields` | What the detail page shows (defaults to `columns`). |
| `fields` | Create/edit form fields: `{ name, label, type, required, options, optionsEndpoint, optionLabelKey, optionValueKey, defaultValue, showIn, validate, ... }`. `type` can be `text`, `email`, `tel`, `number`, `password`, `date`, `datetime-local`, `time`, `textarea`, `select`, `checkbox`, `file` or `hidden`. |
| `filters` | Fields shown above the list. Their values are sent as query params. |
| `search` | `true` (client-side) or `{ param: 'q' }` (server-side). |
| `pagination` | `{ mode: 'client' \| 'server' \| 'none', pageParam, pageSizeParam, pageSize, zeroBased }`. |
| `actions` | Custom buttons (see below). |
| `tabs` | Related lists on the detail page: `{ key, label, endpoint, columns, actions }`. |
| `primaryKey`, `titleField`, `disableDetail` | Record id field (default `id`), detail title field (default `name`), and whether to disable the detail page. |
| `widgets` | For `type: 'dashboard'`: `stat` cards and `list` widgets. |
| `component` | For `type: 'custom'`: your own React component, which receives `{ module, params, navigate, api }`. |

Routes created for a resource module at `path: '/employees'`:

| Route | View |
| --- | --- |
| `/employees` | list |
| `/employees/new` | create form (if `endpoints.create`) |
| `/employees/:id` | detail with related tabs |
| `/employees/:id/edit` | edit form (if `endpoints.update`) |

### Actions

```ts
actions: [
  // Row button, only shown for pending records
  { key: 'approve', label: 'Approve', endpoint: { path: '/leaves/{id}/approve', method: 'POST' },
    when: { status: 'pending' }, variant: 'primary', successMessage: 'Approved' },

  // Ask for input first; the values become the request body
  { key: 'reject', label: 'Reject', endpoint: '/leaves/{id}/reject', variant: 'danger',
    fields: [{ name: 'remarks', label: 'Reason', type: 'textarea', required: true }] },

  // File download (blob response, or JSON `{ url }` for a signed URL)
  { key: 'pdf', label: 'Download', endpoint: '/payslips/{id}/pdf', download: { filename: 'payslip-{period}.pdf' } },

  // Toolbar button above the table
  { key: 'export', label: 'Export CSV', scope: 'toolbar', endpoint: '/employees/export', download: { filename: 'employees.csv' } },

  // Open a URL in a new tab
  { key: 'profile', label: 'Open in ERP', endpoint: 'https://erp.acme.com/people/{employeeCode}', openInNewTab: true },
]
```

Other options are `confirm: 'Are you sure?'`, `icon`, `method`, `reload`, and `visible: (record) => boolean`.

### Presets

`presets` is exported, and `preset(name, overrides)` returns a module merged with your overrides. The `endpoints` object is merged key by key, so you can change one path without restating the rest:

```ts
preset('employees', { path: '/people', endpoints: { list: '/v2/people' } })
```

| Preset | Default endpoints |
| --- | --- |
| `dashboard` | `GET /employees`, `GET /departments`, `GET /leaves?status=pending`, `GET /leaves` |
| `employees` | `GET/POST /employees`, `GET/PUT/DELETE /employees/{id}`, tabs: `GET /employees/{id}/payslips`, `GET /employees/{id}/leaves`, `GET /payslips/{id}/download` |
| `departments` | `GET/POST /departments`, `GET/PUT/DELETE /departments/{id}` |
| `attendance` | `GET /attendance?date=&status=` |
| `leaves` | `GET/POST /leaves`, `GET /leaves/{id}`, `POST /leaves/{id}/approve`, `POST /leaves/{id}/reject` |
| `payslips` | `GET /payslips?month=`, `GET /payslips/{id}`, `GET /payslips/{id}/download`, `POST /payroll/run` |

### Theming

Pass `branding.theme` (`primary`, `background`, `surface`, `text`, `muted`, `border`, `sidebar`, `sidebarText`, `radius`, `font`), or override the `--hrm-*` CSS variables on `.hrm-root`.

### Building your own pages

`useHR()` (gives you `api`, `toast`, `confirm`, `labels`), `useRouter()`, `Link`, `DataTable`, `ResourceForm`, `Icon`, `createApiClient`, `defineHRConfig` and every type are exported, so custom modules look and behave like the built-in ones.

## Development

```bash
npm install
npm run dev        # demo app with an in-memory mock API (examples/demo)
npm test           # vitest
npm run typecheck
npm run build      # dist/ (ESM + CJS + .d.ts + styles.css)
npm publish        # runs typecheck, tests and build first
```

## License

MIT
