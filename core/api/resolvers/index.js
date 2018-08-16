import Query from './queries';
import Mutation from './mutations';
import Date from './scalar-date';
import Buffer from './scalar-buffer';
import JSON from './scalar-json';
import Upload from './scalar-upload';
import Types from './types';

export acl from './acl';
export errors from './errors';

export default {
  ...Types,
  JSON,
  Upload,
  Date,
  Query,
  Buffer,
  Mutation,
};
