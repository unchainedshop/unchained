import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError } from '../../errors';

export default function (root, { filterId, filterOptionValue }, { userId }) {
  log(`mutation removeFilterOption ${filterId}`, { userId });
  if (!filterId) throw new Error('Invalid filter ID provided');
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  Filters.update(
    { _id: filterId },
    {
      $set: {
        updated: new Date(),
      },
      $pull: {
        options: filterOptionValue,
      },
    },
  );
  return Filters.findOne({ _id: filterId });
}
