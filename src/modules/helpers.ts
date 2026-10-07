import type { EndpointConfig, FieldOption, ModuleConfig, ModulePermissions } from '../types';

/** Identity helper for typing a module definition. */
export function defineModule(module: ModuleConfig): ModuleConfig {
  return module;
}

/**
 * Standard REST endpoints for a resource:
 * `GET base`, `GET base/{id}`, `POST base`, `PUT base/{id}`, `DELETE base/{id}`.
 */
export function crudEndpoints(base: string): Required<NonNullable<ModuleConfig['endpoints']>> {
  return {
    list: base,
    get: `${base}/{id}`,
    create: { path: base, method: 'POST' },
    update: { path: `${base}/{id}`, method: 'PUT' },
    delete: { path: `${base}/{id}`, method: 'DELETE' },
  } satisfies Record<string, EndpointConfig>;
}

/** `crudPermissions('employees')` → `{ view: 'employees.view', create: 'employees.create', ... }`. */
export function crudPermissions(prefix: string): Required<ModulePermissions> {
  return {
    view: `${prefix}.view`,
    create: `${prefix}.create`,
    update: `${prefix}.update`,
    delete: `${prefix}.delete`,
  };
}

/** `options('a', 'b_c')` → `[{ label: 'A', value: 'a' }, { label: 'B c', value: 'b_c' }]`. */
export function options(...values: string[]): FieldOption[] {
  return values.map((value) => {
    const text = value.replace(/[_-]/g, ' ');
    return { label: text.charAt(0).toUpperCase() + text.slice(1), value };
  });
}
