import { UnchainedAPI, UnchainedLocaleContext } from '@unchainedshop/types/api';
import { IncomingMessage } from 'http';
import localePkg from 'locale';
import 'abort-controller/polyfill';
import LRU from 'lru-cache';
import { log, LogLevel } from '@unchainedshop/logger';
import {
  resolveBestCountry,
  resolveBestSupported,
  resolveUserRemoteAddress,
  systemLocale,
} from '@unchainedshop/utils';

const { Locales } = localePkg;

const { NODE_ENV } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 60 : 0; // minute or second

const localeContextCache = new LRU({
  max: 500,
  ttl,
});

export const getLocaleContext = async (
  req: IncomingMessage,
  unchainedAPI: UnchainedAPI,
): Promise<UnchainedLocaleContext> => {
  const cacheKey = `${req.headers['accept-language']}:${req.headers['x-shop-country']}`;
  const cachedContext = localeContextCache.get(cacheKey);

  const userAgent = req.headers['user-agent'];
  const { remoteAddress, remotePort } = resolveUserRemoteAddress(req);

  if (cachedContext) return { remoteAddress, remotePort, userAgent, ...cachedContext };

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
  const newContext: UnchainedLocaleContext = {
    localeContext,
    countryContext,
  };
  localeContextCache.set(cacheKey, newContext);

  return { remoteAddress, remotePort, userAgent, ...newContext };
};
