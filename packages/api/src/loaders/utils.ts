import { systemLocale } from '@unchainedshop/utils';

export function getLocaleStrings(locale: Intl.Locale) {
  try {
    return [
      ...new Set([locale.baseName, locale.language, systemLocale.baseName, systemLocale.language]),
    ];
  } catch {
    return [...new Set([systemLocale.baseName, systemLocale.language])];
  }
}

export function buildLocaleMap(
  queries: readonly { locale: Intl.Locale }[],
  texts: readonly { locale?: string }[],
): Record<string, string[]> {
  // key = texts.locale
  // value = input query locale

  const queryLocales = Object.values(
    Object.fromEntries(queries.map((q) => [q.locale.baseName, q.locale])),
  );

  const textLocales = [...new Set(texts.map((t) => t.locale))].filter(Boolean) as string[];
  const localeMap = {};
  for (const queryLocale of queryLocales) {
    const potentialMatches = getLocaleStrings(queryLocale);
    const matches = potentialMatches.filter((l) => textLocales.includes(l));
    for (const match of matches) {
      if (!localeMap[match]) localeMap[match] = [];
      localeMap[match].push(queryLocale);
    }
  }
  return localeMap;
}
