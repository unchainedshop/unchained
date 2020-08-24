import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';
import { FilterNotFoundError, InvalidIdError } from '../../errors';

export default function createFilterOption(
  root,
  { option: inputData, filterId },
  { localeContext, userId },
) {
  log(`mutation createFilterOption ${filterId}`, { userId });

  if (!filterId) throw new InvalidIdError({ filterId });
  const { value, title } = inputData;
  const filterObject = Filters.findOne({ _id: filterId });
  if (!filterObject) throw new FilterNotFoundError({ filterId });
  Filters.update(
    { _id: filterId },
    {
      $set: {
        updated: new Date(),
      },
      $addToSet: {
        options: value,
      },
    },
  );
  const filter = Filters.findOne({ _id: filterId });
  filter.upsertLocalizedText(localeContext.language, {
    authorId: userId,
    filterOptionValue: value,
    title,
  });
  return filter;
}
