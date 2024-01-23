export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts', '.tsx', '.jsx'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'packages/shared/base.tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    '(.+)\\.js': '$1',
  },
};
