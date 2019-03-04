import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function(
  root,
  { option: inputData, filterId },
  { localeContext, userId }
) {
  log(`mutation createFilterOption ${filterId}`, { userId });
  const { value, title } = inputData;
  Filters.update(
    { _id: filterId },
    {
      $set: {
        updated: new Date()
      },
      $addToSet: {
        options: value
      }
    }
  );
  const filter = Filters.findOne({ _id: filterId });
  filter.upsertLocalizedText({
    locale: localeContext.language,
    filterOptionValue: value,
    title
  });
  return filter;
}
