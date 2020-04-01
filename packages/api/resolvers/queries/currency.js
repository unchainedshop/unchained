import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function (root, { currencyId }, { userId }) {
  log(`query currency ${currencyId}`, { userId });
  const selector = {};
  selector._id = currencyId;
  const currency = Currencies.findOne(selector);
  return currency;
}
