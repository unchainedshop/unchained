module.exports = {
  testPathIgnorePatterns: [
    "<rootDir>/examples/",
    "<rootDir>/docs",
    "<rootDir>/packages",
  ],
  transform: {
    "^.+\\.jsx?$": "babel-jest",
    "^.+\\.ts?$": "ts-jest",
  },
  preset: "@shelf/jest-mongodb",
  globalSetup: "./tests/jest-global-setup.js",
  globalTeardown: "./tests/jest-global-teardown.js",
  moduleNameMapper: {
    "^/UsersCollection.ts?$":
      "<rootDir>/tests/jest-meteor-stubs/users-collection.js",
    "^lodash.clone$": "<rootDir>/tests/jest-meteor-stubs/lodash-clone",
    "^meteor/meteor$": "<rootDir>/tests/jest-meteor-stubs/meteor",
  },
};
