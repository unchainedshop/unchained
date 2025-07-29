import { resolveBestSupported, resolveBestCurrency } from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { UnchainedHTTPServerContext } from './context.js';
import { createLogger } from '@unchainedshop/logger';
const logger = createLogger('unchained:api');

export interface UnchainedLocaleContext {
  countryCode: string;
  locale: Intl.Locale;
  currencyCode: string;
}
export type GetHeaderFn = (key: string) => string | string[];

const memoizeCache = new ExpiryMap(process.env.NODE_ENV === 'production' ? 1000 * 60 : 1); // Cached values expire after 10 seconds

export const resolveDefaultContext = pMemoize(
  async ({ acceptLang, acceptCountry }, unchainedAPI) => {
    const languages = await unchainedAPI.modules.languages.findLanguages(
      { includeInactive: false },
      { projection: { isoCode: 1, isActive: 1 } },
    );

    const countries = await unchainedAPI.modules.countries.findCountries(
      { includeInactive: false },
      { projection: { isoCode: 1, isActive: 1 } },
    );

    const currencies = await unchainedAPI.modules.currencies.findCurrencies({ includeInactive: false });

    const locale = resolveBestSupported(acceptLang, acceptCountry, { countries, languages });

    const defaultCurrencyCode = countries.find(
      (country) => country.isoCode.toUpperCase() === locale?.region?.toUpperCase(),
    )?.defaultCurrencyCode;

    const currencyCode = resolveBestCurrency(defaultCurrencyCode, currencies);

    logger.debug(`Locale Context: Resolved ${locale?.baseName} ${currencyCode}`);

    const newContext: UnchainedLocaleContext = {
      locale,
      countryCode: locale?.region,
      currencyCode,
    };

    return newContext;
  },
  {
    cache: memoizeCache,
    cacheKey: ([{ acceptLang, acceptCountry }]) => `${acceptLang}-${acceptCountry}`,
  },
);

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
