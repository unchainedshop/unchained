import {
  GraphQLJSON,
  GraphQLTimestamp,
  GraphQLDateTimeISO,
  GraphQLDate,
  GraphQLLocale,
} from 'graphql-scalars';
import Query from './queries/index.ts';
import Mutation from './mutations/index.ts';
import Types from './type/index.ts';
import CustomScalars from './scalars/index.ts';

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
