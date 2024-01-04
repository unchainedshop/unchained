import { Country, ResolveDefaultCurrencyCodeService } from '@unchainedshop/types/countries.js';
import { Modules } from '@unchainedshop/types/modules.js';
import { LRUCache } from 'lru-cache';

const { NODE_ENV } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 1 : 0; // minute or second

const currencyCodeCache = new LRUCache({
  max: 500,
  ttl,
});

const { UNCHAINED_CURRENCY } = process.env;

const getDefaultCurrency = async (modules: Modules, country?: Country) => {
  if (country?.defaultCurrencyId) {
    return modules.currencies.findCurrency({
      currencyId: country.defaultCurrencyId,
    });
  }
  return null;
};

export const resolveDefaultCurrencyCodeService: ResolveDefaultCurrencyCodeService = async (
  { isoCode },
  { modules },
) => {
  const currencyCode = currencyCodeCache.get(isoCode) as string;
  if (currencyCode) return currencyCode;

  const country = await modules.countries.findCountry({ isoCode });
  const currency = await getDefaultCurrency(modules, country);

  const liveCurrencyCode = currency?.isoCode || UNCHAINED_CURRENCY || 'CHF';
  currencyCodeCache.set(isoCode, liveCurrencyCode);

  return liveCurrencyCode;
};
