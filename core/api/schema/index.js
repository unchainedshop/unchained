import types from './types';
import query from './query';
import mutation from './mutation';

export default [
  `
    scalar Date
    scalar JSON
    scalar Buffer
    scalar Upload
  `,
  ...types,
  ...query,
  ...mutation,
];
