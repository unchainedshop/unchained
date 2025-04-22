import {
  resolveBestCountry,
  resolveBestSupported,
  resolveBestCurrency,
  systemLocale,
} from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import pMemoize from 'p-memoize';
import ExpiryMap from 'expiry-map';
import { UnchainedHTTPServerContext } from './context.js';
import { createLogger } from '@unchainedshop/logger';
const logger = createLogger('unchained:api');

export interface UnchainedLocaleContext {
  countryCode: string;
  localeContext: Intl.Locale;
  currencyCode: string;
}
const { NODE_ENV } = process.env;

export type GetHeaderFn = (key: string) => string | string[];

const memoizeCache = new ExpiryMap(NODE_ENV === 'production' ? 1000 * 60 : 100); // Cached values expire after 10 seconds

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

    const supportedLocaleStrings: Array<string> = languages.reduce((accumulator, language) => {
      const added = countries.map((country) => {
        return `${language.isoCode}-${country.isoCode}`;
      });
      return accumulator.concat(added);
    }, []);

    const localeContext = resolveBestSupported(
      acceptLang,
      supportedLocaleStrings,
      systemLocale.baseName,
    );
    const countryCode = resolveBestCountry(localeContext.region, acceptCountry, countries);

    const countryObject = countries.find((country) => country.isoCode === countryCode);
    const currencyCode = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

    logger.debug(`Locale Context: Resolved ${localeContext.baseName} ${countryCode} ${currencyCode}`);

    const newContext: UnchainedLocaleContext = {
      localeContext,
      countryCode,
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
