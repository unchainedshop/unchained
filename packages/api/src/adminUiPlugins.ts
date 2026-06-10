import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const PLUGIN_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/i;

const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';

const SDK_FILES = ['ui.mjs', 'form.mjs', 'hooks.mjs', 'providers.mjs', 'modal.mjs'];

const IMPORT_MAP = {
  imports: {
    '@unchainedshop/admin-ui/ui': '/admin-ui-sdk/ui.mjs',
    '@unchainedshop/admin-ui/form': '/admin-ui-sdk/form.mjs',
    '@unchainedshop/admin-ui/hooks': '/admin-ui-sdk/hooks.mjs',
    '@unchainedshop/admin-ui/modal': '/admin-ui-sdk/modal.mjs',
    '@unchainedshop/admin-ui/providers': '/admin-ui-sdk/providers.mjs',
  },
};

export interface AdminUIPluginEntityConfig {
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

export interface AdminUIPluginPageConfig {
  path: string;
  label: string;
  icon?: string;
  requiredRole?: string;
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

export interface AdminUIPluginConfig {
  name: string;
  version?: string;
  bundlePath: string;
  navigation?: {
    label: string;
    icon?: string;
    requiredRole?: string;
  };
  slots: {
    entities?: AdminUIPluginEntityConfig[];
    pages?: AdminUIPluginPageConfig[];
    'dashboard:widgets'?: AdminUIPluginWidgetConfig[];
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

export function preparePluginAssets(
  plugins: AdminUIPluginConfig[],
  log: { info: (...args: any[]) => void; warn: (...args: any[]) => void },
  options: { devMode?: boolean } = {},
): PreparedPluginAssets {
  const { devMode = false } = options;
  const routes = new Map<string, StaticAsset>();

  const validPlugins = plugins.filter((p) => {
    if (!PLUGIN_NAME_RE.test(p.name)) {
      log.warn(`Skipping admin-ui plugin with invalid name: "${p.name}"`);
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

  const contentHash = (content: string) =>
    createHash('sha256').update(content).digest('hex').slice(0, 8);

  const pluginBundles = new Map<string, { content: string; hash: string }>();
  for (const plugin of validPlugins) {
    try {
      const content = readFileSync(resolve(plugin.bundlePath), 'utf-8');
      pluginBundles.set(plugin.name, { content, hash: contentHash(content) });
    } catch (err) {
      log.warn(
        `Failed to read bundle for plugin "${plugin.name}" at ${plugin.bundlePath}: ${(err as Error).message}`,
      );
    }
  }

  const manifestJSON = JSON.stringify(
    validPlugins
      .filter((p) => pluginBundles.has(p.name))
      .map((plugin) => {
        const bundle = pluginBundles.get(plugin.name)!;
        return {
          ...Object.fromEntries(Object.entries(plugin).filter(([k]) => k !== 'bundlePath')),
          bundleUrl: `/admin-plugins/${plugin.name}.js?v=${bundle.hash}`,
        };
      }),
  );

  const devCacheControl = 'no-cache, no-store, must-revalidate';

  const manifestHash = contentHash(manifestJSON);

  routes.set('/admin-ui-plugins.json', {
    content: devMode ? () => manifestJSON : manifestJSON,
    contentType: 'application/json',
    cacheControl: devMode ? devCacheControl : `public, max-age=0, must-revalidate`,
    etag: `"${manifestHash}"`,
  });

  for (const plugin of validPlugins.filter((p) => pluginBundles.has(p.name))) {
    const bundlePath = resolve(plugin.bundlePath);
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

  let importMapTag: string | null = null;

  if (pluginBundles.size > 0) {
    const adminUIPath = resolveAdminUIPath();
    if (adminUIPath) {
      for (const file of SDK_FILES) {
        const sdkPath = join(adminUIPath, '..', 'dist', file);
        if (existsSync(sdkPath)) {
          routes.set(`/admin-ui-sdk/${file}`, {
            content: readFileSync(sdkPath, 'utf-8'),
            contentType: 'application/javascript',
            cacheControl: IMMUTABLE_CACHE,
          });
        }
      }

      const importMapJSON = JSON.stringify(IMPORT_MAP);
      routes.set('/admin-ui-importmap.json', {
        content: importMapJSON,
        contentType: 'application/json',
        cacheControl: IMMUTABLE_CACHE,
      });

      importMapTag = `<script type="importmap">${importMapJSON}</script>`;
    }
  }

  return { routes, validPlugins, importMapTag };
}
