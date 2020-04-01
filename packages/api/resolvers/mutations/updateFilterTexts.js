import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function (
  root,
  { texts, filterId, filterOptionValue },
  { userId }
) {
  log(`mutation updateFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });
  const filter = Filters.findOne({ _id: filterId });
  const changedLocalizations = texts.map(({ locale, ...fields }) =>
    filter.upsertLocalizedText(locale, { filterOptionValue, ...fields })
  );
  return changedLocalizations;
}
