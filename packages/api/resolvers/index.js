import { GraphQLUpload } from 'graphql-upload';
import { BigIntResolver, JSONResolver } from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import Types from './types';

export default {
  ...Types,
  Upload: GraphQLUpload,
  BigInt: BigIntResolver,
  JSON: JSONResolver,
  Date,
  Query,
  Mutation,
};
