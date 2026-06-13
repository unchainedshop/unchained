import {
  GraphQLJSON,
  GraphQLTimestamp,
  GraphQLDateTimeISO,
  GraphQLDate,
  GraphQLLocale,
} from 'graphql-scalars';
import { GraphQLScalarType } from 'graphql';
import Query from './queries/index.ts';
import Mutation from './mutations/index.ts';
import Types from './type/index.ts';
import CustomScalars from './scalars/index.ts';

const GraphQLDateTime = new GraphQLScalarType({
  ...GraphQLDateTimeISO.toConfig(),
  name: 'DateTime',
});

export default {
  ...Types,
  ...CustomScalars,
  JSON: GraphQLJSON,
  Query,
  Mutation,
  DateTime: GraphQLDateTime,
  Date: GraphQLDate,
  Timestamp: GraphQLTimestamp,
  Locale: GraphQLLocale,
} as unknown as Record<string, any>;
