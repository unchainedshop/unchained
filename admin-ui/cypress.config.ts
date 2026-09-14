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
      // Two retries in CI: the container runner is markedly slower than a
      // dev machine, so occasionally a menu/popover open or list re-render
      // races the 5s command timeout. Deterministic failures still fail all
      // three attempts.
      runMode: 2,
    },
  },

  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
  },
});
