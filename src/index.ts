export { HRManagement, mergeConfig, resolveModules } from './HRManagement';
export type { HRManagementProps } from './HRManagement';
export { presets, preset } from './presets';
export type { PresetName } from './presets';
export { createApiClient, ApiError, getByPath, interpolate, extractList } from './api/client';
export { useHR, DEFAULT_LABELS } from './context';
export { useRouter, Link } from './router/Router';
export { DataTable } from './components/DataTable';
export { ResourceForm } from './components/Form';
export { Icon } from './components/Icon';
export * from './types';

import type { HRConfig } from './types';
/** Identity helper that gives you autocompletion when writing a config. */
export function defineHRConfig(config: HRConfig): HRConfig {
  return config;
}
