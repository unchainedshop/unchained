import { log } from 'meteor/unchained:core-logger';
import { Filters, FilterTypes } from 'meteor/unchained:core-filters';

export default function(
  root,
  { filter: inputData },
  { localeContext, userId }
) {
  log('mutation createFilter', { userId });
  const { key, type, title, options } = inputData;
  const filter = {
    created: new Date(),
    type: FilterTypes[type],
    key,
    options
  };
  const filterId = Filters.insert(filter);
  const filterObject = Filters.findOne({ _id: filterId });
  filterObject.upsertLocalizedText(localeContext.language, { title });
  return filterObject;
}
