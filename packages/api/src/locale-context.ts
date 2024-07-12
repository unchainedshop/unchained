import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedLocaleContext } from '@unchainedshop/types/api.js';
import localePkg from 'locale';
import { log, LogLevel } from '@unchainedshop/logger';
import {
  resolveBestCountry,
  resolveBestSupported,
  resolveBestCurrency,
  resolveUserRemoteAddress,
  systemLocale,
} from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import memoizee from 'memoizee';

const { Locales } = localePkg;

const { NODE_ENV } = process.env;

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

    const supportedLocaleStrings = languages.reduce((accumulator, language) => {
      const added = countries.map((country) => {
        return `${language.isoCode}-${country.isoCode}`;
      });
      return accumulator.concat(added);
    }, []);

    const supportedLocales = new Locales(supportedLocaleStrings, systemLocale.code);

    const localeContext = resolveBestSupported(acceptLang, supportedLocales);
    const countryContext = resolveBestCountry(localeContext.country, acceptCountry, countries);

    const countryObject = countries.find((country) => country.isoCode === countryContext);
    const currencyContext = resolveBestCurrency(countryObject.defaultCurrencyCode, currencies);

    log(`Locale Context: Resolved ${localeContext.normalized} ${countryContext} ${currencyContext}`, {
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
  req: IncomingMessage,
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLocaleContext> => {
  const userAgent = req.headers['user-agent'];
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);
  const context = await resolveDefaultContext(
    { acceptLang: req.headers['accept-language'], acceptCountry: req.headers['x-shop-country'] },
    unchainedAPI,
  );
  return { remoteAddress, remotePort, userAgent, ...context };
};
