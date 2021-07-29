import 'json-bigint-patch';
import { GraphQLUpload } from 'graphql-upload';
import {
  JSONResolver,
  TimestampResolver,
  DateTimeResolver,
  BigIntResolver,
} from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Types from './types';

export default {
  ...Types,
  Upload: GraphQLUpload,
  JSON: JSONResolver,
  BigInt: BigIntResolver,
  Query,
  Mutation,
  DateTime: DateTimeResolver,
  Timestamp: TimestampResolver,
};
