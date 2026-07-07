import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const PLUGIN_NAME_RE = /^[a-z0-9]([a-z0-9_-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9_-]*[a-z0-9])?)*$/i;

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

export interface AdminUIPluginEntityConfig {
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

export interface AdminUIPluginPageConfig {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
  sortOrder?: number;
  component: string;
}

export interface AdminUIPluginTabConfig {
  label: string;
  component: string;
  requiredRole?: string;
}

export interface AdminUIPluginWidgetConfig {
  component: string;
  width?: 'full' | 'half' | 'third';
}

export interface AdminUIPluginSlotConfig {
  component: string;
}

// Keep in sync with admin-ui/src/sdk/plugins.ts PluginConfig
export interface AdminUIPluginConfig {
  name: string;
  version?: string;
  bundlePath: string;
  navigation?: {
    label: string;
    icon?: string;
    requiredRole?: string;
    sortOrder?: number;
  };
  slots: {
    entities?: AdminUIPluginEntityConfig[];
    pages?: AdminUIPluginPageConfig[];
    'dashboard:widgets'?: AdminUIPluginWidgetConfig[];
    'product:tabs'?: AdminUIPluginTabConfig[];
    'assortment:tabs'?: AdminUIPluginTabConfig[];
    'filter:tabs'?: AdminUIPluginTabConfig[];
    'user:tabs'?: AdminUIPluginTabConfig[];
    'order:tabs'?: AdminUIPluginTabConfig[];
    [key: string]:
      | AdminUIPluginTabConfig[]
      | AdminUIPluginSlotConfig[]
      | AdminUIPluginEntityConfig[]
      | AdminUIPluginPageConfig[]
      | AdminUIPluginWidgetConfig[]
      | undefined;
  };
}

interface StaticAsset {
  content: string | (() => string);
  contentType: string;
  cacheControl: string;
  etag?: string;
}

export interface PreparedPluginAssets {
  routes: Map<string, StaticAsset>;
  validPlugins: AdminUIPluginConfig[];
}

export const resolveAdminUIPath = (): string | null => {
  try {
    const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
    return new URL(staticURL).pathname.split('/').slice(0, -1).join('/');
  } catch {
    return null;
  }
};

const contentHash = (content: string) => createHash('sha256').update(content).digest('hex').slice(0, 8);

/**
 * Extract the entry export names from an IIFE plugin bundle built by
 * @unchainedshop/admin-ui/plugin-build. tsup/esbuild registers the entry's
 * exports as `__export(<var>, { Name: () => ..., ... })` and the IIFE returns
 * that same object via `return __toCommonJS(<var>);`. Returns null when the
 * bundle doesn't match this shape (custom build, minified) so validation is
 * skipped rather than producing false warnings.
 */
export const parseBundleExports = (bundle: string): Set<string> | null => {
  const returnMatch = bundle.match(/return __toCommonJS\(([\w$]+)\);/);
  if (!returnMatch) return null;
  const blockMatch = bundle.match(
    new RegExp(`__export\\(${returnMatch[1].replace(/\$/g, '\\$')},\\s*\\{([\\s\\S]*?)\\}\\);`),
  );
  if (!blockMatch) return null;
  const names = new Set<string>();
  for (const m of blockMatch[1].matchAll(/(?:^|,)\s*(?:"([^"]+)"|([\w$]+)):\s*\(\)\s*=>/g)) {
    names.add(m[1] ?? m[2]);
  }
  return names.size > 0 ? names : null;
};

/** All component names a plugin's slot configuration references. */
const collectReferencedComponents = (plugin: AdminUIPluginConfig): string[] => {
  const names = new Set<string>();
  for (const [slotId, configs] of Object.entries(plugin.slots || {})) {
    if (!Array.isArray(configs)) continue;
    for (const config of configs) {
      if (slotId === 'entities') {
        const components = (config as AdminUIPluginEntityConfig).components;
        if (components?.list) names.add(components.list);
        if (components?.detail) names.add(components.detail);
        if (components?.create) names.add(components.create);
      } else if (typeof (config as { component?: unknown }).component === 'string') {
        names.add((config as { component: string }).component);
      }
    }
  }
  return [...names];
};

export function preparePluginAssets(
  plugins: AdminUIPluginConfig[],
  log: { info: (...args: any[]) => void; warn: (...args: any[]) => void },
  options: { devMode?: boolean } = {},
): PreparedPluginAssets {
  const { devMode = false } = options;
  const routes = new Map<string, StaticAsset>();
  const devCacheControl = 'no-cache, no-store, must-revalidate';

  const validPlugins = plugins.filter((p) => {
    if (!PLUGIN_NAME_RE.test(p.name)) {
      log.warn(`Skipping admin-ui plugin with invalid name: "${p.name}"`);
      return false;
    }
    return true;
  });

  const seenNames = new Set<string>();
  for (const plugin of validPlugins) {
    if (seenNames.has(plugin.name)) {
      log.warn(`Duplicate admin-ui plugin name "${plugin.name}": later entries override earlier ones`);
    }
    seenNames.add(plugin.name);
  }

  if (validPlugins.length > 0) {
    const pluginList = validPlugins
      .map((p) => `${p.name}${p.version ? `@${p.version}` : ''}`)
      .join(', ');
    log.info(`Loading ${validPlugins.length} admin-ui plugin(s): ${pluginList}`);
  }

  const resolvedBundlePaths = new Map<string, string>();
  const pluginBundles = new Map<string, { content: string; hash: string }>();
  for (const plugin of validPlugins) {
    try {
      const bundlePath = resolve(plugin.bundlePath);
      const content = readFileSync(bundlePath, 'utf-8');
      resolvedBundlePaths.set(plugin.name, bundlePath);
      pluginBundles.set(plugin.name, { content, hash: contentHash(content) });
    } catch (err) {
      log.warn(
        `Failed to read bundle for plugin "${plugin.name}" at ${plugin.bundlePath}: ${(err as Error).message}`,
      );
    }
  }

  const pluginsWithBundles = validPlugins.filter((p) => pluginBundles.has(p.name));

  // Warn early when the config references components the bundle doesn't
  // export — otherwise the first signal is a runtime "Component not found".
  for (const plugin of pluginsWithBundles) {
    const exportNames = parseBundleExports(pluginBundles.get(plugin.name)!.content);
    if (!exportNames) continue;
    const missing = collectReferencedComponents(plugin).filter((name) => !exportNames.has(name));
    if (missing.length > 0) {
      log.warn(
        `admin-ui plugin "${plugin.name}" references component(s) not exported by its bundle: ${missing.join(', ')}. Exported: ${[...exportNames].join(', ')}`,
      );
    }
  }

  // In dev mode, use mtime-based cache invalidation to avoid re-reading every
  // bundle file on every manifest request. Only re-hash when a file changes.
  const bundleMtimes = new Map<string, number>();
  const bundleHashes = new Map<string, string>();
  for (const [name, bundle] of pluginBundles) {
    bundleHashes.set(name, bundle.hash);
    try {
      bundleMtimes.set(name, statSync(resolvedBundlePaths.get(name)!).mtimeMs);
    } catch {
      /* use initial hash */
    }
  }

  const refreshBundleHash = (name: string): string => {
    const bundlePath = resolvedBundlePaths.get(name)!;
    try {
      const currentMtime = statSync(bundlePath).mtimeMs;
      const cachedMtime = bundleMtimes.get(name);
      if (cachedMtime !== undefined && cachedMtime === currentMtime) {
        return bundleHashes.get(name)!;
      }
      const hash = contentHash(readFileSync(bundlePath, 'utf-8'));
      bundleMtimes.set(name, currentMtime);
      bundleHashes.set(name, hash);
      return hash;
    } catch {
      return bundleHashes.get(name) ?? pluginBundles.get(name)!.hash;
    }
  };

  const buildManifestJSON = () =>
    JSON.stringify(
      pluginsWithBundles.map((plugin) => ({
        ...Object.fromEntries(Object.entries(plugin).filter(([k]) => k !== 'bundlePath')),
        bundleUrl: `/admin-plugins/${plugin.name}.js?v=${devMode ? refreshBundleHash(plugin.name) : pluginBundles.get(plugin.name)!.hash}`,
      })),
    );

  if (devMode) {
    routes.set('/admin-ui-plugins.json', {
      content: buildManifestJSON,
      contentType: 'application/json',
      cacheControl: devCacheControl,
    });
  } else {
    const manifestJSON = buildManifestJSON();
    routes.set('/admin-ui-plugins.json', {
      content: manifestJSON,
      contentType: 'application/json',
      cacheControl: 'public, max-age=0, must-revalidate',
      etag: `"${contentHash(manifestJSON)}"`,
    });
  }

  for (const plugin of pluginsWithBundles) {
    const bundlePath = resolvedBundlePaths.get(plugin.name)!;
    if (devMode) {
      routes.set(`/admin-plugins/${plugin.name}.js`, {
        content: () => readFileSync(bundlePath, 'utf-8'),
        contentType: 'application/javascript',
        cacheControl: devCacheControl,
      });
    } else {
      const { content } = pluginBundles.get(plugin.name)!;
      routes.set(`/admin-plugins/${plugin.name}.js`, {
        content,
        contentType: 'application/javascript',
        cacheControl: IMMUTABLE_CACHE,
      });
    }
  }

  return { routes, validPlugins };
}
