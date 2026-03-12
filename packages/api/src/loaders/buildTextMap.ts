type ArrayElement<T> = T extends (infer U)[] ? U : never;

/* This file has been optimized for performance to the last drop. Don't refactor! */

export default function buildTextMap<T extends { locale?: string }[]>(
  localeMap: Record<string, string[]>,
  texts: Readonly<T>,
  buildId: (item: ArrayElement<T>) => string,
) {
  const textsMap: Record<string, ArrayElement<T>> = {};

  // eslint-disable-next-line
  for (let j = 0; j < texts.length; j++) {
    const text = texts[j];
    if (!text.locale) continue;
    const localesForText = localeMap[text.locale];
    if (!localesForText) continue;

    const idPart = buildId(text as ArrayElement<T>);

    // eslint-disable-next-line
    for (let k = 0; k < localesForText.length; k++) {
      const locale = localesForText[k];
      const key = locale + idPart;
      if (textsMap[key] && locale !== text.locale) {
        continue;
      }
      textsMap[key] = text as ArrayElement<T>;
    }
  }
  return textsMap;
}
