import type { ComponentType, ReactNode } from 'react';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/** Anything that can be interpolated into an endpoint path: route params, the current record, the user. */
export type TemplateVars = Record<string, unknown>;

/**
 * Describes one HTTP call. A plain string is shorthand for `{ path }`.
 *
 * Paths may contain `{placeholders}` which are filled from the current record,
 * route params and the configured user, e.g. `/employees/{id}/payslips` or
 * `/users/{user.id}/leaves`.
 */
export type EndpointConfig = string | EndpointObject;

export interface EndpointObject {
  path: string;
  method?: HttpMethod;
  /** Static query params added to every call. Values are interpolated too. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** Extra headers for this call only. */
  headers?: Record<string, string>;
  /** Dot path to the payload inside the response, e.g. `data` or `data.items`. */
  dataPath?: string;
  /** Dot path to the total record count (lists with server pagination), e.g. `meta.total`. */
  totalPath?: string;
  /** How to read the response body. `blob` is useful for PDF payslips. Default: auto (json/text). */
  responseType?: 'json' | 'text' | 'blob';
  /** Change the outgoing body before it is sent. */
  transformRequest?: (body: unknown, vars: TemplateVars) => unknown;
  /** Change the raw response before `dataPath` / `totalPath` are applied. */
  transformResponse?: (response: unknown, vars: TemplateVars) => unknown;
}

export type HeadersInput =
  | Record<string, string>
  | (() => Record<string, string> | Promise<Record<string, string>>);

export interface ApiConfig {
  /** Base URL that every endpoint path is appended to, e.g. `https://api.acme.com/v1`. */
  baseUrl: string;
  /** Static headers, or a (possibly async) function – handy for bearer tokens. */
  headers?: HeadersInput;
  /** Passed to `fetch` – use `include` for cookie based auth. */
  credentials?: RequestCredentials;
  /** Swap the transport (axios adapter, mocks, tests…). Must behave like `fetch`. */
  fetcher?: (url: string, init: RequestInit) => Promise<Response>;
  /** Called for every failed request – e.g. redirect to login on 401. */
  onError?: (error: ApiErrorLike) => void;
  /** Default `dataPath` for every endpoint that does not set one. */
  dataPath?: string;
  /** Default `totalPath` for every list endpoint that does not set one. */
  totalPath?: string;
}

export interface ApiErrorLike {
  message: string;
  status: number;
  body: unknown;
  url: string;
}

export type ColumnType =
  | 'text'
  | 'number'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'badge'
  | 'email'
  | 'image'
  | 'link';

export interface ColumnConfig {
  /** Dot path into the record, e.g. `department.name`. */
  key: string;
  label: string;
  type?: ColumnType;
  /** ISO currency code for `currency` columns. Falls back to the global `currency`. */
  currency?: string;
  /** Map of value → color for `badge` columns, e.g. `{ approved: 'green', rejected: 'red' }`. */
  badgeColors?: Record<string, BadgeColor>;
  /** Allow client-side sorting by clicking the header. */
  sortable?: boolean;
  width?: string;
  /** Custom cell renderer (JS config only). */
  render?: (value: unknown, record: Record<string, any>) => ReactNode;
}

export type BadgeColor = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'password'
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'file'
  | 'hidden';

export interface FieldOption {
  label: string;
  value: string | number;
}

export interface FieldConfig {
  /** Dot path in the submitted body, e.g. `address.city`. */
  name: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: unknown;
  readOnly?: boolean;
  min?: number | string;
  max?: number | string;
  pattern?: string;
  /** Static options for `select`. */
  options?: FieldOption[];
  /** Load `select` options from the API. */
  optionsEndpoint?: EndpointConfig;
  /** Record key used as option label when loading options. Default `name`. */
  optionLabelKey?: string;
  /** Record key used as option value when loading options. Default `id`. */
  optionValueKey?: string;
  /** Only show in these forms. Default: both. */
  showIn?: Array<'create' | 'edit'>;
  /** Span both grid columns. */
  fullWidth?: boolean;
  /** Custom validation (JS config only). Return an error message or nothing. */
  validate?: (value: unknown, values: Record<string, any>) => string | undefined | null;
}

