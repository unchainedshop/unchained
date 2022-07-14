module.exports = {
  testPathIgnorePatterns: ['<rootDir>/examples/', '<rootDir>/docs', '<rootDir>/packages'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  preset: '@shelf/jest-mongodb',
  globalSetup: './tests/jest-global-setup.js',
  globalTeardown: './tests/jest-global-teardown.js',
};
