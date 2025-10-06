import { resolveAcceptLanguage } from 'resolve-accept-language';

const { UNCHAINED_LANG = 'de', UNCHAINED_COUNTRY = 'CH', UNCHAINED_CURRENCY = 'CHF' } = process.env;

export const systemLocale = new Intl.Locale(`${UNCHAINED_LANG}-${UNCHAINED_COUNTRY}`);

export const determineFallbackLocale = (
  countries: { isoCode: string }[],
  languages: { isoCode: string }[],
): Intl.Locale => {
  try {
    const country =
      countries.find((country) => country.isoCode === systemLocale.region)?.isoCode ||
      countries[0]?.isoCode;
    const language =
      languages.find((language) => language.isoCode === systemLocale.language)?.isoCode ||
      languages[0]?.isoCode;
    return new Intl.Locale(`${language}-${country}`);
  } catch {
    return systemLocale;
  }
};

export const resolveBestSupported = (
  acceptLanguage: string,
  acceptCountry: string,
  {
    countries = [],
    languages = [],
  }: {
    countries: { isoCode: string }[];
    languages: { isoCode: string }[];
  },
): Intl.Locale => {
  const supportedLocales: string[] = languages.reduce<string[]>((accumulator, language) => {
    const added = countries
      .filter((country) => {
        if (acceptCountry) {
          return country.isoCode === acceptCountry;
        }
        return true;
      })
      .map((country) => {
        return `${language.isoCode}-${country.isoCode}`;
      });
    return accumulator.concat(added);
  }, []);

  const fallbackLocale = determineFallbackLocale(countries, languages);

  try {
    const { match } = resolveAcceptLanguage(
      acceptLanguage || '',
      supportedLocales,
      fallbackLocale.baseName,
      {
        returnMatchType: true,
      },
    );
    return new Intl.Locale(match);
  } catch {
    return fallbackLocale;
  }
};

export const resolveBestCurrency = (currencyCode: string | null, currencies: { isoCode: string }[]) => {
  if (currencyCode) {
    const resolvedCurrency = currencies.find(
      (currency) => currency.isoCode.toUpperCase() === currencyCode.toUpperCase(),
    );
    if (resolvedCurrency) {
      return resolvedCurrency.isoCode;
    }
  }
  return (
    currencies.find((currency) => currency.isoCode === UNCHAINED_CURRENCY)?.isoCode ||
    currencies[0]?.isoCode
  );
};
