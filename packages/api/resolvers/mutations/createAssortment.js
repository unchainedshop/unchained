import { log } from 'unchained-logger';
import { Assortments } from 'meteor/unchained:core-assortments';

export default (root, { assortment }, { userId, localeContext }) => {
  log('mutation createAssortment', { userId });
  return Assortments.createAssortment({
    ...assortment,
    locale: localeContext.language,
    authorId: userId,
  });
};
