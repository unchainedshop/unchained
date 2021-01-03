import 'meteor/dburles:collection-helpers';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import LRU from 'lru-cache';
import { Countries } from './collections';

const { NODE_ENV } = process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 : -1; // minute or second

const currencyCodeCache = new LRU({
  max: 500,
  maxAge,
});

const { CURRENCY } = process.env;

Countries.setBase = ({ countryId }) => {
  Countries.update(
    { isBase: true },
    {
      $set: {
        isBase: false,
        updated: new Date(),
      },
    },
    { multi: true }
  );
  Countries.update(
    { _id: countryId },
    {
      $set: {
        isBase: true,
        updated: new Date(),
      },
    }
  );
};

Countries.updateCountry = ({ countryId, country }) => {
  return Countries.update(
    { _id: countryId },
    {
      $set: {
        ...country,
        updated: new Date(),
      },
    }
  );
};
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

Countries.createCountry = ({ isoCode, ...countryData }) => {
  const _id = Countries.insert({
    created: new Date(),
    isoCode: isoCode.toUpperCase(),
    isActive: true,
    ...countryData,
  });
  return Countries.findOne({ _id });
};

Countries.resolveDefaultCurrencyCode = ({ isoCode }) => {
  const currencyCode = currencyCodeCache.get(isoCode);
  if (currencyCode) return currencyCode;

  const country = Countries.findOne({ isoCode });
  const currency = country && country.defaultCurrency();
  const liveCurrencyCode = (currency && currency.isoCode) || CURRENCY || 'CHF';
  currencyCodeCache.set(isoCode, liveCurrencyCode);
  return liveCurrencyCode;
};

Countries.findCountries = ({ limit, offset, includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return Countries.find(selector, { skip: offset, limit }).fetch();
};

Countries.countryExists = ({ countryId }) => {
  return !!Countries.find({ _id: countryId }, { limit: 1 }).count();
};

Countries.findCountry = ({ countryId, isoCode }) => {
  return Countries.findOne(countryId ? { _id: countryId } : { isoCode });
};

Countries.removeCountry = ({ countryId }) => {
  return Countries.remove({ _id: countryId });
};
