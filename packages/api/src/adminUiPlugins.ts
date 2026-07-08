import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { SHARED_DEP_SHIMS, SDK_MODULE_FILES } from '@unchainedshop/admin-ui/plugin-runtime';

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
  importMapTag: string | null;
  importMapJSON: string | null;
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
 * Enumerate the prebuilt ESM files of the admin-ui SDK (entries plus their
 * code-split chunks). Only files discovered here are ever served, so request
 * paths never touch the filesystem.
 */
const listSDKDistFiles = (distPath: string): string[] => {
  try {
    if (!statSync(distPath).isDirectory()) return [];
    return readdirSync(distPath, { recursive: true })
      .map((file) => String(file).split(sep).join('/'))
      .filter((file) => file.endsWith('.js'));
  } catch {
    return [];
  }
};

/**
 * Extract the export names of an ESM plugin bundle built by
 * @unchainedshop/admin-ui/plugin-build. esbuild consolidates the entry's
 * exports into `export { local as Name, ... }` statements (plus optional
 * `export default` / exported declarations). Returns null when no export
 * statements are found (custom or minified bundle) so validation is skipped
 * rather than producing false warnings.
 */
export const parseEsmBundleExports = (bundle: string): Set<string> | null => {
  const names = new Set<string>();
  // `export { a as B, C }` — the exported name is the alias when present.
  for (const clause of bundle.matchAll(/(?:^|[;\n])\s*export\s*\{([^}]*)\}/g)) {
    for (const entry of clause[1].split(',')) {
      const parts = entry.trim().split(/\s+as\s+/);
      const exported = (parts[1] ?? parts[0]).trim().replace(/^["']|["']$/g, '');
      if (exported) names.add(exported);
    }
  }
  // `export default ...` and `export const/function/class X`
  if (/(?:^|[;\n])\s*export\s+default\b/.test(bundle)) names.add('default');
  for (const decl of bundle.matchAll(
    /(?:^|[;\n])\s*export\s+(?:async\s+)?(?:const|let|var|function|class)\s+([\w$]+)/g,
  )) {
    names.add(decl[1]);
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

/**
 * SDK version stamped into the bundle banner by plugin-build.mjs, e.g.
 * `/* unchained admin-ui plugin: "name" (esm, sdk 5.0.0) *\/`. Returns null
 * for bundles built before the version stamp existed.
 */
const parseBundleSdkVersion = (bundle: string): string | null => {
  const match = bundle.match(/^\/\* unchained admin-ui plugin: .+? \(esm, sdk ([^)]+)\) \*\//);
  return match?.[1] ?? null;
};

const readHostSdkVersion = (): string | null => {
  const adminUIPath = resolveAdminUIPath();
  if (!adminUIPath) return null;
  try {
    const pkg = JSON.parse(readFileSync(join(adminUIPath, '..', 'package.json'), 'utf-8'));
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
};

export function preparePluginAssets(
  plugins: AdminUIPluginConfig[],
  log: { info: (...args: any[]) => void; warn: (...args: any[]) => void },
  options: { devMode?: boolean } = {},
): PreparedPluginAssets {
  const { devMode = false } = options;
  const routes = new Map<string, StaticAsset>();
  const devCacheControl = 'no-cache, no-store, must-revalidate';

  const namedPlugins = plugins.filter((p) => {
    if (!PLUGIN_NAME_RE.test(p.name)) {
      log.warn(`Skipping admin-ui plugin with invalid name: "${p.name}"`);
      return false;
    }
    return true;
  });

  // Duplicate names collide on the same manifest entry and bundle route;
  // keep only the last occurrence so the manifest matches what is served.
  const validPlugins = namedPlugins.filter((plugin, index) => {
    const lastIndex = namedPlugins.findLastIndex((p) => p.name === plugin.name);
    if (index !== lastIndex) {
      log.warn(`Duplicate admin-ui plugin name "${plugin.name}": later entries override earlier ones`);
      return false;
    }
    return true;
  });

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
  // export — otherwise the first signal is a runtime "Component not found"
  // in the browser. Also surface SDK version skew between the environment
  // a plugin was built against and the admin-ui actually running.
  const hostSdkVersion = pluginsWithBundles.length > 0 ? readHostSdkVersion() : null;
  for (const plugin of pluginsWithBundles) {
    const bundle = pluginBundles.get(plugin.name)!.content;

    const exportNames = parseEsmBundleExports(bundle);
    if (exportNames) {
      const missing = collectReferencedComponents(plugin).filter((name) => !exportNames.has(name));
      if (missing.length > 0) {
        log.warn(
          `admin-ui plugin "${plugin.name}" references component(s) not exported by its bundle: ${missing.join(', ')}. Exported: ${[...exportNames].join(', ')}`,
        );
      }
    }

    const bundleSdkVersion = parseBundleSdkVersion(bundle);
    if (hostSdkVersion && bundleSdkVersion && bundleSdkVersion !== hostSdkVersion) {
      log.warn(
        `admin-ui plugin "${plugin.name}" was built against SDK ${bundleSdkVersion} but the running admin-ui is ${hostSdkVersion}. It may still work, but rebuild it against the current @unchainedshop/admin-ui to be safe.`,
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
        contentType: 'text/javascript',
        cacheControl: devCacheControl,
      });
    } else {
      const { content } = pluginBundles.get(plugin.name)!;
      routes.set(`/admin-plugins/${plugin.name}.js`, {
        content,
        contentType: 'text/javascript',
        cacheControl: IMMUTABLE_CACHE,
      });
    }
  }

  let importMapTag: string | null = null;
  let importMapContent: string | null = null;

  if (pluginBundles.size > 0) {
    const adminUIPath = resolveAdminUIPath();
    const distPath = adminUIPath ? join(adminUIPath, '..', 'dist') : null;
    const sdkFiles = distPath ? listSDKDistFiles(distPath) : [];

    if (distPath && sdkFiles.length > 0) {
      // Serve every prebuilt SDK file. Entry URLs get a content-hash query
      // for cache busting; chunk filenames are content-hashed by the bundler
      // itself, so immutable caching is safe throughout.
      const sdkFileHashes = new Map<string, string>();
      for (const file of sdkFiles) {
        const filePath = join(distPath, file);
        if (devMode) {
          routes.set(`/admin-ui-sdk/${file}`, {
            content: () => readFileSync(filePath, 'utf-8'),
            contentType: 'text/javascript',
            cacheControl: devCacheControl,
          });
        } else {
          const content = readFileSync(filePath, 'utf-8');
          sdkFileHashes.set(file, contentHash(content));
          routes.set(`/admin-ui-sdk/${file}`, {
            content,
            contentType: 'text/javascript',
            cacheControl: IMMUTABLE_CACHE,
          });
        }
      }

      const imports: Record<string, string> = {};
      for (const [specifier, file] of [
        ...Object.entries(SDK_MODULE_FILES),
        ...Object.entries(SHARED_DEP_SHIMS),
      ]) {
        if (!sdkFiles.includes(file)) {
          log.warn(
            `admin-ui plugin runtime: expected SDK file "${file}" for "${specifier}" not found in ${distPath}`,
          );
          continue;
        }
        const version = sdkFileHashes.get(file);
        imports[specifier] = `/admin-ui-sdk/${file}${version ? `?v=${version}` : ''}`;
      }

      const importMapJSON = JSON.stringify({ imports });
      const importMapHash = contentHash(importMapJSON);
      routes.set('/admin-ui-importmap.json', {
        content: importMapJSON,
        contentType: 'application/json',
        cacheControl: devMode ? devCacheControl : 'public, max-age=0, must-revalidate',
        etag: `"${importMapHash}"`,
      });

      importMapContent = importMapJSON;
      importMapTag = `<script type="importmap" data-unchained-admin-ui>${importMapJSON}</script>`;
    } else {
      log.warn(
        'admin-ui plugin runtime: SDK dist files not found; plugins depending on shared modules will fail to load',
      );
    }
  }

  return { routes, validPlugins, importMapTag, importMapJSON: importMapContent };
}

export function buildImportMapTag(importMapJSON: string, nonce?: string): string {
  const nonceAttr = nonce ? ` nonce="${nonce}"` : '';
  return `<script type="importmap" data-unchained-admin-ui${nonceAttr}>${importMapJSON}</script>`;
}
