export interface EntityTabProps {
  entity: any;
  entityId: string;
}

export interface EntityDetailProps {
  entityId: string;
}

export type EntityCreateProps = Record<string, never>;

export type EntityListProps = Record<string, never>;

export type PageProps = Record<string, never>;

export type DashboardWidgetProps = Record<string, never>;

export interface PluginRuntimeContext {
  pluginName: string;
  version?: string;
  slotId: string;
  config: Record<string, any>;
}

// Keep in sync with packages/api/src/adminUiPlugins.ts AdminUIPluginConfig

export interface PluginEntityConfig {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
  sortOrder?: number;
  components: {
    list: string;
    detail: string;
    create?: string;
  };
}

export interface PluginPageConfig {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
  sortOrder?: number;
  component: string;
}

export interface PluginTabConfig {
  label: string;
  component: string;
  requiredRole?: string;
}

export interface PluginWidgetConfig {
  component: string;
  width?: 'full' | 'half' | 'third';
}

export interface PluginSlots {
  entities?: PluginEntityConfig[];
  pages?: PluginPageConfig[];
  'dashboard:widgets'?: PluginWidgetConfig[];
  'product:tabs'?: PluginTabConfig[];
  'assortment:tabs'?: PluginTabConfig[];
  'filter:tabs'?: PluginTabConfig[];
  'user:tabs'?: PluginTabConfig[];
  'order:tabs'?: PluginTabConfig[];
  [key: string]:
    | PluginEntityConfig[]
    | PluginPageConfig[]
    | PluginWidgetConfig[]
    | PluginTabConfig[]
    | undefined;
}

export interface PluginNavigationGroup {
  label: string;
  icon?: string;
  requiredRole?: string;
  sortOrder?: number;
}

export interface PluginConfig {
  name: string;
  version?: string;
  bundlePath: string;
  /** Optional: group all plugin nav items under a collapsible sidebar section */
  navigation?: PluginNavigationGroup;
  slots: PluginSlots;
}

export function definePlugin(config: PluginConfig): PluginConfig {
  return config;
}

/**
 * The browser import map replaces this SDK placeholder with the host hook.
 * Calling it outside a plugin component is unsupported.
 */
export function usePluginRuntime(): PluginRuntimeContext {
  throw new Error(
    'usePluginRuntime is only available inside an admin-ui plugin component at runtime',
  );
}
