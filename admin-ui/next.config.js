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
  // Resolve Next.js and other hoisted workspace dependencies from the monorepo root.
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
