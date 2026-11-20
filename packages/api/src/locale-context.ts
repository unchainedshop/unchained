import {
  getPriceDecimals,
  resolveBestSupported,
  resolveBestCurrency,
  memoizeWithTTL,
} from '@unchainedshop/utils';
import type { UnchainedCore, UnchainedRequestContext } from '@unchainedshop/core';
import type { UnchainedHTTPServerContext } from './context.ts';
import { createLogger } from '@unchainedshop/logger';
const logger = createLogger('unchained:api');

export type UnchainedLocaleContext = Pick<
  UnchainedRequestContext,
  'countryCode' | 'locale' | 'currencyCode' | 'getCurrencyDecimals'
>;

const uncachedResolveDefaultContext = async (
  { acceptLang, acceptCountry },
  unchainedAPI: UnchainedCore,
) => {
  const languages = await unchainedAPI.modules.languages.findLanguages(
    { includeInactive: false },
    { projection: { isoCode: 1, isActive: 1 } },
  );

  const countries = await unchainedAPI.modules.countries.findCountries(
    { includeInactive: false },
    { projection: { isoCode: 1, isActive: 1, defaultCurrencyCode: 1 } },
  );

  // Existing orders can use an inactive currency. Only active currencies can be selected for shopping.
  const currencies = await unchainedAPI.modules.currencies.findCurrencies(
    { includeInactive: true },
    { projection: { isoCode: 1, isActive: 1, decimals: 1, _id: 0 } },
  );
  const decimalsByCode = new Map(
    currencies.map(({ isoCode, decimals }) => [isoCode, getPriceDecimals(decimals)]),
  );

  const locale = resolveBestSupported(acceptLang, acceptCountry, { countries, languages });

  const defaultCurrencyCode = countries.find(
    (country) => country.isoCode.toUpperCase() === locale?.region?.toUpperCase(),
  )?.defaultCurrencyCode;

  const currencyCode = resolveBestCurrency(
    defaultCurrencyCode || null,
    currencies.filter((currency) => currency.isActive),
  );

  logger.debug(`Locale Context: Resolved ${locale?.baseName} ${currencyCode}`);

  const newContext: UnchainedLocaleContext = {
    locale,
    countryCode: locale.region as string,
    currencyCode,
    getCurrencyDecimals: (isoCode) => decimalsByCode.get(isoCode),
  };

  return newContext;
};

const shopIds = new WeakMap<UnchainedCore['modules'], number>();
let nextShopId = 0;
export const resolveDefaultContext = memoizeWithTTL(uncachedResolveDefaultContext, {
  // Cache for one minute in production; use a 1 ms TTL otherwise.
  ttl: process.env.NODE_ENV === 'production' ? 1000 * 60 : 1,
  cacheKey: ([{ acceptLang, acceptCountry }, api]) => {
    const shopId = shopIds.getOrInsertComputed(api.modules, () => nextShopId++);
    return `${shopId}:${acceptLang}-${acceptCountry}`;
  },
});

// Callers invalidate a locale by its original header key (e.g. "de-CH") across shops.
const deleteShopLocale = resolveDefaultContext.delete;
resolveDefaultContext.delete = (headerKey) => {
  if (typeof headerKey !== 'string') return false;
  let deleted = false;
  for (let id = 0; id < nextShopId; id += 1) {
    if (deleteShopLocale(`${id}:${headerKey}`)) deleted = true;
  }
  return deleted;
};

export const getLocaleContext = async (
  {
    getHeader,
  }: {
    getHeader: UnchainedHTTPServerContext['getHeader'];
  },
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLocaleContext> => {
  return resolveDefaultContext(
    { acceptLang: getHeader('accept-language'), acceptCountry: getHeader('x-shop-country') },
    unchainedAPI,
  );
};
