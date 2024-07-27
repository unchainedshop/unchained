import { Country } from '@unchainedshop/core-countries';
import { Currency } from '@unchainedshop/core-currencies';
import localePkg, { Locale, Locales } from 'locale';
import type { Locale as LocaleType, Locales as LocalesType } from 'locale';

const { UNCHAINED_LANG = 'de', UNCHAINED_COUNTRY = 'CH', UNCHAINED_CURRENCY = 'CHF' } = process.env;

export { Locale, Locales };

export const systemLocale = new localePkg.Locale(`${UNCHAINED_LANG}-${UNCHAINED_COUNTRY}`);

export const resolveBestSupported = (
  acceptLanguage: string,
  supportedLocales: LocalesType,
): LocaleType => {
  const acceptLocale = new localePkg.Locales(acceptLanguage);
  const bestLocale = acceptLocale.best(supportedLocales);
  if (!bestLocale) return systemLocale;
  return bestLocale;
};

export const resolveBestCountry = (
  localeCountry: string,
  shopCountry: string,
  countries: Array<Country>,
) => {
  if (shopCountry) {
    const resolvedCountry = countries.reduce<string>((lastResolved, country) => {
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

export const resolveBestCurrency = (localeCurrency: string, currencies: Array<Currency>) => {
  if (localeCurrency) {
    const resolvedCurrency = currencies.find((currency) => currency.isoCode === localeCurrency);
    if (resolvedCurrency) {
      return resolvedCurrency.isoCode;
    }
  }

  const fallbackCurrency = currencies.find((currency) => currency.isoCode === UNCHAINED_CURRENCY);
  if (fallbackCurrency) {
    return fallbackCurrency.isoCode;
  }

  return currencies?.[0]?.isoCode || UNCHAINED_CURRENCY;
};
