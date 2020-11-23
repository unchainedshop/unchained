module.exports = {
  preset: '@shelf/jest-mongodb',
  globalSetup: './tests/jest-global-setup.js',
  globalTeardown: './tests/jest-global-teardown.js',
  moduleNameMapper: {
    '^meteor/unchained:core-users$':
      '<rootDir>/tests/jest-meteor-stubs/core-users',
    '^@share911/meteor-check$':
      '<rootDir>/tests/jest-meteor-stubs/meteor-check',
    'lodash.clone': '<rootDir>/tests/jest-meteor-stubs/lodash-clone',
  },
};
