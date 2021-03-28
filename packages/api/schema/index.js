import { BigIntTypeDefinition } from 'graphql-scalars';
import scalars from './scalars';
import types from './types';
import inputTypes from './inputTypes';
import query from './query';
import mutation from './mutation';

export default [
  BigIntTypeDefinition,
  ...scalars,
  ...types,
  ...inputTypes,
  ...query,
  ...mutation,
];
