import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ApiClient, HRConfig, Labels, TemplateVars } from './types';

export const DEFAULT_LABELS: Labels = {
  create: 'Add new',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  confirm: 'Confirm',
  search: 'Search…',
  loading: 'Loading…',
  empty: 'No records found',
  back: 'Back',
  details: 'Details',
  actions: 'Actions',
  page: 'Page',
  of: 'of',
  previous: 'Previous',
  next: 'Next',
  deleteConfirm: 'Are you sure you want to delete this record?',
  saved: 'Saved successfully',
  deleted: 'Deleted successfully',
  notFound: 'Page not found',
  retry: 'Retry',
  yes: 'Yes',
  no: 'No',
  logout: 'Log out',
  required: 'This field is required',
};

export type ToastKind = 'success' | 'error' | 'info';

export interface HRContextValue {
  config: HRConfig;
  api: ApiClient;
  labels: Labels;
  locale?: string;
  currency: string;
  /** Base template vars available to every endpoint (`{user.id}` etc). */
  baseVars: TemplateVars;
  toast: (message: string, kind?: ToastKind) => void;
  confirm: (message: string) => Promise<boolean>;
}

const HRContext = createContext<HRContextValue | null>(null);

export const HRContextProvider = HRContext.Provider;

export function useHR(): HRContextValue {
  const ctx = useContext(HRContext);
  if (!ctx) throw new Error('useHR must be used inside <HRManagement>');
  return ctx;
}

export interface AsyncState<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => void;
}

/** Run an async loader whenever `deps` change; ignores stale responses. */
export function useAsync<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [state, setState] = useState<{ data?: T; error?: Error; loading: boolean }>({ loading: true });
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: undefined }));
    loaderRef
      .current(controller.signal)
      .then((data) => !controller.signal.aborted && setState({ data, loading: false }))
      .catch((error) => {
        if (controller.signal.aborted) return;
        setState({ error: error instanceof Error ? error : new Error(String(error)), loading: false });
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: state.data, error: state.error, loading: state.loading, reload };
}
