import { Db } from '@unchainedshop/types/common.js';
import { Country } from '@unchainedshop/types/countries.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const CountriesCollection = async (db: Db) => {
  const Countries = db.collection<Country>('countries');

  await buildDbIndexes<Country>(Countries, [
    { index: { isoCode: 1 }, options: { unique: true } },
    {
      index: { isoCode: 'text', _id: 'text' },
      options: {
        weights: {
          _id: 8,
          isoCode: 6,
        },
        name: 'countries_fulltext_search',
      },
    },
  ]);

  return Countries;
};
