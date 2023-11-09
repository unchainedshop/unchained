export default {
  testPathIgnorePatterns: ['<rootDir>/examples/', '<rootDir>/docs', '<rootDir>/packages'],
  transform: {
    // '^.+\\.ts?$': 'ts-jest',
  },
  preset: '@shelf/jest-mongodb',
  globalSetup: './tests/jest-global-setup.js',
  globalTeardown: './tests/jest-global-teardown.js',
};
