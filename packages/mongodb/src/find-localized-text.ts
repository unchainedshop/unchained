import 'abort-controller/polyfill.js';
import { LRUCache } from 'lru-cache';
import { Locale } from '@unchainedshop/types/common.js';
import { Collection, Document, Filter } from 'mongodb';
import { systemLocale } from '@unchainedshop/utils';

const { NODE_ENV } = process.env;

const ttl = NODE_ENV === 'production' ? 1000 * 10 : 0; // 10 seconds or 0 seconds

const textCache = new LRUCache({ max: 50000, ttl });

const extendSelectorWithLocale = (selector, locale) => {
  const localeSelector = {
    locale: { $in: [locale.normalized, locale.language] },
  };
  return { ...localeSelector, ...selector };
};

export const findLocalizedText = async <T extends Document>(
  collection: Collection<T>,
  selector: Filter<T>,
  locale: Locale,
): Promise<T> => {
  const cacheKey = JSON.stringify({
    n: collection.collectionName, // eslint-disable-line
    s: selector,
    l: locale,
  });

  const cachedText = textCache.get(cacheKey);

  if (cachedText) return cachedText as T;

  const exactTranslation = await collection.findOne(extendSelectorWithLocale(selector, locale), {
    sort: { updated: -1 },
  });
  if (exactTranslation) {
    textCache.set(cacheKey, exactTranslation);
    return exactTranslation as T;
  }

  if (systemLocale.normalized !== locale.normalized) {
    const fallbackTranslation = await collection.findOne(
      extendSelectorWithLocale(selector, systemLocale),
      {
        sort: { updated: -1 },
      },
    );
    if (fallbackTranslation) {
      textCache.set(cacheKey, fallbackTranslation);
      return fallbackTranslation as T;
    }
  }

  const foundText = await collection.findOne(selector, {
    sort: { updated: -1 },
  });
  textCache.set(cacheKey, foundText);
  return foundText as T;
};

export default findLocalizedText;
