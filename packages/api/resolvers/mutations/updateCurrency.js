import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';
import { CurrencyNotFoundError } from '../../errors';

export default function (
  root,
  { currency: { isoCode, ...currency }, currencyId },
  { userId },
) {
  log(`mutation updateCurrency ${currencyId}`, { userId });
  if (!currencyId) throw new Error('Invalid currency ID provided');
  const currencyObject = Currencies.findOne({ _id: currencyId });
  if (!currencyObject) throw new CurrencyNotFoundError({ currencyId });
  Currencies.update(
    { _id: currencyId },
    {
      $set: {
        isoCode: isoCode.toUpperCase(),
        ...currency,
        updated: new Date(),
      },
    },
  );
  return Currencies.findOne({ _id: currencyId });
}
