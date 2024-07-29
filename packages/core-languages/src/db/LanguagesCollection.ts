import { mongodb, buildDbIndexes } from '@unchainedshop/mongodb';
import { Language } from '@unchainedshop/core-languages';

export const LanguagesCollection = async (db: mongodb.Db) => {
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
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return Languages;
};
