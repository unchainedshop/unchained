import LRU from 'lru-cache';
import { systemLocale } from './locale-helpers';

const { NODE_ENV } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 30 : 0; // 30 seconds or 1 second

const textCache = new LRU({ max: 50000, ttl });

const extendSelectorWithLocale = (selector, locale) => {
  const localeSelector = {
    locale: { $in: [locale.normalized, locale.language] },
  };
  return { ...localeSelector, ...selector };
};

const findLocalizedText = async (collection, selector, locale) => {
  const cacheKey = JSON.stringify({
    n: collection._name, // eslint-disable-line
    s: selector,
    l: locale,
  });

  const cachedText = textCache.get(cacheKey);

  if (cachedText) return cachedText;

  const exactTranslation = await collection.findOne(extendSelectorWithLocale(selector, locale));
  if (exactTranslation) {
    textCache.set(cacheKey, exactTranslation);
    return exactTranslation;
  }

  if (systemLocale.normalized !== locale.normalized) {
    const fallbackTranslation = await collection.findOne(
      extendSelectorWithLocale(selector, systemLocale),
    );
    if (fallbackTranslation) {
      textCache.set(cacheKey, fallbackTranslation);
      return fallbackTranslation;
    }
  }

  const foundText = await collection.findOne(selector, {});
  textCache.set(cacheKey, foundText);
  return foundText;
};

export default findLocalizedText;
