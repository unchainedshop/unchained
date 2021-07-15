import { GraphQLUpload } from 'graphql-upload';
import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import JSON from './scalar-json';
import Types from './types';

export default {
  ...Types,
  Upload: GraphQLUpload,
  JSON,
  Date,
  Query,
  Mutation,
};
