import { log } from 'unchained-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { InvalidIdError } from '../../errors';

export default function filter(root, { filterId }, { userId }) {
  log(`query filter ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  return Filters.findFilter({ filterId });
}
