import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    ui: 'src/components/ui/index.ts',
    form: 'src/components/ui/form/index.ts',
    hooks: 'src/sdk/hooks.ts',
    providers: 'src/sdk/providers.ts',
    modal: 'src/sdk/modal.ts',
    theme: 'src/sdk/theme.ts',
  },
  format: ['esm'],
  dts: false,
  splitting: true,
  treeshake: true,
  clean: true,
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'next',
    'next/link',
    'next/image',
    'next/router',
    'formik',
    '@apollo/client',
    '@apollo/client/react',
    'react-intl',
    'react-toastify',
    'graphql',
  ],
  esbuildOptions(options) {
    options.alias = {
      '@/*': './src/*',
    };
  },
});
