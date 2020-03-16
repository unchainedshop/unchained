import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function(root, { filterId }, { userId }) {
  log(`mutation removeFilter ${filterId}`, { userId });
  return Filters.removeFilter({ filterId });
}
