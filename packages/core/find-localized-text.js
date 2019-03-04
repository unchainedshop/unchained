import { getFallbackLocale } from "./locale-context";

const extendSelectorWithLocale = (selector, locale) => {
  const localeSelector = {
    locale: { $in: [locale.normalized, locale.language] }
  };
  return {
    ...localeSelector,
    ...selector
  };
};

const findLocalizedText = (collection, selector, locale) => {
  const exactTranslation = collection.findOne(
    extendSelectorWithLocale(selector, locale)
  );
  if (exactTranslation) return exactTranslation;

  const fallbackLocale = getFallbackLocale();
  if (fallbackLocale.normalized !== locale.normalized) {
    const fallbackTranslation = collection.findOne(
      extendSelectorWithLocale(selector, fallbackLocale)
    );
    if (fallbackTranslation) return fallbackTranslation;
  }

  return collection.findOne(selector);
};

export default findLocalizedText;
