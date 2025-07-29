import { systemLocale } from '@unchainedshop/utils';

function getLocaleStrings(locale: Intl.Locale): string[] {
  try {
    const locales = new Set<string>();
    locales.add(locale.baseName);
    locales.add(locale.language);
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
  queries: readonly { locale: Intl.Locale }[],
  texts: readonly { locale?: string }[],
): Record<string, string[]> {
  // key = texts.locale
  // value = input query locale
  const queryLocales = new Set(queries.map((q) => q.locale));
  const textLocales = new Set(texts.map((t) => t.locale));
  const localeMap: Record<string, string[]> = {};
  for (const queryLocale of queryLocales) {
    const potentialMatches = getLocaleStrings(queryLocale);
    const matches = potentialMatches.filter((l) => textLocales.has(l));
    for (const match of matches) {
      if (!localeMap[match]) localeMap[match] = [];
      localeMap[match].push(queryLocale.toString());
    }
  }
  return localeMap;
}
