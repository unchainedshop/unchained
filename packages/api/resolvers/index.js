import { JSONResolver } from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import Types from './types';
import BigInt from './scalar-bigint';

export default {
  ...Types,
  JSON: JSONResolver,
  Date,
  BigInt,
  Query,
  Mutation,
};
