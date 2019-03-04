import { log } from "meteor/unchained:core-logger";
import { Filters } from "meteor/unchained:core-filters";

export default function(root, { filterId }, { userId }) {
  log(`mutation removeFilter ${filterId}`, { userId });
  const filter = Filters.findOne({ _id: filterId });
  Filters.remove({ _id: filterId });
  return filter;
}
