import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function (
  root,
  { currency: { isoCode, ...currency }, currencyId },
  { userId },
) {
  log(`mutation updateCurrency ${currencyId}`, { userId });
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
