import type { ModuleConfig } from '../types';
import { announcements } from './announcements';
import { assets } from './assets';
import { attendance } from './attendance';
import { dashboard } from './dashboard';
import { departments } from './departments';
import { designations } from './designations';
import { documents } from './documents';
import { employees } from './employees';
import { expenses } from './expenses';
import { holidays } from './holidays';
import { leaves } from './leaves';
import { leaveTypes } from './leaveTypes';
import { payroll } from './payroll';
import { payslips } from './payslips';
import { performance } from './performance';
import { candidates, recruitment } from './recruitment';
import { shifts } from './shifts';

export { crudEndpoints, crudPermissions, defineModule, options } from './helpers';

/**
 * Built-in HR modules, in default sidebar order. Use them as-is, override any part with
 * `preset(name, overrides)`, or reference them from JSON with `{ "preset": "holidays" }`.
 */
export const presets = {
  dashboard,
  employees,
  documents,
  departments,
  designations,
  assets,
  announcements,
  attendance,
  shifts,
  leaves,
  leaveTypes,
  holidays,
  payroll,
  payslips,
  expenses,
  recruitment,
  candidates,
  performance,
} satisfies Record<string, ModuleConfig>;

export type PresetName = keyof typeof presets;

/** Merge a preset with your overrides. `endpoints` are merged key by key; arrays are replaced. */
export function preset(name: PresetName, overrides: Partial<ModuleConfig> = {}): ModuleConfig {
  const base = presets[name] as ModuleConfig | undefined;
  if (!base) throw new Error(`Unknown HR preset "${name}"`);
  return {
    ...base,
    ...overrides,
    endpoints: { ...base.endpoints, ...overrides.endpoints },
  };
}

/** Every built-in module (or only the named ones), ready to drop into `config.modules`. */
export function allModules(names: PresetName[] = Object.keys(presets) as PresetName[]): ModuleConfig[] {
  return names.map((n) => preset(n));
}
