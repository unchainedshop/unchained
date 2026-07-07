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
 * This file is imported by plugin build configs (via tsup, plain Node ESM),
 * and by @unchainedshop/api for server-side import map generation. It must
 * stay dependency-free and browser/Node neutral.
 */

/** Bare specifiers provided by the host app, mapped to their shim file in dist/. */
export const SHARED_DEP_SHIMS = {
  react: 'shims/react.js',
  'react/jsx-runtime': 'shims/react-jsx-runtime.js',
  'react-dom': 'shims/react-dom.js',
  'react-dom/client': 'shims/react-dom-client.js',
  '@apollo/client': 'shims/apollo-client.js',
  '@apollo/client/react': 'shims/apollo-client-react.js',
  'next/router': 'shims/next-router.js',
  'next/link': 'shims/next-link.js',
  'next/image': 'shims/next-image.js',
  'next/head': 'shims/next-head.js',
  'react-intl': 'shims/react-intl.js',
  'react-toastify': 'shims/react-toastify.js',
  formik: 'shims/formik.js',
  '@unchainedshop/admin-ui/plugins': 'shims/admin-ui-plugins.js',
};

/**
 * SDK entry keys built by tsup.config.ts (excluding shim entries). Each key
 * maps to `@unchainedshop/admin-ui/{key}` as the import specifier and
 * `{key}.js` as the dist file. Add new SDK entries here — tsup.config.ts
 * validates that its entry map stays in sync at build time.
 */
export const SDK_ENTRY_KEYS = [
  'ui',
  'form',
  'hooks',
  'providers',
  'modal',
  'theme',
  'modules/accounts',
  'modules/assortment',
  'modules/country',
  'modules/currency',
  'modules/delivery-provider',
  'modules/enrollment',
  'modules/event',
  'modules/filter',
  'modules/language',
  'modules/order',
  'modules/payment-providers',
  'modules/product',
  'modules/product-review',
  'modules/quotation',
  'modules/token',
  'modules/warehousing-providers',
  'modules/work',
];

/** SDK subpath exports resolvable from plugin bundles, mapped to their dist file. */
export const SDK_MODULE_FILES = Object.fromEntries(
  SDK_ENTRY_KEYS.map((key) => [`@unchainedshop/admin-ui/${key}`, `${key}.js`]),
);

/** All bare specifiers a plugin bundle may leave external. */
export const PLUGIN_EXTERNALS = [
  ...Object.keys(SHARED_DEP_SHIMS),
  /^@unchainedshop\/admin-ui\//,
];
