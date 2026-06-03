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

// ---- Plugin manifest types ----

export interface PluginEntityConfig {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
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

type EntityTabSlot =
  | 'product:tabs'
  | 'assortment:tabs'
  | 'filter:tabs'
  | 'user:tabs'
  | 'order:tabs';

type BuiltinSlot = 'dashboard:widgets' | 'entities' | 'pages' | EntityTabSlot;

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
