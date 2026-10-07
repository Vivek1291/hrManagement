import { createApiClient, extractList, interpolate } from '../src/api/client';

describe('interpolate', () => {
  it('fills placeholders, including dot paths, and encodes them', () => {
    expect(interpolate('/employees/{id}/payslips', { id: 7 })).toBe('/employees/7/payslips');
    expect(interpolate('/users/{user.id}/leaves', { user: { id: 'a b' } })).toBe('/users/a%20b/leaves');
  });
  it('throws when a value is missing instead of calling /undefined', () => {
    expect(() => interpolate('/employees/{id}', {})).toThrow(/Missing value/);
  });
});

describe('extractList', () => {
  it('handles a bare array', () => {
    expect(extractList([1, 2])).toEqual({ items: [1, 2], total: undefined });
  });
  it('auto-detects common envelopes', () => {
    expect(extractList({ data: [1], meta: { total: 9 } })).toEqual({ items: [1], total: 9 });
    expect(extractList({ content: [1, 2], totalElements: 40 })).toEqual({ items: [1, 2], total: 40 });
    expect(extractList({ data: { items: [3] , total: 1 } })).toEqual({ items: [3], total: 1 });
  });
  it('respects explicit paths', () => {
    expect(extractList({ result: { rows: [1] }, count: { all: 5 } }, 'result.rows', 'count.all')).toEqual({ items: [1], total: 5 });
  });
});

describe('createApiClient', () => {
  it('builds urls, sends headers and json body, and applies dataPath', async () => {
    const fetcher = vi.fn(async () => new Response(JSON.stringify({ data: { id: 1 } }), { headers: { 'Content-Type': 'application/json' } }));
    const api = createApiClient({ baseUrl: 'https://x.test/v1/', headers: async () => ({ Authorization: 'Bearer t' }), fetcher, dataPath: 'data' });
    const res = await api.request({ path: '/employees/{id}', method: 'PUT', query: { org: '{org}' } }, { vars: { id: 1, org: 'acme' }, body: { name: 'A' }, query: { x: 1, empty: '' } });
    expect(res).toEqual({ id: 1 });
    const [url, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://x.test/v1/employees/1?org=acme&x=1');
    expect(init.method).toBe('PUT');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer t');
    expect(init.body).toBe('{"name":"A"}');
  });

  it('throws ApiError with the server message and calls onError', async () => {
    const onError = vi.fn();
    const api = createApiClient({
      baseUrl: '',
      onError,
      fetcher: async () => new Response(JSON.stringify({ message: 'Nope' }), { status: 403, headers: { 'Content-Type': 'application/json' } }),
    });
    await expect(api.request('/x')).rejects.toMatchObject({ message: 'Nope', status: 403 });
    expect(onError).toHaveBeenCalledTimes(1);
  });
});
