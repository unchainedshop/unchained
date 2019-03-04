import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function(root, { filter, filterId }, { userId }) {
  log(`mutation updateFilter ${filterId}`, { userId });
  Filters.update(
    { _id: filterId },
    {
      $set: {
        ...filter,
        updated: new Date()
      }
    }
  );
  return Filters.findOne({ _id: filterId });
}
