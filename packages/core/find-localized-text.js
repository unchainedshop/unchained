import LRU from 'lru-cache';
import { getFallbackLocale } from './locale-context';

const { NODE_ENV } = process.env;

const maxAge = NODE_ENV === 'production' ? 1000 * 30 : -1; // 5 seconds or 1 second

const textCache = new LRU({
  max: 50000,
  maxAge,
});

const extendSelectorWithLocale = (selector, locale) => {
  const localeSelector = {
    locale: { $in: [locale.normalized, locale.language] },
  };
  return {
    ...localeSelector,
    ...selector,
  };
};

const findLocalizedText = (collection, selector, locale) => {
  const cacheKey = JSON.stringify({
    n: collection._name, // eslint-disable-line
    s: selector,
    l: locale,
  });

  const cachedText = textCache.get(cacheKey);
  if (cachedText) return cachedText;

  const exactTranslation = collection.findOne(
    extendSelectorWithLocale(selector, locale),
  );
  if (exactTranslation) {
    textCache.set(cacheKey, exactTranslation);
    return exactTranslation;
  }

  const fallbackLocale = getFallbackLocale();
  if (fallbackLocale.normalized !== locale.normalized) {
    const fallbackTranslation = collection.findOne(
      extendSelectorWithLocale(selector, fallbackLocale),
    );
    if (fallbackTranslation) {
      textCache.set(cacheKey, fallbackTranslation);
      return fallbackTranslation;
    }
  }

  const foundText = collection.findOne(selector);
  textCache.set(cacheKey, foundText);
  return foundText;
};

export default findLocalizedText;
