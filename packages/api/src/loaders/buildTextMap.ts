type ArrayElement<T> = T extends (infer U)[] ? U : never;

export default function buildTextMap<T extends Array<{ locale?: string }>>(
  localeMap: Record<string, string[]>,
  texts: Readonly<T>,
  buildId: (item: ArrayElement<T>) => string,
) {
  const textsMap = {};
  for (const [originLocale, localesForText] of Object.entries(localeMap)) {
    for (const text of texts) {
      if (originLocale !== text.locale) continue;
      for (const locale of localesForText) {
        if (textsMap[locale + buildId(text as any)]) continue;
        textsMap[locale + buildId(text as any)] = text;
      }
    }
  }
  return textsMap;
}
