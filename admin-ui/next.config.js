// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('next').NextConfig}
 **/

export default {
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
  experimental: {
    // Preserve each history entry's position, including query-based detail
    // views. useScrollRestoration retries after asynchronous list loads.
    scrollRestoration: true,
  },
};
