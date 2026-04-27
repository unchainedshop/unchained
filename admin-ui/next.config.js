// @ts-check

const path = require('node:path');

/**
 * @type {import('next').NextConfig}
 **/

module.exports = {
  output: 'export',
  basePath: '',
  trailingSlash: true,
  assetPrefix: '',
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