export interface ActionConfig {
  key: string;
  label: string;
  endpoint: EndpointConfig;
  /** `row` actions appear on every record, `toolbar` actions above the table. Default `row`. */
  scope?: 'row' | 'toolbar';
  /** Default method when `endpoint` does not set one. Default `POST` (or `GET` for downloads). */
  method?: HttpMethod;
  variant?: 'primary' | 'danger' | 'default';
  icon?: IconName | ReactNode;
  /** Ask for confirmation first. */
  confirm?: string;
  /** Collect input before calling, e.g. a rejection reason. Sent as the request body. */
  fields?: FieldConfig[];
  /** Treat the response as a file download (payslip PDFs, exports…). */
  download?: boolean | { filename?: string };
  /** Open the interpolated endpoint URL in a new tab instead of calling it. */
  openInNewTab?: boolean;
  /** Show only when the record matches, e.g. `{ status: 'pending' }`. */
  when?: Record<string, unknown | unknown[]>;
  /** Show only when this returns true (JS config only). */
  visible?: (record: Record<string, any>) => boolean;
  successMessage?: string;
  /** Reload the list after success. Default `true` (not for downloads). */
  reload?: boolean;
}

export interface PaginationConfig {
  /** `server`: send page params and read total; `client`: paginate the fetched array; `none`. Default `client`. */
  mode?: 'server' | 'client' | 'none';
  pageParam?: string;
  pageSizeParam?: string;
  pageSize?: number;
  /** Set when your API counts pages from 0 (e.g. Spring). */
  zeroBased?: boolean;
}

export interface SearchConfig {
  /** Query param sent to the server. If omitted, search is done client-side. */
  param?: string;
  placeholder?: string;
}

/** A related list shown as a tab on a record's detail page, e.g. an employee's payslips. */
export interface RelatedTabConfig {
  key: string;
  label: string;
  /** Interpolated with the parent record, e.g. `/employees/{id}/payslips`. */
  endpoint: EndpointConfig;
  columns: ColumnConfig[];
  actions?: ActionConfig[];
  primaryKey?: string;
}

export type WidgetConfig =
  | {
      key: string;
      type: 'stat';
      label: string;
      endpoint: EndpointConfig;
      /** Dot path to the number in the response. If the response is a list, its length is used. */
      valuePath?: string;
      format?: 'number' | 'currency' | 'percent';
      icon?: IconName | ReactNode;
      color?: BadgeColor;
      /** Navigate to this route when clicked. */
      link?: string;
    }
  | {
      key: string;
      type: 'list';
      label: string;
      endpoint: EndpointConfig;
      columns: ColumnConfig[];
      limit?: number;
      link?: string;
    };

export interface ModuleComponentProps {
  module: ModuleConfig;
  /** Route params, e.g. `{ id: '42' }` for `/employees/42`. */
  params: Record<string, string>;
  navigate: (path: string) => void;
  api: ApiClient;
}

export interface ModuleConfig {
  /** Unique id. */
  key: string;
  /** Sidebar / tab label. */
  label: string;
  /** Route path inside the HR app, e.g. `/employees`. */
  path: string;
  icon?: IconName | ReactNode;
  /** `resource` = CRUD list/detail/form (default), `dashboard` = widgets, `custom` = your component. */
  type?: 'resource' | 'dashboard' | 'custom';
  /** Hide from the sidebar but keep the route. */
  hidden?: boolean;
  /** Only show if the configured user has one of these roles. */
  roles?: string[];
  /** Optional sidebar group heading. */
  group?: string;
  description?: string;

  // ---- resource ----
  primaryKey?: string;
  /** Record field used as the title on detail pages. */
  titleField?: string;
  endpoints?: {
    list?: EndpointConfig;
    get?: EndpointConfig;
    create?: EndpointConfig;
    update?: EndpointConfig;
    delete?: EndpointConfig;
  };
  columns?: ColumnConfig[];
  /** Fields for create/edit forms. */
  fields?: FieldConfig[];
  /** What to show on the detail page. Defaults to `columns`. */
  detailFields?: ColumnConfig[];
  /** Related lists on the detail page. */
  tabs?: RelatedTabConfig[];
  actions?: ActionConfig[];
  /** Filters rendered above the list; their values are sent as query params. */
  filters?: FieldConfig[];
  search?: boolean | SearchConfig;
  pagination?: PaginationConfig;
  /** Disable the detail page; rows will not be clickable. */
  disableDetail?: boolean;

