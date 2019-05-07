import { log } from 'meteor/unchained:core-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default (root, { assortment }, { userId, localeContext }) => {
  log('mutation createAssortment', { userId });
  return Assortments.createAssortment({
    locale: localeContext.language,
    authorId: userId,
    ...assortment
  });
};
