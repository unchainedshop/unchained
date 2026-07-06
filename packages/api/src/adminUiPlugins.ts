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
}

export const resolveAdminUIPath = (): string | null => {
  try {
    const staticURL = import.meta.resolve('@unchainedshop/admin-ui');
    return new URL(staticURL).pathname.split('/').slice(0, -1).join('/');
  } catch {
    return null;
  }
};

const contentHash = (content: string) =>
  createHash('sha256').update(content).digest('hex').slice(0, 8);

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

      // The marker attribute lets the client plugin loader detect that the
      // import map is already present (see admin-ui PluginContext.tsx).
      importMapTag = `<script type="importmap" data-unchained-admin-ui>${importMapJSON}</script>`;
    } else {
      log.warn(
        'admin-ui plugin runtime: SDK dist files not found; plugins depending on shared modules will fail to load',
      );
    }
  }

  return { routes, validPlugins, importMapTag };
}
