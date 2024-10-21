import {
  GraphQLJSON,
  GraphQLTimestamp,
  GraphQLDateTimeISO,
  GraphQLDate,
  GraphQLLocale,
} from 'graphql-scalars';
import Query from './queries/index.js';
import Mutation from './mutations/index.js';
import Types from './type/index.js';
import CustomScalars from './scalars/index.js';

export default {
  ...Types,
  ...CustomScalars,
  JSON: GraphQLJSON,
  Query,
  Mutation,
  DateTime: GraphQLDateTimeISO,
  Date: GraphQLDate,
  Timestamp: GraphQLTimestamp,
  Locale: GraphQLLocale,
} as unknown as Record<string, any>;
