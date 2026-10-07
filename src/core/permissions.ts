import type { UserInfo } from '../types';

export interface AccessRule {
  roles?: string[];
  permission?: string;
}

/** True when the user satisfies both the role list (any of) and the permission (if any). */
export function can(user: UserInfo | undefined, rule: AccessRule = {}): boolean {
  if (rule.roles?.length && !user?.roles?.some((r) => rule.roles!.includes(r))) return false;
  if (rule.permission) {
    const perms = user?.permissions ?? [];
    if (!perms.includes('*') && !perms.includes(rule.permission)) return false;
  }
  return true;
}

/** HTTP status of an API error, if it is one. */
export function errorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : undefined;
}

export function isAuthError(error: unknown): error is Error & { status: 401 | 403 } {
  const s = errorStatus(error);
  return s === 401 || s === 403;
}
