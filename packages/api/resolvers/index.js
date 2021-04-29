import { GraphQLUpload } from 'graphql-upload';
import {
  BigIntResolver,
  JSONResolver,
  PositiveFloatResolver,
  TimestampResolver
} from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Types from './types';
import BigInt from './scalar-bigint';

export default {
  ...Types,
  Upload: GraphQLUpload,
  BigInt: BigIntResolver,
  JSON: JSONResolver,
  BigInt,
  Query,
  Mutation,
  Timestamp: TimestampResolver,
};
