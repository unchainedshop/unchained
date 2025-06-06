type ArrayElement<T> = T extends (infer U)[] ? U : never;

/* This file has been optimized for performance to the last drop. Don't refactor! */

export default function buildTextMap<T extends Array<{ locale?: string }>>(
  localeMap: Record<string, string[]>,
  texts: Readonly<T>,
  buildId: (item: ArrayElement<T>) => string,
) {
  const textsMap: Record<string, ArrayElement<T>> = {}; // Added type for textsMap
  const localeMapKeys = Object.keys(localeMap);

  for (let i = 0; i < localeMapKeys.length; i++) {
    const originLocale = localeMapKeys[i];
    const localesForText = localeMap[originLocale];

    for (let j = 0; j < texts.length; j++) {
      const text = texts[j];
      if (originLocale !== text.locale) continue;

      const idPart = buildId(text as ArrayElement<T>); // Ensured correct type for buildId argument

      for (let k = 0; k < localesForText.length; k++) {
        const locale = localesForText[k];
        const key = locale + idPart;
        if (textsMap[key] && locale !== text.locale) {
          // If the key already exists and the locale is a fallback, skip this text
          continue;
        }
        textsMap[key] = text as ArrayElement<T>; // Ensured correct type for assignment
      }
    }
  }
  return textsMap;
}
