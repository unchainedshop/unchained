import { IncomingMessage, OutgoingMessage } from 'http';
import { UnchainedLocaleContext } from '@unchainedshop/types/api.js';
import localePkg from 'locale';
import 'abort-controller/polyfill.js';
import { log, LogLevel } from '@unchainedshop/logger';
import {
  resolveBestCountry,
  resolveBestSupported,
  resolveUserRemoteAddress,
  systemLocale,
} from '@unchainedshop/utils';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import * as lruCache from 'lru-cache';

const { Locales } = localePkg;

const { NODE_ENV } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 60 : 0; // minute or second

const localeContextCache = new lruCache.LRUCache({
  max: 500,
  ttl,
});

const { UNCHAINED_CURRENCY = 'CHF' } = process.env;

export const getLocaleContext = async (
  req: IncomingMessage,
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLocaleContext> => {
  const cacheKey = `${req.headers['accept-language']}:${req.headers['x-shop-country']}`;
  const cachedContext = localeContextCache.get(cacheKey) as UnchainedLocaleContext;

  const userAgent = req.headers['user-agent'];
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

  if (cachedContext) return { remoteAddress, remotePort, userAgent, ...cachedContext };

  console.log('LOCALE CONTEXT CACHE MISS');
  // return the parsed locale by bcp47 and
  // return the best resolved normalized locale by locale according to system-wide configuration
  // else fallback to base language & base country

  const languages = await unchainedAPI.modules.languages.findLanguages(
    { includeInactive: false },
    { projection: { isoCode: 1, isActive: 1 } },
  );

  const countries = await unchainedAPI.modules.countries.findCountries(
    { includeInactive: false },
    { projection: { isoCode: 1, isActive: 1 } },
  );

  const supportedLocaleStrings = languages.reduce((accumulator, language) => {
    const added = countries.map((country) => {
      return `${language.isoCode}-${country.isoCode}`;
    });
    return accumulator.concat(added);
  }, []);

  const supportedLocales = new Locales(supportedLocaleStrings, systemLocale.code);

  const localeContext = resolveBestSupported(req.headers['accept-language'], supportedLocales);
  const countryContext = resolveBestCountry(
    localeContext.country,
    req.headers['x-shop-country'],
    countries,
  );
  log(`Locale Context: Resolved ${localeContext.normalized} ${countryContext}`, {
    level: LogLevel.Debug,
  });

  const countryObject = countries.find((country) => country.isoCode === countryContext);
  const currencyObject =
    countryObject?.defaultCurrencyId &&
    (await unchainedAPI.modules.currencies.findCurrency({
      currencyId: countryObject.defaultCurrencyId,
    }));

  const currencyContext = currencyObject?.isoCode || UNCHAINED_CURRENCY;

  const newContext: UnchainedLocaleContext = {
    localeContext,
    countryContext,
    currencyContext,
  };
  localeContextCache.set(cacheKey, newContext);

  return { remoteAddress, remotePort, userAgent, ...newContext };
};
