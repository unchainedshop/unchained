import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function(root, { currencyId }, { userId }) {
  log(`mutation removeCurrency ${currencyId}`, { userId });
  const currency = Currencies.findOne({ _id: currencyId });
  Currencies.remove({ _id: currencyId });
  return currency;
}
