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
    '^meteor/ostrio:cookies$':
      '<rootDir>/tests/jest-meteor-stubs/ostrio-cookies',
    '^meteor/check$': '<rootDir>/tests/jest-meteor-stubs/check',
    '^lodash.merge$': '<rootDir>/tests/jest-meteor-stubs/lodash-merge',
    '^fs-extra$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/fs-extra',
    '^request-libcurl$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/request-libcurl',
    '^file-type$': '<rootDir>/tests/jest-meteor-stubs/file-type',
    '^eventemitter3$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/eventemitter3',
    '^mongodb$':
      '<rootDir>/packages/core-files/.npm/package/node_modules/mongodb',
  },
};
