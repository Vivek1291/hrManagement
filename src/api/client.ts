import type {
  ApiClient,
  ApiConfig,
  ApiErrorLike,
  EndpointConfig,
  EndpointObject,
  HttpMethod,
  ListResult,
  RequestOptions,
  TemplateVars,
} from '../types';

export class ApiError extends Error implements ApiErrorLike {
  status: number;
  body: unknown;
  url: string;

  constructor(message: string, status: number, body: unknown, url: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

/** Read a value by dot path: `getByPath({ a: { b: 1 } }, 'a.b') === 1`. */
export function getByPath(obj: unknown, path?: string): any {
  if (!path) return obj;
  return path.split('.').reduce<any>((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/** Immutably set a value by dot path. */
export function setByPath<T extends Record<string, any>>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const copy: any = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = copy;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = cursor[key] && typeof cursor[key] === 'object' ? { ...cursor[key] } : {};
      cursor = cursor[key];
    }
  });
  return copy;
}

/** Replace `{name}` / `{a.b}` placeholders. Missing values throw so we never hit `/employees/undefined`. */
export function interpolate(template: string, vars: TemplateVars = {}, encode = true): string {
  return template.replace(/\{([\w.$-]+)\}/g, (_, key: string) => {
    const value = getByPath(vars, key);
    if (value === undefined || value === null) {
      throw new Error(`Missing value for "{${key}}" in "${template}"`);
    }
    return encode ? encodeURIComponent(String(value)) : String(value);
  });
}

export function normalizeEndpoint(endpoint: EndpointConfig): EndpointObject {
  return typeof endpoint === 'string' ? { path: endpoint } : endpoint;
}

function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (!baseUrl) return path;
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function appendQuery(url: string, query: Record<string, unknown>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, String(v)));
    else params.append(key, String(value));
  });
  const qs = params.toString();
  if (!qs) return url;
  return url + (url.includes('?') ? '&' : '?') + qs;
}

function containsFile(body: unknown): boolean {
  if (typeof File === 'undefined' || !body || typeof body !== 'object') return false;
  return Object.values(body as Record<string, unknown>).some(
    (v) => v instanceof File || (typeof Blob !== 'undefined' && v instanceof Blob),
  );
}

function toFormData(body: Record<string, unknown>): FormData {
  const fd = new FormData();
  Object.entries(body).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value instanceof Blob) fd.append(key, value);
    else if (typeof value === 'object') fd.append(key, JSON.stringify(value));
    else fd.append(key, String(value));
  });
  return fd;
}

const LIST_KEYS = ['data', 'items', 'results', 'content', 'records', 'rows', 'list'];
const TOTAL_KEYS = ['total', 'totalCount', 'total_count', 'count', 'totalElements', 'totalItems', 'meta.total', 'pagination.total', 'meta.pagination.total'];

/** Find the array and total count in a list response, whatever shape the backend uses. */
export function extractList<T>(raw: unknown, dataPath?: string, totalPath?: string): ListResult<T> {
  let items: unknown = dataPath ? getByPath(raw, dataPath) : raw;
  if (!dataPath && !Array.isArray(items) && items && typeof items === 'object') {
    for (const key of LIST_KEYS) {
      const candidate = getByPath(items, key);
      if (Array.isArray(candidate)) {
        items = candidate;
        break;
      }
      // e.g. { data: { items: [...] } }
      if (candidate && typeof candidate === 'object') {
        const nested = LIST_KEYS.map((k) => (candidate as any)[k]).find(Array.isArray);
        if (nested) {
          items = nested;
          break;
        }
      }
    }
  }
  if (!Array.isArray(items)) items = [];

  let total: number | undefined;
  if (totalPath) {
    const t = Number(getByPath(raw, totalPath));
    total = Number.isFinite(t) ? t : undefined;
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const key of TOTAL_KEYS) {
      const t = getByPath(raw, key) ?? getByPath((raw as any).data, key);
      if (typeof t === 'number' || (typeof t === 'string' && t !== '' && !isNaN(Number(t)))) {
        total = Number(t);
        break;
      }
    }
  }
  return { items: items as T[], total };
}

