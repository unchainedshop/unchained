/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
export default {
  preset: '@shelf/jest-mongodb',
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
};
