import { log } from 'meteor/unchained:logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function createCurrency(root, { currency }, { userId }) {
  log('mutation createCurrency', { userId });
  return Currencies.createCurrency({
    ...currency,
    authorId: userId,
  });
}
