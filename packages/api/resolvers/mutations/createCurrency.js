import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function (root, { currency }, { userId }) {
  log('mutation createCurrency', { userId });
  return Currencies.createCurrency({
    ...currency,
    authorId: userId,
  });
}
