import 'meteor/dburles:collection-helpers';
import { Logs } from './collections';

Logs.helpers({});

Logs.findLogs = ({
  limit,
  offset,
  sort = {
    created: -1,
  },
}) => {
  return Logs.find(
    {},
    {
      skip: offset,
      limit,
      sort,
    }
  ).fetch();
};

Logs.count = async () => {
  const count = await Logs.rawCollection().countDocuments();
  return count;
};
