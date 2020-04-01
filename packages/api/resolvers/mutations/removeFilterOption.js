import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function (root, { filterId, filterOptionValue }, { userId }) {
  log(`mutation removeFilterOption ${filterId}`, { userId });
  Filters.update(
    { _id: filterId },
    {
      $set: {
        updated: new Date(),
      },
      $pull: {
        options: filterOptionValue,
      },
    }
  );
  const filter = Filters.findOne({ _id: filterId });
  return filter;
}
