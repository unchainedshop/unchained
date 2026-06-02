import { defineConfig } from 'tsup';
import { resolve } from 'node:path';

export default defineConfig({
  entry: { index: 'src/index.tsx' },
  format: ['iife'],
  outDir: 'dist',
  dts: false,
  splitting: false,
  clean: true,
  globalName: '_pluginExports',
  footer: {
    js: `if(typeof window!=='undefined'){window.__UNCHAINED_PLUGINS__=window.__UNCHAINED_PLUGINS__||{};window.__UNCHAINED_PLUGINS__['bookmark-manager']=_pluginExports;}`,
  },
  esbuildOptions(options) {
    options.alias = {
      'react': resolve(__dirname, 'src/react-shim.js'),
      'react/jsx-runtime': resolve(__dirname, 'src/react-jsx-shim.js'),
      '@apollo/client': resolve(__dirname, 'src/apollo-shim.js'),
      '@apollo/client/react': resolve(__dirname, 'src/apollo-shim.js'),
    };
  },
});
