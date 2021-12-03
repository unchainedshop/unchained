import { log } from 'meteor/unchained:logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function createFilter(
  root,
  { filter },
  { localeContext, userId }
) {
  log('mutation createFilter', { userId });
  return Filters.createFilter({
    ...filter,
    locale: localeContext.language,
    authorId: userId,
  });
}
