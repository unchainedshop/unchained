import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function updateFilterTexts(
  root,
  { texts, filterId, filterOptionValue },
  { userId }
) {
  log(`mutation updateFilterTexts ${filterId} ${filterOptionValue}`, {
    userId,
  });
  if (!filterId) throw new InvalidIdError({ filterId });
  const filter = Filters.findOne({ _id: filterId });
  if (!filter) throw new FilterNotFoundError({ filterId });
  const changedLocalizations = texts.map(({ locale, ...fields }) =>
    filter.upsertLocalizedText(locale, {
      authorId: userId,
      filterOptionValue,
      ...fields,
    })
  );
  return changedLocalizations;
}
