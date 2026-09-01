/**
 * Synchronously loadable source of truth for the admin-ui plugin module graph.
 *
 * Keep this file data-only: the API loads it through the package's `require`
 * condition when plugins are enabled, while plugin-runtime.mjs exposes the
 * same values to ESM consumers and the browser build.
 */

const SHARED_DEP_SHIMS = {
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
  'react-hook-form': 'shims/react-hook-form.js',
  '@unchainedshop/admin-ui/plugins': 'shims/admin-ui-plugins.js',
};

const SDK_ENTRY_KEYS = [
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
  'modules/warehousing-providers',
  'modules/work',
];

const SDK_MODULE_FILES = Object.fromEntries(
  SDK_ENTRY_KEYS.map((key) => [`@unchainedshop/admin-ui/${key}`, `${key}.js`]),
);

const PLUGIN_EXTERNALS = [
  ...Object.keys(SHARED_DEP_SHIMS),
  /^@unchainedshop\/admin-ui\//,
];

module.exports = {
  SHARED_DEP_SHIMS,
  SDK_ENTRY_KEYS,
  SDK_MODULE_FILES,
  PLUGIN_EXTERNALS,
};
