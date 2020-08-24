import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function currency(root, { currencyId }, { userId }) {
  log(`query currency ${currencyId}`, { userId });
  const selector = {};
  selector._id = currencyId;
  return Currencies.findOne(selector);
}
