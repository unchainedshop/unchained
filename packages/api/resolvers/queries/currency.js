import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';
import { CurrencyNotFoundError, InvalidIdError } from '../../errors';

export default function currency(root, { currencyId }, { userId }) {
  log(`query currency ${currencyId}`, { userId });

  if (!currencyId) throw new InvalidIdError({ currencyId });
  const foundCurrency = Currencies.findCurrency({ currencyId });
  if (!foundCurrency) throw new CurrencyNotFoundError({ currencyId });

  return foundCurrency;
}
