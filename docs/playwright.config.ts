import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'take-screenshots.ts',
  timeout: 5 * 60 * 1000,
  use: {
    baseURL: 'http://localhost:4010',
    viewport: { width: 1280, height: 800 },
    screenshot: 'off',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
});
