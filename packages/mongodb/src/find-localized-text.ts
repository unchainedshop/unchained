import type { Collection, Document, Filter } from 'mongodb';
import { systemLocale } from '@unchainedshop/utils';

const extendSelectorWithLocale = (selector, locale) => {
  const localeSelector = {
    locale: { $in: [locale.baseName, locale.language] },
  };
  return { ...localeSelector, ...selector };
};

export const findLocalizedText = async <T extends Document>(
  collection: Collection<T>,
  selector: Filter<T>,
  locale: Intl.Locale,
): Promise<T> => {
  const exactTranslation = await collection.findOne(extendSelectorWithLocale(selector, locale), {
    sort: { updated: -1 },
  });
  if (exactTranslation) {
    return exactTranslation as T;
  }

  if (systemLocale.baseName !== locale.baseName) {
    const fallbackTranslation = await collection.findOne(
      extendSelectorWithLocale(selector, systemLocale),
      {
        sort: { updated: -1 },
      },
    );
    if (fallbackTranslation) {
      return fallbackTranslation as T;
    }
  }

  const foundText = await collection.findOne(selector, {
    sort: { updated: -1 },
  });
  return foundText as T;
};

export default findLocalizedText;
