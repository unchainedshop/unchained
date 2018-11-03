import scalars from './scalars';
import types from './types';
import query from './query';
import mutation from './mutation';

export default [
  ...scalars,
  ...types,
  ...query,
  ...mutation,
];
