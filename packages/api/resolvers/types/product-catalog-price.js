import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';

export default {
  isTaxable({ isTaxable }) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }) {
    return isNetPrice || false;
  },
  async country({ countryCode }) {
    return Countries.findCountry({ isoCode: countryCode });
  },
  async currency({ currencyCode }) {
    return Currencies.findCurrency({ isoCode: currencyCode });
  },
};
