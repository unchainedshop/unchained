import { Db } from '@unchainedshop/types';
import { Language } from '@unchainedshop/types/languages';
import { buildDbIndexes } from 'meteor/unchained:utils'

export const LanguagesCollection = async (db: Db) => {
  const Languages = db.collection<Language>('languages');

  await buildDbIndexes<Language>(Languages, [
    () => Languages.createIndex({ isoCode: 1 }, { unique: true }),
  ]);

  return Languages;
};
