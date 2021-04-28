import {
  BigIntResolver,
  JSONResolver,
  CurrencyResolver,
  PositiveFloatResolver,
} from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import Types from './types';

export default {
  ...Types,
  JSON: JSONResolver,
  Date,
  PositiveFloat: PositiveFloatResolver,
  Query,
  Mutation,
};
