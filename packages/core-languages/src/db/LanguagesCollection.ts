import {
  type TimestampFields,
  buildDbIndexes,
  isDocumentDBCompatModeEnabled,
  mongodb,
} from '@unchainedshop/mongodb';

export type Language = {
  _id: string;
  isoCode: string;
  isActive?: boolean;
} & TimestampFields;

export const LanguagesCollection = async (db: mongodb.Db) => {
  const Languages = db.collection<Language>('languages');

  if (!isDocumentDBCompatModeEnabled()) {
    await buildDbIndexes<Language>(Languages, [
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
  }

  await buildDbIndexes<Language>(Languages, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: {
        deleted: 1,
      },
    },
  ]);

  return Languages;
};
