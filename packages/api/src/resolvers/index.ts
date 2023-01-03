import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import { JSONResolver, TimestampResolver, DateTimeResolver, DateResolver } from 'graphql-scalars';
import Query from './queries/index.js';
import Mutation from './mutations/index.js';
import Types from './type/index.js';
import CustomScalars from './scalars/index.js';

export default {
  ...Types,
  ...CustomScalars,
  Upload: GraphQLUpload,
  JSON: JSONResolver,
  Query,
  Mutation,
  DateTime: DateTimeResolver,
  Date: DateResolver,
  Timestamp: TimestampResolver,
} as unknown as Record<string, any>;
