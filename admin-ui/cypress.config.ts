import { defineConfig } from 'cypress';

export default defineConfig({
  defaultCommandTimeout: 5000,

  retries: {
    runMode: 3,
    openMode: 2,
  },

  e2e: {
    defaultCommandTimeout: 5000,
    projectId: 'jo7evx',
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    retries: {
      openMode: 2,
      runMode: 3,
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
