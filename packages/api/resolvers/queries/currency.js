import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';
import { CurrencyNotFoundError } from '../../errors';

export default function (root, { currencyId }, { userId }) {
  log(`query currency ${currencyId}`, { userId });
  if (!currencyId) throw new Error('Invalid currency ID provided');

  const selector = {};
  selector._id = currencyId;
  const currency = Currencies.findOne(selector);

  if (!currency) throw new CurrencyNotFoundError({ currencyId });
  return currency;
}
