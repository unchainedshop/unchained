/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  transformIgnorePatterns: ['node_modules/(?!(unchained-logger)/)'],
};
