import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function filter(root, { filterId }, { userId }) {
  log(`query filter ${filterId}`, { userId });
  return Filters.findOne({ _id: filterId });
}
