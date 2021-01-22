module.exports = {
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  preset: '@shelf/jest-mongodb',
  globalSetup: './tests/jest-global-setup.js',
  globalTeardown: './tests/jest-global-teardown.js',
  moduleNameMapper: {
    '^meteor/unchained:core-users$':
      '<rootDir>/tests/jest-meteor-stubs/core-users',
    '^lodash.clone$': '<rootDir>/tests/jest-meteor-stubs/lodash-clone',
    '^meteor/meteor$': '<rootDir>/tests/jest-meteor-stubs/meteor',
    '^meteor/mongo$': '<rootDir>/tests/jest-meteor-stubs/mongo',
    '^meteor/webapp$': '<rootDir>/tests/jest-meteor-stubs/webapp',
    '^@reactioncommerce/random$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/@reactioncommerce/random',
    '^lodash.merge$': '<rootDir>/tests/jest-meteor-stubs/lodash-merge',
    '^fs-extra$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/fs-extra',
    '^file-type$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/file-type',
    '^mongodb$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/mongodb',
  },
};
