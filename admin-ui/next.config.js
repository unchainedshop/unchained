// @ts-check
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * @type {import('next').NextConfig}
 **/

export default {
  output: 'export',
  // Keep the dev server's state out of .next: `next build` writes production
  // artifacts there (with output: 'export' a custom distDir would become the
  // export destination, so build must stay on the default), and dev runs on a
  // .next polluted by a build break dynamic-route matching (/ext/[[...slug]]
  // 404s) under Turbopack.
  distDir: process.env.NODE_ENV === 'production' ? '.next' : '.next-dev',
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
