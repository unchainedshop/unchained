import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';
import { PLUGIN_EXTERNALS } from './plugin-runtime.mjs';

// Version of the admin-ui SDK this plugin is built against, stamped into the
// bundle banner so the engine can warn about plugin/host version skew.
const SDK_VERSION = (() => {
  try {
    return JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')).version;
  } catch {
    return null;
  }
})();

/**
 * Build configuration for admin-ui plugins.
 *
 * Plugins are compiled to a single standard ESM bundle. Dependencies provided
 * by the host admin-ui (react, @apollo/client, @unchainedshop/admin-ui/*, ...)
 * are left as bare import specifiers; at runtime the admin-ui resolves them
 * through a browser import map to the host's own module instances, so plugins
 * share one React/Apollo instance with the app. Everything else (plugin-local
 * dependencies) is bundled in.
 *
 * The bundle is loaded by the admin-ui with a native dynamic import(); its
 * module exports are the components referenced from the plugin manifest.
 */
export function definePluginConfig(pluginName, entry = 'src/index.tsx') {
  return defineConfig({
    entry: { index: entry },
    format: ['esm'],
    platform: 'browser',
    target: 'es2022',
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: true,
    banner: {
      js: `/* unchained admin-ui plugin: ${JSON.stringify(pluginName)} (esm${SDK_VERSION ? `, sdk ${SDK_VERSION}` : ''}) */`,
    },
    esbuildPlugins: [handleExternals(PLUGIN_EXTERNALS)],
  });
}

const SHIM_NS = 'unchained-cjs-esm-bridge';

/**
 * Unified esbuild plugin that handles shared dependencies declared as external.
 *
 * ESM imports (kind "import-statement") are marked external so the bare
 * specifier is preserved in the output for the browser import map.
 *
 * CJS require() calls (kind "require-call") from bundled CJS dependencies
 * (e.g. @unchainedshop/client) are redirected to virtual ESM re-export modules.
 * Without this, esbuild wraps them as __require() which throws in the browser.
 *
 * This plugin replaces both tsup's built-in `external` option (which cannot
 * distinguish import kinds) and the previous rewriteCjsExternals plugin.
 */
function handleExternals(externals) {
  const isExternal = (id) =>
    externals.some((ext) =>
      ext instanceof RegExp ? ext.test(id) : ext === id,
    );

  return {
    name: 'unchained-handle-externals',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        if (!isExternal(args.path)) return undefined;

        if (args.kind === 'require-call' || args.kind === 'require-resolve') {
          return { path: args.path, namespace: SHIM_NS };
        }

        return { path: args.path, external: true };
      });

      build.onLoad({ filter: /.*/, namespace: SHIM_NS }, (args) => {
        const spec = JSON.stringify(args.path);
        return {
          contents: [
            `import * as _ns from ${spec};`,
            `export default _ns.default;`,
            `export * from ${spec};`,
          ].join('\n'),
          loader: 'js',
          resolveDir: '.',
        };
      });
    },
  };
}