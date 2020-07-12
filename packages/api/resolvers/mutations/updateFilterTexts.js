import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError } from '../../errors';

export default function (
  root,
  { texts, filterId, filterOptionValue },
  { userId },
) {
  log(`mutation updateFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });
  if (!filterId) throw new Error('Invalid filter ID provided');
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  const changedLocalizations = texts.map(({ locale, ...fields }) =>
    filter.upsertLocalizedText(locale, { filterOptionValue, ...fields }),
  );
  return changedLocalizations;
}
