/**
 * Single source of truth for the admin-ui plugin runtime module graph.
 *
 * Plugins are built as pure ESM bundles (see plugin-build.mjs) with shared
 * dependencies left as bare import specifiers. At runtime the browser resolves
 * those specifiers through an import map:
 *
 * - Host-owned dependencies (react, @apollo/client, ...) map to tiny shim
 *   modules (built from src/sdk/shims/) that re-export the running admin-ui
 *   app's instances via window.__UNCHAINED_PLUGIN_DEPS__, so plugins share the
 *   exact same React/Apollo instances as the host.
 * - SDK subpaths (@unchainedshop/admin-ui/ui, ...) map to the prebuilt ESM
 *   files in dist/, served by the engine under /admin-ui-sdk/.
 *
 * This file is imported by plugin build configs (via tsup, plain Node ESM)
 * and the browser build. The data lives in the dependency-free CommonJS
 * module so @unchainedshop/api can load it synchronously and lazily through
 * the package's `require` condition.
 */
import runtime from './plugin-runtime.cjs';

export const {
  SHARED_DEP_SHIMS,
  SDK_ENTRY_KEYS,
  SDK_MODULE_FILES,
  PLUGIN_EXTERNALS,
} = runtime;
