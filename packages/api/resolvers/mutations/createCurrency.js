import { log } from 'meteor/unchained:core-logger';
import { Currencies } from 'meteor/unchained:core-currencies';

export default function(root, { currency: inputData }, { userId }) {
  log('mutation createCurrency', { userId });
  const { isoCode } = inputData;
  const currency = { created: new Date() };
  currency.authorId = userId;
  currency.created = new Date();
  currency.isoCode = isoCode.toUpperCase();
  currency.isActive = true;
  const currencyId = Currencies.insert(currency);
  const currencyObject = Currencies.findOne({ _id: currencyId });
  return currencyObject;
}
