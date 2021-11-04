module.exports = {
  testPathIgnorePatterns: ["<rootDir>/examples/*"],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.ts?$": "ts-jest",
  },
  preset: "@shelf/jest-mongodb",
  globalSetup: "./tests/jest-global-setup.js",
  globalTeardown: "./tests/jest-global-teardown.js",
  moduleNameMapper: {
    "^meteor/unchained:core-users$":
      "<rootDir>/tests/jest-meteor-stubs/core-users",
    "^lodash.clone$": "<rootDir>/tests/jest-meteor-stubs/lodash-clone",
    "^meteor/meteor$": "<rootDir>/tests/jest-meteor-stubs/meteor",
  },
};
