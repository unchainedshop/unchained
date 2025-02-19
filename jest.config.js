export default {
  testPathIgnorePatterns: ['<rootDir>/examples/', '<rootDir>/docs', '<rootDir>/packages'],
  transform: {},
  globalSetup: './tests/jest-global-setup.js',
  globalTeardown: './tests/jest-global-teardown.js',
};
