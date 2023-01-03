import { Db } from '@unchainedshop/types/common.js';
import { Language } from '@unchainedshop/types/languages.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const LanguagesCollection = async (db: Db) => {
  const Languages = db.collection<Language>('languages');

  await buildDbIndexes<Language>(Languages, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: { isoCode: 'text', _id: 'text' },
      options: {
        weights: {
          _id: 8,
          isoCode: 6,
        },
        name: 'languages_fulltext_search',
      },
    },
  ]);

  return Languages;
};
