import { Db } from '@unchainedshop/types/common';
import { Country } from '@unchainedshop/types/countries';
import { buildDbIndexes } from 'meteor/unchained:utils';

export const CountriesCollection = async (db: Db) => {
  const Countries = db.collection<Country>('countries');

  await buildDbIndexes<Country>(Countries, [{ index: { isoCode: 1 }, options: { unique: true } }]);

  return Countries;
};
