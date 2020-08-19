import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';
import { CurrencyNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { currencyId }, { userId }) {
  log(`mutation removeCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new InvalidIdError({ currencyId });
  const currency = Currencies.findOne({ _id: currencyId });
  if (!currency) throw new CurrencyNotFoundError({ currencyId });
  Currencies.remove({ _id: currencyId });
  return currency;
}
