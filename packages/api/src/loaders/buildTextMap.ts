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
        const key = locale + buildId(text as any);
        if (textsMap[key] && locale !== text.locale) {
          // If the key already exists and the locale is a fallback, skip this text
          continue;
        }
        textsMap[key] = text;
      }
    }
  }
  return textsMap;
}
