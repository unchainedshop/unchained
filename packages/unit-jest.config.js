export default {
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
