import { Db } from '@unchainedshop/types/common';
import { Language } from '@unchainedshop/types/languages';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const LanguagesCollection = async (db: Db) => {
  const Languages = db.collection<Language>('languages');

  await buildDbIndexes<Language>(Languages, [
    { index: { isoCode: 1 }, options: { unique: true } },
    { index: { isoCode: 'text' } },
  ]);

  return Languages;
};
