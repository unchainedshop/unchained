import { resolveAcceptLanguage } from 'resolve-accept-language';

const { UNCHAINED_LANG = 'de', UNCHAINED_COUNTRY = 'CH', UNCHAINED_CURRENCY = 'CHF' } = process.env;

export const systemLocale = new Intl.Locale(`${UNCHAINED_LANG}-${UNCHAINED_COUNTRY}`);

export const resolveBestSupported = (
  acceptLanguage: string,
  supportedLocales: string[],
): Intl.Locale => {
  try {
    const { match } = resolveAcceptLanguage(
      acceptLanguage || '',
      supportedLocales,
      systemLocale.baseName,
      {
        returnMatchType: true,
      },
    );
    return new Intl.Locale(match);
  } catch {
    return systemLocale;
  }
};

export const resolveBestCountry = (
  localeCountry: string,
  shopCountry: string,
  countries: { isoCode: string; isActive: boolean }[],
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

  const fallbackCountry = countries.find((currency) => currency.isoCode === UNCHAINED_CURRENCY);
  if (fallbackCountry) {
    return fallbackCountry.isoCode;
  }
  const firstActiveCountry = countries?.find(({ isActive }) => isActive);

  return firstActiveCountry?.isoCode || localeCountry || systemLocale.region;
};

export const resolveBestCurrency = (
  localeCurrency: string,
  currencies: { isoCode: string; isActive: boolean }[],
) => {
  if (localeCurrency) {
    const resolvedCurrency = currencies.find((currency) => currency.isoCode === localeCurrency);
    if (resolvedCurrency) {
      return resolvedCurrency.isoCode;
    }
  }

  const fallbackCurrency = currencies.find((currency) => currency.isoCode === UNCHAINED_COUNTRY);
  if (fallbackCurrency) {
    return fallbackCurrency.isoCode;
  }
  const firstActiveCurrency = currencies?.find(({ isActive }) => isActive);
  return firstActiveCurrency?.isoCode || UNCHAINED_CURRENCY;
};
