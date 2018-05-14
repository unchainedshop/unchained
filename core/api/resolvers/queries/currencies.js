import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function (root, { limit = 10, offset = 0, includeInactive = false }, { userId }) {
  log(`query currencies: ${limit} ${offset} ${includeInactive ? 'includeInactive' : ''}`, { userId });
  const selector = { };
  if (!includeInactive) {
    selector.isActive = true;
  }
  const currencies = Currencies.find(selector, { skip: offset, limit }).fetch();
  return currencies;
}
