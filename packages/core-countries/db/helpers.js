import 'meteor/dburles:collection-helpers';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import { Countries } from './collections';

const { CURRENCY } = process.env;

Countries.helpers({
  defaultCurrency() {
    if (this.defaultCurrencyId) {
      return Currencies.findOne({ _id: this.defaultCurrencyId });
    }
    return null;
  },
  name(language) {
    return countryI18n.getName(this.isoCode, language) || language;
  },
  flagEmoji() {
    return countryFlags.countryCode(this.isoCode).emoji || '❌';
  },
});

Countries.resolveDefaultCurrencyCode = ({ isoCode }) => {
  const country = Countries.findOne({ isoCode });
  const currency = country && country.defaultCurrency();
  const currencyCode = currency && currency.isoCode;
  return currencyCode || CURRENCY || 'CHF';
};
