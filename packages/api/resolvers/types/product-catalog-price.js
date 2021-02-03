import { Countries } from 'meteor/unchained:core-countries';
import { Currencies } from 'meteor/unchained:core-currencies';

export default {
  async country({ countryCode }) {
    return Countries.findCountry({ isoCode: countryCode });
  },
  async currency({ currencyCode }) {
    return Currencies.findCurrency({ isoCode: currencyCode });
  },
};
