import { Context } from '@unchainedshop/types/api';
import { Country, ResolveDefaultCurrencyCodeService } from '@unchainedshop/types/countries';
import { Modules } from '@unchainedshop/types/modules';
import LRU from 'lru-cache';

// REMARK: --> combines defaultCurrency and resolveDefaultCurrencyCode helpers

const { NODE_ENV } = process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 : -1; // minute or second

const currencyCodeCache = new LRU({
  max: 500,
  maxAge,
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
  const currencyCode = currencyCodeCache.get(isoCode);
  if (currencyCode) return currencyCode;

  const country = await modules.countries.findCountry({ isoCode });
  const currency = await getDefaultCurrency(modules, country);

  const liveCurrencyCode = currency?.isoCode || UNCHAINED_CURRENCY || 'CHF';
  currencyCodeCache.set(isoCode, liveCurrencyCode);

  return liveCurrencyCode;
};
