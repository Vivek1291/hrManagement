import { getByPath } from '../api/client';
import { useAsync, useHR } from '../context';
import type { ModuleConfig } from '../types';

/** Load one record: via `endpoints.get`, or by finding it in the list response as a fallback. */
export function useRecord(module: ModuleConfig, id: string) {
  const { api, baseVars } = useHR();
  const primaryKey = module.primaryKey ?? 'id';
  const endpoints = module.endpoints ?? {};

  return useAsync<Record<string, any>>(async (signal) => {
    const vars = { ...baseVars, id, [primaryKey]: id };
    if (endpoints.get) {
      return api.request<Record<string, any>>(endpoints.get, { vars, signal });
    }
    if (endpoints.list) {
      const { items } = await api.list<Record<string, any>>(endpoints.list, { vars, signal });
      const found = items.find((r) => String(getByPath(r, primaryKey)) === id);
      if (found) return found;
    }
    throw new Error(`Record "${id}" not found`);
  }, [module.key, id]);
}
