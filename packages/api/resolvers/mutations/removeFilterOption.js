import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function removeFilterOption(
  root,
  { filterId, filterOptionValue },
  { userId },
) {
  log(`mutation removeFilterOption ${filterId}`, { userId });
  if (!filterId) throw new InvalidIdError({ filterId });
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
