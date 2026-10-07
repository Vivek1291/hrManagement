import type React from 'react';
import { preset, presets, type PresetName } from '../modules';
import type { HRConfig, ModuleConfig, ModuleInput, ThemeConfig } from '../types';

/** Resolve `{ preset: 'x', ...overrides }` entries and normalise module paths. */
export function resolveModules(inputs: ModuleInput[]): ModuleConfig[] {
  return inputs.map((input) => {
    let m: ModuleConfig;
    if ('preset' in input && input.preset) {
      const { preset: name, ...rest } = input as ModuleInput & { preset: string };
      if (!(name in presets)) throw new Error(`Unknown HR preset "${name}"`);
      m = preset(name as PresetName, rest);
    } else {
      m = input as ModuleConfig;
    }
    return { ...m, path: '/' + m.path.replace(/^\/+|\/+$/g, '') };
  });
}

/** Merge overrides into a config. Modules are merged by `key` (endpoints key by key). */
export function mergeConfig(base: HRConfig, overrides?: Partial<HRConfig>): HRConfig {
  if (!overrides) return base;
  let modules = base.modules;
  if (overrides.modules) {
    const byKey = new Map(overrides.modules.map((m) => [m.key, m]));
    modules = base.modules.map((m) => {
      const o = m.key ? byKey.get(m.key) : undefined;
      if (!o) return m;
      byKey.delete(m.key);
      return { ...m, ...o, endpoints: { ...m.endpoints, ...o.endpoints } } as ModuleInput;
    });
    modules = [...modules, ...byKey.values()];
  }
  return {
    ...base,
    ...overrides,
    api: { ...base.api, ...overrides.api },
    routing: { ...base.routing, ...overrides.routing },
    branding: { ...base.branding, ...overrides.branding, theme: { ...base.branding?.theme, ...overrides.branding?.theme } },
    labels: { ...base.labels, ...overrides.labels },
    access: { ...base.access, ...overrides.access },
    modules,
  };
}

const THEME_VARS: Record<keyof ThemeConfig, string> = {
  primary: '--hrm-primary',
  primaryContrast: '--hrm-primary-fg',
  background: '--hrm-bg',
  surface: '--hrm-surface',
  text: '--hrm-fg',
  muted: '--hrm-muted',
  border: '--hrm-border',
  sidebar: '--hrm-sidebar',
  sidebarText: '--hrm-sidebar-fg',
  radius: '--hrm-radius',
  font: '--hrm-font',
};

/** Turn `branding.theme` into inline CSS variables. */
export function themeVars(theme: ThemeConfig = {}): React.CSSProperties {
  const style: Record<string, string> = {};
  (Object.keys(theme) as (keyof ThemeConfig)[]).forEach((k) => {
    if (theme[k] && THEME_VARS[k]) style[THEME_VARS[k]] = theme[k]!;
  });
  return style as React.CSSProperties;
}
