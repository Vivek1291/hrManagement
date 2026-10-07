export { HRManagement } from './HRManagement';
export type { HRManagementProps } from './HRManagement';
export { mergeConfig, resolveModules } from './core/config';
export {
  presets,
  preset,
  allModules,
  defineModule,
  crudEndpoints,
  crudPermissions,
  options,
} from './modules';
export type { PresetName } from './modules';
export { createApiClient, ApiError, getByPath, interpolate, extractList } from './core/client';
export { useHR, DEFAULT_LABELS } from './core/context';
export { can } from './core/permissions';
export { useRouter, Link } from './core/router';
export { DataTable } from './ui/DataTable';
export { ResourceForm } from './ui/Form';
export { AccessDenied } from './ui/Feedback';
export { Button, Badge } from './ui/Button';
export { Page, PageHeader } from './ui/Page';
export { Icon } from './ui/Icon';
export * from './types';

import type { HRConfig } from './types';
/** Identity helper that gives you autocompletion when writing a config. */
export function defineHRConfig(config: HRConfig): HRConfig {
  return config;
}
