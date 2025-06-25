import { systemLocale } from '@unchainedshop/utils';

function getLocaleStrings(locale: string): string[] {
  try {
    const localeObj = new Intl.Locale(locale);
    // Optimized Set creation and spread
    const locales = new Set<string>();
    locales.add(localeObj.baseName);
    locales.add(localeObj.language);
    locales.add(systemLocale.baseName);
    locales.add(systemLocale.language);
    return Array.from(locales);
  } catch {
    // Optimized Set creation and spread
    const locales = new Set<string>();
    locales.add(systemLocale.baseName);
    locales.add(systemLocale.language);
    return Array.from(locales);
  }
}
export default function buildLocaleMap(
  queries: Readonly<Array<{ locale: string }>>,
  texts: Readonly<Array<{ locale?: string }>>,
): Record<string, string[]> {
  // key = texts.locale
  // value = input query locale
  const queryLocales = new Set(queries.map((q) => q.locale));
  const textLocales = new Set(texts.map((t) => t.locale));
  const localeMap = {};
  for (const queryLocale of queryLocales) {
    const potentialMatches = getLocaleStrings(queryLocale);
    const matches = potentialMatches.filter((l) => textLocales.has(l));
    for (const match of matches) {
      if (!localeMap[match]) localeMap[match] = [];
      localeMap[match].push(queryLocale);
    }
  }
  return localeMap;
}
