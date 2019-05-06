import { log } from 'meteor/unchained:core-logger';
import { Filters } from 'meteor/unchained:core-filters';

export default function(root, { filter }, { localeContext, userId }) {
  log('mutation createFilter', { userId });
  return Filters.createFilter({
    authorId: userId,
    locale: localeContext.language,
    ...filter
  });
}
