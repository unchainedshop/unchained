import { Locales, Locale } from 'locale';

const { LANG = 'de', COUNTRY = 'CH' } = process.env;

export const systemLocale = new Locale(`${LANG}-${COUNTRY}`);

export const resolveBestSupported = (acceptLanguage, supportedLocales) => {
  const acceptLocale = new Locales(acceptLanguage);
  const bestLocale = acceptLocale.best(supportedLocales);
  if (!bestLocale) return systemLocale;
  return bestLocale;
};

export const resolveBestCountry = (localeCountry, shopCountry, countries) => {
  if (shopCountry) {
    const resolvedCountry = countries.reduce((lastResolved, country) => {
      if (shopCountry === country.isoCode) {
        return country.isoCode;
      }
      return lastResolved;
    }, null);
    if (resolvedCountry) {
      return resolvedCountry;
    }
  }
  return localeCountry || systemLocale.country;
};

export const resolveUserRemoteAddress = (req) => {
  return (
    req.headers['x-real-ip'] ||
    req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
};
