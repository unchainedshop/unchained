import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 5000,

  retries: {
    runMode: 2,
    openMode: 1,
  },

  e2e: {
    defaultCommandTimeout: 5000,
    projectId: 'jo7evx',
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    retries: {
      openMode: 1,
      runMode: 1,
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