async function readBody(res: Response, responseType?: EndpointObject['responseType']): Promise<unknown> {
  if (responseType === 'blob') return res.blob();
  if (responseType === 'text') return res.text();
  if (res.status === 204) return null;
  const type = res.headers.get('content-type') || '';
  if (responseType === 'json' || type.includes('json')) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return res.text();
}

function errorMessage(body: unknown, res: Response): string {
  if (body && typeof body === 'object') {
    const b = body as Record<string, any>;
    const msg = b.message ?? b.error?.message ?? b.error ?? b.detail ?? b.title;
    if (typeof msg === 'string') return msg;
  }
  if (typeof body === 'string' && body && body.length < 300) return body;
  return `Request failed with status ${res.status}${res.statusText ? ` (${res.statusText})` : ''}`;
}

export function createApiClient(config: ApiConfig): ApiClient {
  const doFetch = config.fetcher ?? ((url: string, init: RequestInit) => fetch(url, init));

  const url: ApiClient['url'] = (endpoint, options = {}) => {
    const ep = normalizeEndpoint(endpoint);
    const vars = options.vars ?? {};
    const path = interpolate(ep.path, vars);
    const staticQuery: Record<string, unknown> = {};
    Object.entries(ep.query ?? {}).forEach(([k, v]) => {
      staticQuery[k] = typeof v === 'string' ? interpolate(v, vars, false) : v;
    });
    return appendQuery(joinUrl(config.baseUrl, path), { ...staticQuery, ...(options.query ?? {}) });
  };

  async function raw(endpoint: EndpointConfig, options: RequestOptions = {}): Promise<unknown> {
    const ep = normalizeEndpoint(endpoint);
    const vars = options.vars ?? {};
    const method: HttpMethod = ep.method ?? options.method ?? 'GET';
    const fullUrl = url(ep, options);

    const baseHeaders =
      typeof config.headers === 'function' ? await config.headers() : config.headers ?? {};
    const headers: Record<string, string> = { Accept: 'application/json', ...baseHeaders, ...(ep.headers ?? {}) };

    let body: BodyInit | undefined;
    if (options.body !== undefined && method !== 'GET') {
      const payload = ep.transformRequest ? ep.transformRequest(options.body, vars) : options.body;
      if (payload instanceof FormData) {
        body = payload;
      } else if (containsFile(payload)) {
        body = toFormData(payload as Record<string, unknown>);
      } else {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
        body = JSON.stringify(payload);
      }
    }

    const res = await doFetch(fullUrl, {
      method,
      headers,
      body,
      credentials: config.credentials,
      signal: options.signal,
    });

    const data = await readBody(res, res.ok ? ep.responseType : undefined).catch(() => null);
    if (!res.ok) {
      const error = new ApiError(errorMessage(data, res), res.status, data, fullUrl);
      config.onError?.(error);
      throw error;
    }
    return ep.transformResponse ? ep.transformResponse(data, vars) : data;
  }

  return {
    url,
    async request<T>(endpoint: EndpointConfig, options?: RequestOptions) {
      const ep = normalizeEndpoint(endpoint);
      const data = await raw(ep, options);
      const dataPath = ep.dataPath ?? config.dataPath;
      if (dataPath) return getByPath(data, dataPath) as T;
      return data as T;
    },
    async list<T>(endpoint: EndpointConfig, options?: RequestOptions) {
      const ep = normalizeEndpoint(endpoint);
      const data = await raw(ep, { ...options, method: options?.method ?? 'GET' });
      return extractList<T>(data, ep.dataPath ?? config.dataPath, ep.totalPath ?? config.totalPath);
    },
  };
}