  // ---- dashboard ----
  widgets?: WidgetConfig[];

  // ---- custom ----
  component?: ComponentType<ModuleComponentProps>;
}

/**
 * A full module, or a built-in preset (`employees`, `departments`, `attendance`, `leaves`,
 * `payslips`, `dashboard`) plus overrides – handy in JSON configs served by your API.
 */
export type ModuleInput = ModuleConfig | (Partial<ModuleConfig> & { preset: string });

export interface ThemeConfig {
  primary?: string;
  primaryContrast?: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  border?: string;
  sidebar?: string;
  sidebarText?: string;
  radius?: string;
  font?: string;
}

export interface UserInfo {
  id?: string | number;
  name?: string;
  email?: string;
  avatarUrl?: string;
  roles?: string[];
  [key: string]: unknown;
}

export interface RoutingConfig {
  /**
   * `hash` (default) works anywhere without server config, `browser` uses the History API
   * (pair with `basePath`), `memory` keeps routes internal (embedded widgets, tests).
   */
  mode?: 'hash' | 'browser' | 'memory';
  /** Prefix for `browser` mode, e.g. `/hr`. */
  basePath?: string;
  /** Start route for `memory` mode, or the redirect target for `/`. */
  initialPath?: string;
}

export interface Labels {
  create: string;
  edit: string;
  delete: string;
  save: string;
  cancel: string;
  confirm: string;
  search: string;
  loading: string;
  empty: string;
  back: string;
  details: string;
  actions: string;
  page: string;
  of: string;
  previous: string;
  next: string;
  deleteConfirm: string;
  saved: string;
  deleted: string;
  notFound: string;
  retry: string;
  yes: string;
  no: string;
  logout: string;
  required: string;
}

export interface HRConfig {
  api: ApiConfig;
  /** The tabs/pages of the app, in sidebar order. */
  modules: ModuleInput[];
  routing?: RoutingConfig;
  branding?: {
    title?: string;
    /** Image URL (JSON config) or element (JS config). */
    logo?: string | ReactNode;
    theme?: ThemeConfig;
  };
  user?: UserInfo;
  /** BCP-47 locale used for dates and numbers. Default: browser locale. */
  locale?: string;
  /** Default ISO currency for `currency` columns. Default `USD`. */
  currency?: string;
  labels?: Partial<Labels>;
  /** Shown in the header when provided. */
  onLogout?: () => void;
  /** Extra content on the right side of the header. */
  headerExtra?: ReactNode;
  /** Called on every in-app navigation. */
  onNavigate?: (path: string) => void;
}

export interface ApiClient {
  request<T = unknown>(endpoint: EndpointConfig, options?: RequestOptions): Promise<T>;
  /** Fetch a list and normalise it to `{ items, total }`. */
  list<T = Record<string, any>>(endpoint: EndpointConfig, options?: RequestOptions): Promise<ListResult<T>>;
  /** Build the absolute URL for an endpoint (used for "open in new tab" actions). */
  url(endpoint: EndpointConfig, options?: Pick<RequestOptions, 'vars' | 'query'>): string;
}

export interface RequestOptions {
  vars?: TemplateVars;
  query?: Record<string, unknown>;
  body?: unknown;
  method?: HttpMethod;
  signal?: AbortSignal;
}

export interface ListResult<T> {
  items: T[];
  total?: number;
}

export type IconName =
  | 'dashboard'
  | 'users'
  | 'user'
  | 'building'
  | 'calendar'
  | 'clock'
  | 'file'
  | 'money'
  | 'briefcase'
  | 'settings'
  | 'chart'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'download'
  | 'search'
  | 'chevron-left'
  | 'chevron-right'
  | 'menu'
  | 'check'
  | 'x'
  | 'logout'
  | 'bell'
  | 'star'
  | 'eye'
  | 'award';
