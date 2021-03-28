import { GraphQLUpload } from 'graphql-upload';
import { BigIntResolver } from 'graphql-scalars';
import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import JSON from './scalar-json';
import Types from './types';

export default {
  ...Types,
  Upload: GraphQLUpload,
  JSON,
  BigInt: BigIntResolver,
  Date,
  Query,
  Mutation,
};
