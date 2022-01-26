import { GraphQLUpload } from 'graphql-upload';
import { JSONResolver, TimestampResolver, DateTimeResolver } from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Types from './types';

export default {
  ...Types,
  Upload: GraphQLUpload,
  JSON: JSONResolver,
  Query,
  Mutation,
  DateTime: DateTimeResolver,
  Timestamp: TimestampResolver,
};
