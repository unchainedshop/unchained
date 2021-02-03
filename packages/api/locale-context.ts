import {
  resolveBestSupported,
  systemLocale,
  resolveBestCountry,
  resolveUserRemoteAddress,
} from 'meteor/unchained:utils';

import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { Languages } from 'meteor/unchained:core-languages';
import LRU from 'lru-cache';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const locale = require('locale');

export interface UnchainedServerLocaleContext {
  remoteAddress?: string;
  localeContext: any;
  countryContext: any;
}

const { NODE_ENV } = process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 60 : -1; // minute or second

const localeContextCache = new LRU({
  max: 500,
  maxAge,
});

const getLocaleContext = (req): UnchainedServerLocaleContext => {
  const cacheKey = `${req.headers['accept-language']}:${req.headers['x-shop-country']}`;
  const cachedContext = localeContextCache.get(cacheKey);

  const remoteAddress = resolveUserRemoteAddress(req);

  if (cachedContext) return { remoteAddress, ...cachedContext };

  // return the parsed locale by bcp47 and
  // return the best resolved normalized locale by locale according to system-wide configuration
  // else fallback to base language & base country
  const languages = Languages.find(
    { isActive: true },
    { fields: { isoCode: 1, isActive: 1 } }
  ).fetch();
  const countries = Countries.find(
    { isActive: true },
    { fields: { isoCode: 1, isActive: 1 } }
  ).fetch();

  const supportedLocaleStrings = languages.reduce((accumulator, language) => {
    const added = countries.map((country) => {
      return `${language.isoCode}-${country.isoCode}`;
    });
    return accumulator.concat(added);
  }, []);

  const supportedLocales = new locale.Locales(
    supportedLocaleStrings,
    systemLocale.code
  );
  const localeContext = resolveBestSupported(
    req.headers['accept-language'],
    supportedLocales
  );
  const countryContext = resolveBestCountry(
    localeContext.country,
    req.headers['x-shop-country'],
    countries
  );
  log(
    `Locale Context: Resolved ${localeContext.normalized} ${countryContext}`,
    { level: 'debug' }
  );
  const newContext = {
    localeContext,
    countryContext,
  };
  localeContextCache.set(cacheKey, newContext);

  return { remoteAddress, ...newContext };
};

export default getLocaleContext;
