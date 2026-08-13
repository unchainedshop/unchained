// @ts-check

const path = require('path');

/**
 * @type {import('next').NextConfig}
 **/

module.exports = {
  output: 'export',
  basePath: '',
  trailingSlash: true,
  assetPrefix: '',
  // admin-ui is a nested git repo whose deps are hoisted to the monorepo root
  // node_modules. Pin the Turbopack workspace root to the monorepo root so it
  // can resolve `next` (and other hoisted packages) instead of stopping at the
  // nested .git boundary.
  turbopack: {
    root: path.resolve(__dirname, '..'),
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  images: {
    unoptimized: true,
  },
};
