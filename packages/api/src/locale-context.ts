import { log, LogLevel } from '@unchainedshop/logger';
import {
  resolveBestCountry,
  resolveBestSupported,
  resolveBestCurrency,
  systemLocale,
} from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/core';
import memoizee from 'memoizee';
import { UnchainedHTTPServerContext, UnchainedLocaleContext } from './types.js';

const { NODE_ENV } = process.env;

export type GetHeaderFn = (key: string) => string | string[];

export const resolveDefaultContext = memoizee(
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
    const countryContext = resolveBestCountry(localeContext.region, acceptCountry, countries);

    const countryObject = countries.find((country) => country.isoCode === countryContext);
    const currencyContext = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

    log(`Locale Context: Resolved ${localeContext.baseName} ${countryContext} ${currencyContext}`, {
      level: LogLevel.Debug,
    });

    const newContext: UnchainedLocaleContext = {
      localeContext,
      countryContext,
      currencyContext,
    };

    return newContext;
  },
  {
    maxAge: NODE_ENV === 'production' ? 1000 * 60 : 100, // minute or 100ms
    promise: true,
    normalizer(args) {
      return `${args[0].acceptLang}-${args[0].acceptCountry}`;
    },
  },
);

export const getLocaleContext = async (
  {
    remoteAddress,
    remotePort,
    getHeader,
  }: {
    remoteAddress: string;
    remotePort: number;
  } & UnchainedHTTPServerContext,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLocaleContext> => {
  const userAgent = getHeader('user-agent');
  const context = await resolveDefaultContext(
    { acceptLang: getHeader('accept-language'), acceptCountry: getHeader('x-shop-country') },
    unchainedAPI,
  );
  return { remoteAddress, remotePort, userAgent, ...context };
};
