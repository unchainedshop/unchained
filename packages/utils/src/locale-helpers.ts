const { UNCHAINED_LANG = 'de', UNCHAINED_COUNTRY = 'CH', UNCHAINED_CURRENCY = 'CHF' } = process.env;

function parseAcceptLanguage(header: string): { locale: string; quality: number }[] {
  if (!header) return [];
  return header
    .split(',')
    .map((part) => {
      const [locale, ...params] = part.trim().split(';');
      const qParam = params.find((p) => p.trim().startsWith('q='));
      const quality = qParam ? parseFloat(qParam.trim().slice(2)) : 1;
      return { locale: locale.trim(), quality: Number.isNaN(quality) ? 0 : quality };
    })
    .sort((a, b) => b.quality - a.quality);
}

function resolveAcceptLanguage(
  acceptLanguage: string,
  supportedLocales: string[],
  defaultLocale: string,
): { match: string } {
  if (!supportedLocales.length) {
    return { match: defaultLocale };
  }

  const parsed = parseAcceptLanguage(acceptLanguage);

  for (const { locale } of parsed) {
    // Exact match (case-insensitive)
    const exact = supportedLocales.find((s) => s.toLowerCase() === locale.toLowerCase());
    if (exact) return { match: exact };

    // Language-only match: "de" matches "de-CH"
    const lang = locale.split('-')[0].toLowerCase();
    const langMatch = supportedLocales.find((s) => s.toLowerCase().startsWith(lang + '-'));
    if (langMatch) return { match: langMatch };
  }

  // Return default if it's in the supported list, otherwise first supported
  if (supportedLocales.includes(defaultLocale)) {
    return { match: defaultLocale };
  }
  return { match: supportedLocales[0] || defaultLocale };
}

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
