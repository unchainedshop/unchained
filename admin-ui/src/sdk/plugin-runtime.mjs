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

/** SDK subpath exports resolvable from plugin bundles, mapped to their dist file. */
export const SDK_MODULE_FILES = {
  '@unchainedshop/admin-ui/ui': 'ui.js',
  '@unchainedshop/admin-ui/form': 'form.js',
  '@unchainedshop/admin-ui/hooks': 'hooks.js',
  '@unchainedshop/admin-ui/providers': 'providers.js',
  '@unchainedshop/admin-ui/modal': 'modal.js',
  '@unchainedshop/admin-ui/theme': 'theme.js',
  '@unchainedshop/admin-ui/modules/accounts': 'modules/accounts.js',
  '@unchainedshop/admin-ui/modules/assortment': 'modules/assortment.js',
  '@unchainedshop/admin-ui/modules/country': 'modules/country.js',
  '@unchainedshop/admin-ui/modules/currency': 'modules/currency.js',
  '@unchainedshop/admin-ui/modules/delivery-provider': 'modules/delivery-provider.js',
  '@unchainedshop/admin-ui/modules/enrollment': 'modules/enrollment.js',
  '@unchainedshop/admin-ui/modules/event': 'modules/event.js',
  '@unchainedshop/admin-ui/modules/filter': 'modules/filter.js',
  '@unchainedshop/admin-ui/modules/language': 'modules/language.js',
  '@unchainedshop/admin-ui/modules/order': 'modules/order.js',
  '@unchainedshop/admin-ui/modules/payment-providers': 'modules/payment-providers.js',
  '@unchainedshop/admin-ui/modules/product': 'modules/product.js',
  '@unchainedshop/admin-ui/modules/product-review': 'modules/product-review.js',
  '@unchainedshop/admin-ui/modules/quotation': 'modules/quotation.js',
  '@unchainedshop/admin-ui/modules/token': 'modules/token.js',
  '@unchainedshop/admin-ui/modules/warehousing-providers': 'modules/warehousing-providers.js',
  '@unchainedshop/admin-ui/modules/work': 'modules/work.js',
};

/** All bare specifiers a plugin bundle may leave external. */
export const PLUGIN_EXTERNALS = [
  ...Object.keys(SHARED_DEP_SHIMS),
  /^@unchainedshop\/admin-ui\//,
];
