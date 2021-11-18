import 'meteor/dburles:collection-helpers';
import countryFlags from 'emoji-flags';
import countryI18n from 'i18n-iso-countries';
import { Currencies } from 'meteor/unchained:core-currencies';
import LRU from 'lru-cache';
import { systemLocale } from 'meteor/unchained:utils';
import { emit } from 'unchained-events';
import { Countries } from './collections';

const { NODE_ENV } = process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 : -1; // minute or second

const currencyCodeCache = new LRU({
  max: 500,
  maxAge,
});

const { UNCHAINED_CURRENCY } = process.env;

const buildFindSelector = ({ includeInactive = false }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return selector;
};

Countries.updateCountry = ({ countryId, country }) => {
  const result = Countries.update(
    { _id: countryId },
    {
      $set: {
        ...country,
        updated: new Date(),
      },
    }
  );
  emit('COUNTRY_UPDATE', { countryId });
  return result;
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
  isBase() {
    return this.isoCode === systemLocale.country;
  },
});

Countries.createCountry = ({ isoCode, ...countryData }) => {
  const _id = Countries.insert({
    created: new Date(),
    isoCode: isoCode.toUpperCase(),
    isActive: true,
    ...countryData,
  });
  const country = Countries.findOne({ _id });
  emit('COUNTRY_CREATE', { country });
  return country;
};

Countries.resolveDefaultCurrencyCode = ({ isoCode }) => {
  const currencyCode = currencyCodeCache.get(isoCode);
  if (currencyCode) return currencyCode;

  const country = Countries.findOne({ isoCode });
  const currency = country && country.defaultCurrency();
  const liveCurrencyCode =
    (currency && currency.isoCode) || UNCHAINED_CURRENCY || 'CHF';
  currencyCodeCache.set(isoCode, liveCurrencyCode);
  return liveCurrencyCode;
};

Countries.findCountries = ({ limit, offset, ...query }) => {
  return Countries.find(buildFindSelector(query), {
    skip: offset,
    limit,
  }).fetch();
};

Countries.count = async (query) => {
  const count = await Countries.rawCollection().countDocuments(
    buildFindSelector(query)
  );
  return count;
};

Countries.countryExists = ({ countryId }) => {
  return !!Countries.find({ _id: countryId }, { limit: 1 }).count();
};

Countries.findCountry = ({ countryId, isoCode }) => {
  return Countries.findOne(countryId ? { _id: countryId } : { isoCode });
};

Countries.removeCountry = ({ countryId }) => {
  const result = Countries.remove({ _id: countryId });
  emit('COUNTRY_REMOVE', { countryId });
  return result;
};
