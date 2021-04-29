import {
  JSONResolver,
  DateTimeResolver,
  TimestampResolver,
} from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Types from './types';
import BigInt from './scalar-bigint';

export default {
  ...Types,
  JSON: JSONResolver,
  BigInt,
  Query,
  Mutation,
  DateTime: DateTimeResolver,
  Timestamp: TimestampResolver,
};
