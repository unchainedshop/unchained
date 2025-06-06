import { systemLocale } from '@unchainedshop/utils';

function getLocaleStrings(locale: string) {
  try {
    const localeObj = new Intl.Locale(locale);
    return [
      ...new Set([localeObj.baseName, localeObj.language, systemLocale.baseName, systemLocale.language]),
    ];
  } catch {
    return [...new Set([systemLocale.baseName, systemLocale.language])];
  }
}
export default function buildLocaleMap(
  queries: Readonly<Array<{ locale: string }>>,
  texts: Readonly<Array<{ locale?: string }>>,
): Record<string, string[]> {
  // key = texts.locale
  // value = input query locale
  const queryLocales: Array<any> = [...new Set(queries.map((q) => q.locale))];
  const textLocales: Array<string> = [...new Set(texts.map((t) => t.locale))];
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