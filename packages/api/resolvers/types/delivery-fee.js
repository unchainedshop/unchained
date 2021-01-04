import { Countries } from 'meteor/unchained:core-countries';

export default {
  isTaxable({ isTaxable }) {
    return isTaxable || false;
  },
  isNetPrice({ isNetPrice }) {
    return isNetPrice || false;
  },
  country({ countryCode }) {
    return Countries.findCountry({ isoCode: countryCode });
  },
  price({ amount, currencyCode }) {
    return {
      amount,
      currency: currencyCode,
    };
  },
};
