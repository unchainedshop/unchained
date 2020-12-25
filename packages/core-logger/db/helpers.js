import 'meteor/dburles:collection-helpers';
import { Logs } from './collections';

Logs.helpers({});

Logs.findLogs = ({ limit, offset }) => {
  return Logs.find(
    {},
    {
      skip: offset,
      limit,
      sort: {
        created: -1,
      },
    }
  ).fetch();
};
